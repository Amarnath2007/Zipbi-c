import os
import urllib.request
from PIL import Image

OUTPUT_DIR = "assets/images/cafes"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

CAFE_IMAGES = {
    # 1. The German Cafe - European cozy bistro
    "german_cafe": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1280&q=85",
    # 2. Rest In Peace Cafe - Proper, relevant stylish cafe interior with warm lighting & comfortable booth seating
    "rip_cafe": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1280&q=85",
    # 3. Terminal 2 - Modern airport terminal lounge dining hall
    "terminal_2": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280&q=85",
    # 5. Dark Knight - Dark-themed superhero modern lounge
    "dark_knight": "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1280&q=85",
    # 6. Cafe Talks - Bright airy cafe with wooden furniture & indoor plants
    "cafe_talks": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1280&q=85",
    # 7. Juice World - Fresh juice and beverage bar counter
    "juice_world": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1280&q=85",
    # 8. Zesty Mania - Contemporary waffle & dessert cafe
    "zesty_mania": "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=1280&q=85",
    # 9. Kovai Brews - Pizzeria & coffee house with rustic brick & warm lights
    "kovai_brews": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1280&q=85",
    # 10. Refresh Cafe - Casual bright family cafe & restaurant
    "refresh_cafe": "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=1280&q=85",
    # 11. Friends Zone Cafe - Modern bakery, cakes & dessert cafe
    "friends_zone": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1280&q=85",
    # 12. Dee Chill Cafe - Traditional tea & quick refreshment counter
    "dee_chill": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1280&q=85",
    # 13. Den Cafe - Cozy neighborhood coffee nook
    "den_cafe": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1280&q=85",
    # 14. Rain Cafe - Garden-inspired cafe with indoor natural light
    "rain_cafe": "https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?w=1280&q=85",
    # 15. Sandsha Cafe - 24/7 highway transit tea & coffee cafe
    "sandsha_cafe": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1280&q=85",
}

def download_and_crop(url, out_path):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
    temp_path = out_path + ".tmp"
    with open(temp_path, "wb") as f:
        f.write(data)
    im = Image.open(temp_path).convert("RGB")
    target_w, target_h = 1200, 675
    src_w, src_h = im.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    im = im.crop((left, top, left + target_w, top + target_h))
    im.save(out_path, "JPEG", quality=90)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    print(f"Saved {out_path}: {os.path.getsize(out_path)} bytes (1200x675)")

def main():
    print("=== Downloading distinct, high-res photos for all businesses ===")
    for key, url in CAFE_IMAGES.items():
        out_path = os.path.join(OUTPUT_DIR, f"{key}.jpg")
        try:
            download_and_crop(url, out_path)
        except Exception as e:
            print(f"Error downloading for {key}: {e}")

if __name__ == "__main__":
    main()

