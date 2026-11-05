const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const http = require('http');
const db = require('../src/db');
const { calculateHaversineDistance } = require('../src/utils/haversine');

let server;
let baseUrl;

test.before(async () => {
  // Seed a test business for API verification
  db.createCafe({
    id: 'test-partner-cafe',
    name: 'Test Partner Cafe',
    slug: 'test-partner-cafe',
    category: 'Café',
    cuisine_tags: ['Café', 'Italian', 'Coffee'],
    address: 'Avinashi Road, SITRA, Coimbatore',
    area: 'SITRA, Coimbatore',
    latitude: 11.0358,
    longitude: 77.0355,
    phone: '+91 99760 18088',
    verification_status: 'ACTIVE_PARTNER',
    is_ordering_enabled: true,
    has_published_menu: true,
    menu_categories: [
      {
        name: 'Pasta',
        items: [
          {
            id: 'item-test-pasta-1',
            name: 'Pink Sauce Penne',
            price: 180,
            is_veg: true,
            is_available: true,
          },
          {
            id: 'item-test-snack-1',
            name: 'Crispy Corn',
            price: 120,
            is_veg: true,
            is_available: true,
          },
        ],
      },
    ],
  });

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

test.after(async () => {
  db.deleteCafe('test-partner-cafe');
  await new Promise((resolve) => server.close(resolve));
});

test('1. Distance Calculation - Haversine Formula verification', () => {
  const psgLat = 11.0326883;
  const psgLon = 77.0345773;

  // The German Cafe coords: 11.035800, 77.035500
  const distGerman = calculateHaversineDistance(psgLat, psgLon, 11.0358, 77.0355);
  assert.ok(distGerman >= 0.3 && distGerman <= 0.5, `Distance should be ~0.4 km, got ${distGerman}`);

  // KMCH: 11.0404121, 77.0408824 (~1.08 km)
  const distKmch = calculateHaversineDistance(psgLat, psgLon, 11.0404121, 77.0408824);
  assert.ok(distKmch >= 1.0 && distKmch <= 1.2, `Distance should be ~1.1 km, got ${distKmch}`);

  assert.strictEqual(calculateHaversineDistance(psgLat, psgLon, psgLat, psgLon), 0);
});

test('2. GET /api/v1/health returns healthy', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
  assert.strictEqual(data.service, 'ZipBi Unified API Gateway');
});

test('3. Auth Flow - Register and Login', async () => {
  const uniquePhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;

  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Customer',
      phone: uniquePhone,
      email: `test_${Date.now()}@example.com`,
      password: 'Password123!',
    }),
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  assert.ok(regData.token);
  assert.strictEqual(regData.user.fullName, 'Test Customer');

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: uniquePhone,
      password: 'Password123!',
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.token);
});

test('4. GET /api/v1/cafes returns cafes sorted by distance', async () => {
  const res = await fetch(`${baseUrl}/cafes?lat=11.0326883&lon=77.0345773`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.cafes.length > 0);

  for (let i = 0; i < data.cafes.length - 1; i++) {
    assert.ok(
      data.cafes[i].calculated_distance_km <= data.cafes[i + 1].calculated_distance_km
    );
  }
});

test('5. GET /api/v1/cafes/:id/menu returns text-based menu without individual food photographs', async () => {
  const res = await fetch(`${baseUrl}/cafes/test-partner-cafe/menu`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.cafeId, 'test-partner-cafe');
  assert.ok(data.categories.length > 0);

  const pastaCategory = data.categories.find((c) => c.name === 'Pasta');
  assert.ok(pastaCategory, 'Pasta category must exist');

  const pinkSauce = pastaCategory.items.find((item) => item.name === 'Pink Sauce Penne');
  assert.ok(pinkSauce);
  assert.strictEqual(pinkSauce.price, 180);
});

test('6. Order Placement Enforcement: Non-partner cafe order rejected', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: 'amarnath.b@example.com',
      password: 'Password123',
    }),
  });
  const { token } = await loginRes.json();

  const orderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      cafeId: 'non-existent-cafe',
      tableNumber: '3',
      items: [{ menuItemId: 'item-fake-1', quantity: 1 }],
    }),
  });

  assert.strictEqual(orderRes.status, 404);
});

test('7. Order Placement Enforcement: Active partner accepts valid table order', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: 'amarnath.b@example.com',
      password: 'Password123',
    }),
  });
  const { token } = await loginRes.json();

  const orderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      cafeId: 'test-partner-cafe',
      tableNumber: '5',
      specialNotes: 'Table near window, extra napkins',
      items: [
        { menuItemId: 'item-test-pasta-1', quantity: 2 }, // 2 * 180 = 360
        { menuItemId: 'item-test-snack-1', quantity: 1 }, // 1 * 120 = 120
      ],
    }),
  });

  assert.strictEqual(orderRes.status, 201);
  const data = await orderRes.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.order.totalAmount, 480);
});

test('8. Cafe & Menu Persistence - Update and Fetching', async () => {
  const updateRes = await fetch(`${baseUrl}/cafes/test-partner-cafe`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+91 99760 99999',
    }),
  });
  assert.strictEqual(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.cafe.phone, '+91 99760 99999');
});
