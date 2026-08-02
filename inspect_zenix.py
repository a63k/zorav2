import urllib.request
import re
from pathlib import Path

url = "https://zenix.best/embed/27676?v=3"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://zenix.best/movie/spider-man-brand-new-day"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    with open("embed_page.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("Saved embed_page.html, size:", len(html))

    # Find m3u8 or mp4 links or source definitions
    matches = re.findall(r'(https?://[^\s"\':<>]+(?:\.m3u8|\.mp4)[^\s"\':<>]*)', html)
    print("Found direct stream URLs:", len(matches))
    for m in set(matches):
        print("STREAM:", m)

    # Check for player source variables
    sources = re.findall(r'file\s*:\s*["\']([^"\']+)["\']', html)
    print("Player file sources:", sources)

    srcs = re.findall(r'src\s*:\s*["\']([^"\']+)["\']', html)
    print("Player src sources:", srcs)

except Exception as e:
    print("Error:", e)
