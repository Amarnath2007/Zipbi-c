import os
import re
import urllib.request
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def check_haribhavanam():
    data = fetch_url('https://haribhavanam.com')
    if data:
        html = data.decode('utf-8', errors='ignore')
        matches = re.findall(r'https?://[^\s"\']+\.(?:jpg|jpeg|png|webp)', html)
        print("Haribhavanam images found:", len(matches))
        for m in matches:
            if 'terminal' in m.lower() or 'brand' in m.lower() or 'outlet' in m.lower():
                print("Match:", m)

if __name__ == '__main__':
    check_haribhavanam()

