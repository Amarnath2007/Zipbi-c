const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { parseAddressComponents, reverseGeocodeCoordinates } = require('../src/utils/googleMapsResolver');

let server;
let baseUrl;
let adminToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });

  // Authenticate as Admin
  const res = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  adminToken = data.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Address Component Parser prefers specific sublocality/neighbourhood over generic city', () => {
  // Test Case A: Google Geocoding API response format (long_name)
  const geocodingComponents = [
    { long_name: 'Shop 4, Ground Floor', types: ['premise'] },
    { long_name: 'Avinashi Road', types: ['route'] },
    { long_name: 'SITRA', types: ['sublocality_level_1', 'sublocality', 'political'] },
    { long_name: 'Civil Aerodrome Post', types: ['neighborhood', 'political'] },
    { long_name: 'Coimbatore', types: ['locality', 'political'] },
    { long_name: 'Coimbatore', types: ['administrative_area_level_2', 'political'] },
    { long_name: 'Tamil Nadu', types: ['administrative_area_level_1', 'political'] },
    { long_name: '641014', types: ['postal_code'] },
    { long_name: 'India', types: ['country', 'political'] },
  ];

  const parsedA = parseAddressComponents(geocodingComponents);
  assert.strictEqual(parsedA.area, 'SITRA');
  assert.strictEqual(parsedA.city, 'Coimbatore');
  assert.strictEqual(parsedA.district, 'Coimbatore');
  assert.strictEqual(parsedA.state, 'Tamil Nadu');
  assert.strictEqual(parsedA.postalCode, '641014');
  assert.strictEqual(parsedA.country, 'India');

  // Test Case B: Google Places API (New) response format (longText)
  const placesNewComponents = [
    { longText: 'Peelamedu', types: ['sublocality_level_1', 'sublocality', 'political'] },
    { longText: 'Coimbatore', types: ['locality', 'political'] },
    { longText: 'Coimbatore District', types: ['administrative_area_level_2', 'political'] },
    { longText: 'Tamil Nadu', types: ['administrative_area_level_1', 'political'] },
    { longText: '641004', types: ['postal_code'] },
  ];

  const parsedB = parseAddressComponents(placesNewComponents);
  assert.strictEqual(parsedB.area, 'Peelamedu');
  assert.strictEqual(parsedB.city, 'Coimbatore');
  assert.strictEqual(parsedB.district, 'Coimbatore'); // Strips ' District'
  assert.strictEqual(parsedB.state, 'Tamil Nadu');
  assert.strictEqual(parsedB.postalCode, '641004');
});

test('2. Coordinate Reverse Geocoder validates bounds and handles missing API key safely without fabricating data', async () => {
  // Out of bounds latitude
  const oobLat = await reverseGeocodeCoordinates(95.0, 77.0);
  assert.strictEqual(oobLat.success, false);
  assert.match(oobLat.message, /out of bounds/i);

  // Out of bounds longitude
  const oobLon = await reverseGeocodeCoordinates(11.0, 195.0);
  assert.strictEqual(oobLon.success, false);
  assert.match(oobLon.message, /out of bounds/i);

  // Missing coordinates
  const missing = await reverseGeocodeCoordinates(null, undefined);
  assert.strictEqual(missing.success, false);

  // Valid coordinates without API key configured returns safe, non-fabricated response
  const valid = await reverseGeocodeCoordinates(11.032688, 77.034577);
  assert.strictEqual(valid.latitude, 11.032688);
  assert.strictEqual(valid.longitude, 77.034577);
  // Must NOT fabricate fake locality like SITRA
  if (!valid.isApiConfigured) {
    assert.strictEqual(valid.success, false);
    assert.match(valid.message, /GOOGLE_MAPS_API_KEY/i);
  }
});

test('3. POST /admin/geocode-coordinates endpoint enforces admin security and coordinate validation', async () => {
  // Unauthenticated
  const unauth = await fetch(`${baseUrl}/admin/geocode-coordinates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude: 11.03, longitude: 77.03 }),
  });
  assert.strictEqual(unauth.status, 401);

  // Authenticated with invalid coords
  const invalidRes = await fetch(`${baseUrl}/admin/geocode-coordinates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ latitude: 'invalid' }),
  });
  assert.strictEqual(invalidRes.status, 400);
});

