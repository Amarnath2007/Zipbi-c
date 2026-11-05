const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const http = require('http');
const { extractGoogleDriveFileId } = require('../src/utils/googleDrive');

let server;
let baseUrl;

test.before(async () => {
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
  await new Promise((resolve) => server.close(resolve));
});

test('1. Google Drive File ID Extractor handles diverse sharing URLs', () => {
  const url1 = 'https://drive.google.com/file/d/1B2C3D4E5F6G7H8I9J0K_abc/view?usp=sharing';
  assert.strictEqual(extractGoogleDriveFileId(url1), '1B2C3D4E5F6G7H8I9J0K_abc');

  const url2 = 'https://drive.google.com/open?id=9Z8Y7X6W5V4U3T2S1R0Q_xyz';
  assert.strictEqual(extractGoogleDriveFileId(url2), '9Z8Y7X6W5V4U3T2S1R0Q_xyz');

  const url3 = 'https://drive.google.com/uc?id=FileId1234567890abcdef';
  assert.strictEqual(extractGoogleDriveFileId(url3), 'FileId1234567890abcdef');

  const url4 = 'FileId1234567890abcdef12345';
  assert.strictEqual(extractGoogleDriveFileId(url4), 'FileId1234567890abcdef12345');

  assert.strictEqual(extractGoogleDriveFileId(''), null);
  assert.strictEqual(extractGoogleDriveFileId(null), null);
});

test('2. Admin Security: Strict Authentication and Role Authorization', async () => {
  // 1. Unauthenticated request to /admin/stats should be blocked
  const unauthRes = await fetch(`${baseUrl}/admin/stats`);
  assert.strictEqual(unauthRes.status, 401);

  // 2. Customer login
  const custLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: 'amarnath.b@example.com',
      password: 'Password123',
    }),
  });
  assert.strictEqual(custLogin.status, 200);
  const custData = await custLogin.json();
  assert.strictEqual(custData.user.role, 'CUSTOMER');

  // 3. Customer trying to access Admin API should receive 403 Forbidden
  const custForbidden = await fetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${custData.token}` },
  });
  assert.strictEqual(custForbidden.status, 403);

  // 4. Admin Login with correct credentials
  const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  assert.ok(adminData.token);
  assert.strictEqual(adminData.user.role, 'ADMIN');

  // 5. Admin accesses /admin/stats successfully
  const statsRes = await fetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminData.token}` },
  });
  assert.strictEqual(statsRes.status, 200);
  const stats = await statsRes.json();
  assert.ok(stats.success);
  assert.strictEqual(typeof stats.stats.totalBusinesses, 'number');
});

test('3. Admin Business Management: Complete CRUD with GPS Coordinates', async () => {
  // Login as admin
  const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  const { token } = await adminLoginRes.json();

  // 1. Create new verified business
  const newCafePayload = {
    name: 'Artisan Roast House',
    slug: 'artisan-roast-house',
    category: 'Café',
    cuisine_tags: ['Speciality Coffee', 'Continental', 'Artisan Bakery'],
    description: 'Fresh artisanal brews and handcrafted sourdough snacks.',
    address: 'Avinashi Road, Near KMCH Junction',
    area: 'Peelamedu, Coimbatore',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641014',
    latitude: 11.0415,
    longitude: 77.0425,
    phone: '+91 98421 11223',
    cost_for_two: 500,
    opening_hours: '08:00 AM - 11:00 PM',
  };

  const createRes = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newCafePayload),
  });
  assert.strictEqual(createRes.status, 201);
  const createData = await createRes.json();
  assert.strictEqual(createData.cafe.name, 'Artisan Roast House');
  assert.strictEqual(createData.cafe.latitude, 11.0415);
  const cafeId = createData.cafe.id;

  // 2. Customer API now lists this business with accurate Haversine distance
  const custRes = await fetch(`${baseUrl}/cafes?lat=11.0326883&lon=77.0345773`);
  assert.strictEqual(custRes.status, 200);
  const custData = await custRes.json();
  const found = custData.cafes.find((c) => c.id === cafeId);
  assert.ok(found, 'Customer API must list the newly created business');
  assert.ok(found.calculated_distance_km > 0, 'Distance must be dynamically calculated');

  // 3. Menu Management: Add Category and Item
  const catRes = await fetch(`${baseUrl}/admin/cafes/${cafeId}/menu/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Cold Brews' }),
  });
  assert.strictEqual(catRes.status, 200);

  const itemRes = await fetch(`${baseUrl}/admin/cafes/${cafeId}/menu/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      categoryName: 'Cold Brews',
      item: {
        name: 'Classic Nitro Cold Brew',
        price: 190,
        description: 'Smooth steeped single-origin coffee infused with nitrogen.',
        is_veg: true,
        is_available: true,
      },
    }),
  });
  assert.strictEqual(itemRes.status, 201);
  const itemData = await itemRes.json();
  assert.strictEqual(itemData.item.name, 'Classic Nitro Cold Brew');
  assert.strictEqual(itemData.item.price, 190);

  // 4. Toggle Inactive: Customer query should no longer return it
  const toggleRes = await fetch(`${baseUrl}/admin/cafes/${cafeId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(toggleRes.status, 200);

  const custAfterInactive = await fetch(`${baseUrl}/cafes`);
  const custAfterData = await custAfterInactive.json();
  assert.ok(!custAfterData.cafes.some((c) => c.id === cafeId), 'Inactive business must NOT appear to customers');

  // 5. Cleanup: Delete business
  const delRes = await fetch(`${baseUrl}/admin/cafes/${cafeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(delRes.status, 200);
});

