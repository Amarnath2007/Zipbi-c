import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for url in ['https://terminal2cafe.com', 'https://shadowlightscafe.in']:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
            print(f"=== {url} ===")
            for img in imgs[:5]:
                print(" ", img)
    except Exception as e:
        print(f"Error {url}: {e}")

