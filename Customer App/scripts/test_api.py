import urllib.request
import json

url = 'http://localhost:5000/api/v1/cafes?lat=11.0326883&lon=77.0345773&category=Caf%C3%A9s&maxDistance=5'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    cafes = data.get('cafes', [])
    print(f"Total cafes returned: {len(cafes)}")
    for c in cafes:
        print(f" - {c['name']} | Category: {c.get('category')} | calc_dist: {c.get('calculated_distance_km')} | dist_psg: {c.get('distance_psg_cas_km')} | Rating: {c.get('rating')}")
