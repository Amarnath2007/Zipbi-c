import urllib.request

try:
    url1 = 'http://localhost:3000/assets/assets/data/cafes.json'
    with urllib.request.urlopen(url1) as resp:
        print(f"URL1 status: {resp.status}, length: {len(resp.read())}")
except Exception as e:
    print(f"URL1 failed: {e}")

try:
    url2 = 'http://localhost:3000/assets/data/cafes.json'
    with urllib.request.urlopen(url2) as resp:
        print(f"URL2 status: {resp.status}, length: {len(resp.read())}")
except Exception as e:
    print(f"URL2 failed: {e}")

