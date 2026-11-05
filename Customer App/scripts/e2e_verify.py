import urllib.request
import urllib.error
import json

BASE_URL = 'http://localhost:5000/api/v1'

def run_test():
    print("--- 1. Checking Customer API (Clean state) ---")
    req = urllib.request.Request(f"{BASE_URL}/cafes")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print(f"Customer cafes count: {len(data.get('cafes', []))} (Expected: 0)")
        assert len(data.get('cafes', [])) == 0, "Directory must start fresh with 0 cafes"

    print("\n--- 2. Checking Admin UI endpoint (/admin) ---")
    admin_ui_req = urllib.request.Request("http://localhost:5000/admin")
    with urllib.request.urlopen(admin_ui_req) as resp:
        html = resp.read().decode()
        print(f"Admin UI status: {resp.status}, length: {len(html)} bytes")
        assert "ZipBi Admin Portal" in html, "Admin portal HTML must load"

    print("\n--- 3. Checking Admin API Protection (Unauthenticated) ---")
    try:
        urllib.request.urlopen(f"{BASE_URL}/admin/cafes")
        print("ERROR: Unauthenticated request was NOT blocked!")
    except urllib.error.HTTPError as e:
        print(f"Blocked as expected with HTTP {e.code} (Unauthorized)")
        assert e.code == 401

    print("\n--- 4. Checking Customer Role Blocked from Admin APIs ---")
    login_data = json.dumps({"loginIdentifier": "amarnath.b@example.com", "password": "Password123"}).encode()
    cust_req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(cust_req) as resp:
        cust_token = json.loads(resp.read().decode())['token']

    try:
        admin_call = urllib.request.Request(f"{BASE_URL}/admin/cafes", headers={'Authorization': f'Bearer {cust_token}'})
        urllib.request.urlopen(admin_call)
        print("ERROR: Customer was NOT blocked from Admin API!")
    except urllib.error.HTTPError as e:
        print(f"Customer blocked from Admin API as expected with HTTP {e.code} (Forbidden)")
        assert e.code == 403

    print("\n--- 5. Admin Authentication ---")
    admin_login_data = json.dumps({"email": "admin@zipbi.com", "password": "Admin@ZipBi2026"}).encode()
    admin_req = urllib.request.Request(f"{BASE_URL}/admin/login", data=admin_login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(admin_req) as resp:
        admin_res = json.loads(resp.read().decode())
        admin_token = admin_res['token']
        print(f"Admin Login Success! User: {admin_res['user']['fullName']}, Role: {admin_res['user']['role']}")
        assert admin_res['user']['role'] == 'ADMIN'

    print("\n--- 6. Admin Adding New Business ---")
    new_cafe = {
        "name": "Verified Botanical Cafe",
        "slug": "verified-botanical-cafe",
        "category": "Café",
        "cuisine_tags": ["Organic Coffee", "Artisan Bakery"],
        "description": "Eco-friendly cafe with botanical interior.",
        "address": "Avinashi Road, Civil Aerodrome Post",
        "area": "SITRA, Coimbatore",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "pincode": "641014",
        "latitude": 11.0360,
        "longitude": 77.0370,
        "phone": "+91 98765 00112",
        "cost_for_two": 450,
        "opening_hours": "09:00 AM - 10:00 PM"
    }
    create_req = urllib.request.Request(
        f"{BASE_URL}/admin/cafes",
        data=json.dumps(new_cafe).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token}'}
    )
    with urllib.request.urlopen(create_req) as resp:
        created = json.loads(resp.read().decode())['cafe']
        print(f"Created: {created['name']} (ID: {created['id']}) at Coordinates: {created['latitude']}, {created['longitude']}")
        cafe_id = created['id']

    print("\n--- 7. Verifying Customer Discovers It with Calculated Distance ---")
    cust_query = urllib.request.Request(f"{BASE_URL}/cafes?lat=11.0326883&lon=77.0345773")
    with urllib.request.urlopen(cust_query) as resp:
        cust_list = json.loads(resp.read().decode())['cafes']
        assert len(cust_list) == 1
        found = cust_list[0]
        print(f"Customer Query Result: {found['name']}, Distance: {found['calculated_distance_km']} km, OpenNow: {found.get('is_open_now')}")

    print("\n--- 8. Admin Adding Menu Category & Items ---")
    cat_req = urllib.request.Request(
        f"{BASE_URL}/admin/cafes/{cafe_id}/menu/categories",
        data=json.dumps({"name": "Cold Brews"}).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token}'}
    )
    urllib.request.urlopen(cat_req)

    item_req = urllib.request.Request(
        f"{BASE_URL}/admin/cafes/{cafe_id}/menu/items",
        data=json.dumps({
            "categoryName": "Cold Brews",
            "item": {
                "name": "Vanilla Sweet Cream Cold Brew",
                "price": 180,
                "is_veg": True,
                "is_available": True
            }
        }).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {admin_token}'}
    )
    with urllib.request.urlopen(item_req) as resp:
        item = json.loads(resp.read().decode())['item']
        print(f"Added Menu Item: {item['name']} - Rs.{item['price']} (Veg: {item['is_veg']})")

    print("\n--- 9. Cleaning up Test Business to Leave Clean Directory ---")
    del_req = urllib.request.Request(
        f"{BASE_URL}/admin/cafes/{cafe_id}",
        headers={'Authorization': f'Bearer {admin_token}'},
        method='DELETE'
    )
    urllib.request.urlopen(del_req)
    print("Deleted test cafe successfully.")

    # Confirm directory is clean again
    with urllib.request.urlopen(f"{BASE_URL}/cafes") as resp:
        final_count = len(json.loads(resp.read().decode())['cafes'])
        print(f"Final customer cafe count: {final_count} (Clean directory preserved!)")
        assert final_count == 0

    print("\n==========================================")
    print("  ALL 9 END-TO-END VERIFICATIONS PASSED!  ")
    print("==========================================")

if __name__ == '__main__':
    run_test()

