import urllib.request
import re
import base64

def get_direct_video_url(movie_url):
    print(f"Fetching movie page: {movie_url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    req = urllib.request.Request(movie_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8", errors="ignore")

    # Find the embed player URL
    embed_match = re.search(r'https?://zenix\.best/embed/[^\s"\':<>]+', html)
    if not embed_match:
        print(" ❌ No embed URL found on movie page.")
        return None

    embed_url = embed_match.group(0)
    print(f" -> Found embed URL: {embed_url}")

    # Fetch embed page
    headers["Referer"] = movie_url
    req_embed = urllib.request.Request(embed_url, headers=headers)
    with urllib.request.urlopen(req_embed) as resp:
        embed_html = resp.read().decode("utf-8", errors="ignore")

    # Extract encrypted-source
    enc_match = re.search(r'id=["\']encrypted-source["\'][^>]*value=["\']([^"\']+)["\']', embed_html)
    if not enc_match:
        # Check reverse attribute order
        enc_match = re.search(r'value=["\']([^"\']+)["\'][^>]*id=["\']encrypted-source["\']', embed_html)

    if not enc_match:
        print(" ❌ Encrypted source input not found in embed page.")
        return None

    encoded_val = enc_match.group(1)
    direct_url = base64.b64decode(encoded_val).decode("utf-8")
    print(f" -> Successfully decoded direct video URL:\n    {direct_url}\n")
    return direct_url

if __name__ == "__main__":
    # Test with Supergirl (Movie #2)
    url = "https://zenix.best/movie/supergirl"
    get_direct_video_url(url)