test('4. End-to-End Digital Menu Management OS Workflow', async () => {
  // Step 1: Create a temporary test business
  const createCafeRes = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Temp Test Cafe for Menu OS',
      category: 'Café',
      description: 'Temporary testing café for digital menu CRUD operations.',
      area: 'Peelamedu',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      address: '100 Feet Road, Peelamedu, Coimbatore',
      latitude: 11.025,
      longitude: 77.005,
      is_active: true,
      cost_for_two: 300,
    }),
  });

  assert.strictEqual(createCafeRes.status, 201);
  const createCafeData = await createCafeRes.json();
  const testCafeId = createCafeData.cafe.id;

  try {
    // Step 2: Check initial menu via Admin and Customer APIs
    const adminMenuRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminMenuRes.status, 200);
    const adminMenuData = await adminMenuRes.json();
    assert.strictEqual(adminMenuData.success, true);
    assert.strictEqual(adminMenuData.menu_status, 'Awaiting Merchant Confirmation');
    assert.deepStrictEqual(adminMenuData.categories, []);

    // Step 3: Add new menu category
    const addCatRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Specialty Beverages', description: 'Freshly brewed teas and coffees' }),
    });
    assert.strictEqual(addCatRes.status, 200);
    const addCatData = await addCatRes.json();
    assert.strictEqual(addCatData.success, true);
    assert.strictEqual(addCatData.categories.length, 1);
    assert.strictEqual(addCatData.categories[0].name, 'Specialty Beverages');

    // Add a second category
    await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Quick Bites' }),
    });

    // Step 4: Add strictly text-based menu items (no food photos)
    const addItemRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        categoryName: 'Specialty Beverages',
        name: 'Artisan Filter Coffee',
        price: 60,
        description: 'Single-origin South Indian dark roast with frothy milk',
        food_type: 'VEG',
        is_veg: true,
        is_available: true,
      }),
    });
    assert.strictEqual(addItemRes.status, 201);
    const addItemData = await addItemRes.json();
    assert.strictEqual(addItemData.success, true);
    const itemId = addItemData.item.id;
    assert.strictEqual(addItemData.item.name, 'Artisan Filter Coffee');
    assert.strictEqual(addItemData.item.price, 60);
    assert.strictEqual(addItemData.item.is_available, true);
    assert.strictEqual(addItemData.item.image_url, undefined); // STRICTLY text-based, no food photo

    // Step 5: Toggle Item Availability to Out of Stock
    const toggleRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isAvailable: false }),
    });
    assert.strictEqual(toggleRes.status, 200);
    const toggleData = await toggleRes.json();
    assert.strictEqual(toggleData.success, true);
    assert.strictEqual(toggleData.item.is_available, false);

    // Step 6: Update Menu Item and move across category to "Quick Bites"
    const updateItemRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        categoryName: 'Specialty Beverages',
        newCategoryName: 'Quick Bites',
        name: 'Artisan Filter Coffee (Grande)',
        price: 80,
        description: 'Large cup single-origin dark roast',
        food_type: 'VEG',
        is_available: true,
      }),
    });
    assert.strictEqual(updateItemRes.status, 200);
    const updateItemData = await updateItemRes.json();
    assert.strictEqual(updateItemData.success, true);
    assert.strictEqual(updateItemData.item.price, 80);
    assert.strictEqual(updateItemData.item.is_available, true);

    // Verify item moved to Quick Bites
    const catQuickBites = updateItemData.categories.find((c) => c.name === 'Quick Bites');
    assert.ok(catQuickBites);
    assert.strictEqual(catQuickBites.items.length, 1);
    assert.strictEqual(catQuickBites.items[0].id, itemId);

    // Step 7: Rename Category
    const renameCatRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/categories/Quick%20Bites`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ newName: 'Signature Snacks', description: 'Freshly prepared evening snacks' }),
    });
    assert.strictEqual(renameCatRes.status, 200);
    const renameCatData = await renameCatRes.json();
    assert.strictEqual(renameCatData.success, true);
    const catSignature = renameCatData.categories.find((c) => c.name === 'Signature Snacks');
    assert.ok(catSignature);
    assert.strictEqual(catSignature.description, 'Freshly prepared evening snacks');
    assert.strictEqual(catSignature.items.length, 1);

    // Step 8: Update Menu Verification Status to "Verified Menu"
    const statusRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Verified Menu', notes: 'Menu verified by on-site field team.' }),
    });
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.success, true);
    assert.strictEqual(statusData.menu_status, 'Verified Menu');

    // Step 9: Customer App Menu API check
    const custMenuRes = await fetch(`${baseUrl}/cafes/${testCafeId}/menu`);
    assert.strictEqual(custMenuRes.status, 200);
    const custMenuData = await custMenuRes.json();
    assert.strictEqual(custMenuData.success, true);
    assert.strictEqual(custMenuData.menu_status, 'Verified Menu');
    assert.strictEqual(custMenuData.hasPublishedMenu, true);
    assert.strictEqual(custMenuData.categories.length, 2);

    // Step 10: Delete menu item and category
    const delItemRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delItemRes.status, 200);

    const delCatRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/categories/Signature%20Snacks`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delCatRes.status, 200);
  } finally {
    // Cleanup test business cleanly
    await fetch(`${baseUrl}/admin/cafes/${testCafeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
});
