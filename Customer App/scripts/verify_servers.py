import urllib.request
import json

print("=== CHECKING PORT 3000 (Flutter Web) ===")
try:
    with urllib.request.urlopen('http://localhost:3000') as resp:
        print(f"Web server root HTTP status: {resp.status}")
except Exception as e:
    print(f"Web server failed: {e}")

try:
    with urllib.request.urlopen('http://localhost:3000/assets/assets/data/cafes.json') as resp:
        print(f"Web bundled cafes asset HTTP status: {resp.status}")
except Exception as e:
    print(f"Web asset failed: {e}")

print("\n=== CHECKING PORT 5000 (Backend API) ===")
try:
    with urllib.request.urlopen('http://localhost:5000/api/v1/health') as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Health API status: {resp.status}, response: {data}")
except Exception as e:
    print(f"Health API failed: {e}")

try:
    with urllib.request.urlopen('http://localhost:5000/api/v1/cafes') as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Cafes API status: {resp.status}, count: {data.get('count')}")
        rip = next((c for c in data.get('cafes', []) if 'rest-in-peace' in c.get('id', '')), None)
        if rip:
            print(f"RIP Cafe found! Image: {rip.get('cover_image')}, Lat/Lon: {rip.get('latitude')},{rip.get('longitude')}, Menu items: {len(rip.get('menu_categories', []))}")
except Exception as e:
    print(f"Cafes API failed: {e}")

