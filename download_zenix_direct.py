import os
import re
import sys
import time
import csv
import base64
import urllib.request
from pathlib import Path

# Force UTF-8 output encoding for Windows terminal compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Paths
BASE_DIR = Path(__file__).parent
CSV_FILE = BASE_DIR / "top_30_films_et_10_series_zenix.csv"
TXT_FILE = BASE_DIR / "top_30_films_et_10_series.txt"
OUTPUT_DIR = BASE_DIR / "films_zenix_telecharges"

# Headers for Zenix requests
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
}

def clean_filename(name):
    """Sanitizes filename for Windows OS"""
    return re.sub(r'[\\/*?:"<>|]', '', name).strip()

def load_media_list():
    """Loads list of movies/series from CSV or TXT file"""
    items = []
    
    if CSV_FILE.exists():
        print(f"[+] Chargement depuis CSV: {CSV_FILE.name}")
        with open(CSV_FILE, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f, delimiter=";")
            header = next(reader, None)
            for row in reader:
                if len(row) >= 9:
                    media_type = row[1].strip()  # Film or Série
                    title = row[2].strip().strip('"')
                    year = row[4].strip()
                    zenix_url = row[8].strip()
                    if zenix_url and zenix_url.startswith("http"):
                        items.append({
                            "type": media_type,
                            "title": title,
                            "year": year,
                            "url": zenix_url,
                            "filename": clean_filename(f"{title} ({year})")
                        })
    elif TXT_FILE.exists():
        print(f"[+] Chargement depuis TXT: {TXT_FILE.name}")
        with open(TXT_FILE, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        pattern = r"^\s*\d+\.\s*(.*?)\s*\((.*?)\).*?\[TMDB ID:\s*(\d+)\]"
        for line in content.splitlines():
            m = re.search(pattern, line)
            if m:
                title = m.group(1).strip()
                year = m.group(2).strip()
                clean_title = clean_filename(title)
                slug = clean_title.lower().replace("'", "-").replace(" ", "-")
                slug = re.sub(r'[^a-z0-9\-]', '', slug)
                items.append({
                    "type": "Film",
                    "title": title,
                    "year": year,
                    "url": f"https://zenix.best/movie/{slug}",
                    "filename": clean_filename(f"{title} ({year})")
                })
    return items

def extract_direct_video_url(zenix_url):
    """
    Extracts the direct .mp4 streaming URL from a Zenix page:
    1. Fetches the Zenix movie/show page
    2. Finds the zenix.best/embed/[id] link
    3. Fetches the embed player page
    4. Decodes the base64 encrypted-source tag
    """
    try:
        req = urllib.request.Request(zenix_url, headers=DEFAULT_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        embed_match = re.search(r'https?://zenix\.best/embed/[^\s"\':<>]+', html)
        if not embed_match:
            print(" [X] Impossible de trouver l'iframe de lecture.")
            return None

        embed_url = embed_match.group(0)

        embed_headers = DEFAULT_HEADERS.copy()
        embed_headers["Referer"] = zenix_url
        req_embed = urllib.request.Request(embed_url, headers=embed_headers)
        with urllib.request.urlopen(req_embed, timeout=15) as resp:
            embed_html = resp.read().decode("utf-8", errors="ignore")

        enc_match = re.search(r'id=["\']encrypted-source["\'][^>]*value=["\']([^"\']+)["\']', embed_html)
        if not enc_match:
            enc_match = re.search(r'value=["\']([^"\']+)["\'][^>]*id=["\']encrypted-source["\']', embed_html)

        if not enc_match:
            print(" [X] Balise 'encrypted-source' introuvable dans le lecteur.")
            return None

        encoded_val = enc_match.group(1)
        direct_mp4_url = base64.b64decode(encoded_val).decode("utf-8")
        return direct_mp4_url

    except Exception as e:
        print(f" [X] Erreur lors de l'extraction : {e}")
        return None

def download_stream(direct_url, destination_path):
    """
    Downloads the MP4 stream chunk by chunk with real-time speed, MB, and progress bar
    """
    headers = DEFAULT_HEADERS.copy()
    headers["Referer"] = "https://zenix.best/"
    
    req = urllib.request.Request(direct_url, headers=headers)
    temp_path = destination_path.with_suffix(".mp4.part")

    start_bytes = 0
    if temp_path.exists():
        start_bytes = temp_path.stat().st_size
        headers["Range"] = f"bytes={start_bytes}-"
        req = urllib.request.Request(direct_url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            total_bytes = resp.headers.get("Content-Length")
            if total_bytes:
                total_bytes = int(total_bytes) + start_bytes
            else:
                total_bytes = 0

            mode = "ab" if start_bytes > 0 else "wb"
            downloaded = start_bytes
            chunk_size = 1024 * 512  # 512 KB chunks

            start_time = time.time()
            last_update = start_time

            with open(temp_path, mode) as f:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)

                    now = time.time()
                    if now - last_update >= 0.5 or (total_bytes and downloaded >= total_bytes):
                        elapsed = now - start_time if (now - start_time) > 0 else 0.001
                        speed_mbps = ((downloaded - start_bytes) / (1024 * 1024)) / elapsed
                        
                        if total_bytes > 0:
                            percent = (downloaded / total_bytes) * 100
                            mb_done = downloaded / (1024 * 1024)
                            mb_total = total_bytes / (1024 * 1024)
                            eta = (total_bytes - downloaded) / (speed_mbps * 1024 * 1024) if speed_mbps > 0 else 0
                            
                            bar_len = 30
                            filled = int(bar_len * percent / 100)
                            bar = "=" * filled + ">" + "." * (bar_len - filled - 1) if filled < bar_len else "=" * bar_len
                            
                            sys.stdout.write(
                                f"\r    [{bar}] {percent:5.1f}% | {mb_done:.1f}/{mb_total:.1f} MB | {speed_mbps:.2f} MB/s | ETA: {int(eta)}s "
                            )
                        else:
                            mb_done = downloaded / (1024 * 1024)
                            sys.stdout.write(f"\r    Téléchargé: {mb_done:.1f} MB | Vitesse: {speed_mbps:.2f} MB/s ")
                        sys.stdout.flush()
                        last_update = now

        print("\n")
        temp_path.rename(destination_path)
        return True

    except Exception as e:
        print(f"\n [X] Erreur lors du téléchargement : {e}")
        return False

def main():
    print("==================================================")
    print("      TELECHARGEUR AUTOMATIQUE ZENIX BEST         ")
    print("==================================================")
    
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"[*] Dossier de destination : {OUTPUT_DIR.resolve()}\n")

    items = load_media_list()
    if not items:
        print(" [X] Aucun film/série trouvé dans les fichiers CSV/TXT.")
        return

    print(f"[*] Total medias a traiter : {len(items)}\n")

    for i, item in enumerate(items, start=1):
        target_file = OUTPUT_DIR / f"{item['filename']}.mp4"
        
        print(f"[{i}/{len(items)}] {item['type'].upper()} : {item['title']} ({item['year']})")

        if target_file.exists() and target_file.stat().st_size > 10 * 1024 * 1024:
            print(f" [->] Deja telecharge ({target_file.stat().st_size / (1024*1024):.1f} MB). Passage au suivant.\n")
            continue

        print(f" [?] Recuperation du flux Zenix : {item['url']}")
        direct_url = extract_direct_video_url(item["url"])

        if not direct_url:
            print(f" [!] Impossible d'obtenir la video pour {item['title']}. Passage au suivant.\n")
            continue

        print(f" [v] Lancement du telechargement direct...")
        success = download_stream(direct_url, target_file)

        if success:
            print(f" [OK] Telechargement reussi : {target_file.name}\n")
        else:
            print(f" [X] Telechargement echoue pour {item['title']}.\n")

        print("Attente de 2 secondes avant le media suivant...\n")
        time.sleep(2)

    print("=== Tous les telechargements de la liste sont termines ! ===")

if __name__ == "__main__":
    main()