test('3b. Business Registration without Full Physical Address succeeds (Optional Address)', async () => {
  const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zipbi.com', password: 'Admin@ZipBi2026' }),
  });
  const { token } = await adminLoginRes.json();

  const noAddressPayload = {
    name: 'Corner Tea Stall',
    category: 'Tea Shops',
    area: 'Gandhipuram',
    city: 'Coimbatore',
    latitude: 11.0183,
    longitude: 76.9644,
  };

  const createRes = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(noAddressPayload),
  });
  assert.strictEqual(createRes.status, 201);
  const data = await createRes.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.cafe.name, 'Corner Tea Stall');
  assert.strictEqual(data.cafe.address, '');

  // Cleanup
  await fetch(`${baseUrl}/admin/cafes/${data.cafe.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
});

test('4. Admin Portal: Required KPIs and Sidebar Endpoints', async () => {
  const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zipbi.com', password: 'Admin@ZipBi2026' }),
  });
  const { token } = await adminLoginRes.json();
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Stats endpoint must return all 6 KPIs
  const statsRes = await fetch(`${baseUrl}/admin/stats`, { headers });
  assert.strictEqual(statsRes.status, 200);
  const { stats } = await statsRes.json();
  assert.strictEqual(typeof stats.totalCafes, 'number');
  assert.strictEqual(typeof stats.verifiedCafes, 'number');
  assert.strictEqual(typeof stats.merchantPartners, 'number');
  assert.strictEqual(typeof stats.customerUsers, 'number');
  assert.strictEqual(typeof stats.activeSubscriptions, 'number');
  assert.strictEqual(typeof stats.monthlyCafeRevenue, 'number');
  assert.ok(stats.formattedRevenue.startsWith('₹'));

  // 2. Users endpoint
  const usersRes = await fetch(`${baseUrl}/admin/users`, { headers });
  assert.strictEqual(usersRes.status, 200);
  const usersData = await usersRes.json();
  assert.ok(usersData.count > 0);
  assert.ok(!usersData.users.some((u) => u.passwordHash), 'User password hashes must NEVER be exposed');

  // 3. Partners endpoint
  const partnersRes = await fetch(`${baseUrl}/admin/partners`, { headers });
  assert.strictEqual(partnersRes.status, 200);
  const partnersData = await partnersRes.json();
  assert.ok(Array.isArray(partnersData.partners));

  // 4. Revenue endpoint (privacy preserved: no individual customer itemizations)
  const revRes = await fetch(`${baseUrl}/admin/revenue`, { headers });
  assert.strictEqual(revRes.status, 200);
  const revData = await revRes.json();
  assert.ok(revData.revenue.privacyNote);
  assert.ok(Array.isArray(revData.revenue.cafes));

  // 5. Subscriptions endpoint
  const subsRes = await fetch(`${baseUrl}/admin/subscriptions`, { headers });
  assert.strictEqual(subsRes.status, 200);
  const subsData = await subsRes.json();
  assert.ok(Array.isArray(subsData.subscriptions.plans));

  // 6. Activity logs endpoint
  const logsRes = await fetch(`${baseUrl}/admin/activity-logs`, { headers });
  assert.strictEqual(logsRes.status, 200);
  const logsData = await logsRes.json();
  assert.ok(Array.isArray(logsData.logs));

  // 7. Settings endpoint
  const settingsRes = await fetch(`${baseUrl}/admin/settings`, { headers });
  assert.strictEqual(settingsRes.status, 200);
  const settingsData = await settingsRes.json();
  assert.strictEqual(settingsData.settings.referencePoint.latitude, 11.0326883);
});

