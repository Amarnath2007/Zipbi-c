const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const db = require('../src/db');
const {
  isAllowedGoogleHost,
  extractCoordinatesAndPlace,
  resolveGoogleMapsUrl,
} = require('../src/utils/googleMapsResolver');

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

  // Login as Super Admin
  const res = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zipbi.com', password: 'Admin@ZipBi2026' }),
  });
  const data = await res.json();
  adminToken = data.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Google Maps Domain Validation & SSRF Protections', () => {
  assert.strictEqual(isAllowedGoogleHost('maps.app.goo.gl'), true);
  assert.strictEqual(isAllowedGoogleHost('goo.gl'), true);
  assert.strictEqual(isAllowedGoogleHost('google.com'), true);
  assert.strictEqual(isAllowedGoogleHost('www.google.com'), true);
  assert.strictEqual(isAllowedGoogleHost('maps.google.com'), true);
  assert.strictEqual(isAllowedGoogleHost('maps.google.co.in'), true);
  assert.strictEqual(isAllowedGoogleHost('google.co.in'), true);

  // Malicious / internal / loopback blocked
  assert.strictEqual(isAllowedGoogleHost('localhost'), false);
  assert.strictEqual(isAllowedGoogleHost('127.0.0.1'), false);
  assert.strictEqual(isAllowedGoogleHost('169.254.169.254'), false);
  assert.strictEqual(isAllowedGoogleHost('evil.com'), false);
  assert.strictEqual(isAllowedGoogleHost('google.com.attacker.com'), false);
  assert.strictEqual(isAllowedGoogleHost(null), false);
  assert.strictEqual(isAllowedGoogleHost(''), false);
});

test('2. Coordinate & Place Extraction from Standard Google Maps URLs', () => {
  // Case A: Full place URL with viewport @lat,lon,zoom
  const urlA = 'https://www.google.com/maps/place/The+German+Cafe/@11.035821,77.035541,17z/data=!3m1!4b1';
  const resA = extractCoordinatesAndPlace(urlA);
  assert.strictEqual(resA.latitude, 11.035821);
  assert.strictEqual(resA.longitude, 77.035541);
  assert.strictEqual(resA.placeName, 'The German Cafe');

  // Case B: Pinpoint Protobuf coordinates !3dlat!4dlon (most accurate pin)
  const urlB = 'https://www.google.com/maps/place/Cafe+Talks/data=!4m2!3m1!1s0x3ba8570000000000:0x1234567890abcdef!3d11.034512!4d77.036215';
  const resB = extractCoordinatesAndPlace(urlB);
  assert.strictEqual(resB.latitude, 11.034512);
  assert.strictEqual(resB.longitude, 77.036215);
  assert.strictEqual(resB.placeName, 'Cafe Talks');
  assert.strictEqual(resB.placeId, '0x3ba8570000000000:0x1234567890abcdef');

  // Case C: Query parameter ?q=lat,lon
  const urlC = 'https://maps.google.com/?q=11.032688,77.034577';
  const resC = extractCoordinatesAndPlace(urlC);
  assert.strictEqual(resC.latitude, 11.032688);
  assert.strictEqual(resC.longitude, 77.034577);

  // Case D: ll parameter format
  const urlD = 'https://maps.google.com/?ll=11.037500,77.039000&z=16';
  const resD = extractCoordinatesAndPlace(urlD);
  assert.strictEqual(resD.latitude, 11.037500);
  assert.strictEqual(resD.longitude, 77.039000);
});

test('3. Google Maps Resolver: Invalid & Untrusted URLs Handled Gracefully', async () => {
  // Empty URL
  const emptyRes = await resolveGoogleMapsUrl('');
  assert.strictEqual(emptyRes.success, false);

  // Non-URL input
  const invalidRes = await resolveGoogleMapsUrl('not-a-url');
  assert.strictEqual(invalidRes.success, false);

  // Untrusted domain (SSRF attack)
  const untrustedRes = await resolveGoogleMapsUrl('https://evil-server.com/malicious-link');
  assert.strictEqual(untrustedRes.success, false);
  assert.ok(untrustedRes.message.includes('not recognized as Google Maps'));
});

test('4. POST /api/v1/admin/resolve-maps-url: Endpoint Verification', async () => {
  // 1. Unauthenticated request rejected
  const unauth = await fetch(`${baseUrl}/admin/resolve-maps-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://maps.google.com/?q=11.0358,77.0355' }),
  });
  assert.strictEqual(unauth.status, 401);

  // 2. Authenticated request resolves coordinates
  const authRes = await fetch(`${baseUrl}/admin/resolve-maps-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      url: 'https://www.google.com/maps/place/The+German+Cafe/@11.035821,77.035541,17z',
    }),
  });
  assert.strictEqual(authRes.status, 200);
  const data = await authRes.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.latitude, 11.035821);
  assert.strictEqual(data.longitude, 77.035541);
  assert.strictEqual(data.placeName, 'The German Cafe');
  assert.strictEqual(data.locationVerificationStatus, 'GOOGLE_MAPS_RESOLVED');
  assert.ok(data.googleMapsUrl);
});

test('5. Directory Reset: POST /api/v1/admin/reset-directory returns 0 counts', async () => {
  const resetRes = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.strictEqual(resetRes.status, 200);
  const data = await resetRes.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.totalCafes, 0);
  assert.strictEqual(data.totalCategories, 0);
  assert.strictEqual(data.totalItems, 0);
  assert.ok(data.backupFile);

  // Verify /api/v1/admin/stats returns 0
  const statsRes = await fetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const statsData = await statsRes.json();
  assert.strictEqual(statsData.stats.totalCafes, 0);
  assert.strictEqual(statsData.stats.verifiedCafes, 0);
  assert.strictEqual(statsData.stats.merchantPartners, 0);
  assert.strictEqual(statsData.stats.totalMenuItems, 0);
});

test('6. Fresh Café Registration with Google Maps Link & Verified Distance', async () => {
  // 1. Register a new café using Google Maps URL
  const createRes = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Fresh Harvest Coffee Roasters',
      category: 'Café',
      description: 'Speciality manual brew bar and artisan bakery near SITRA.',
      area: 'SITRA, Coimbatore',
      address: 'Plot 14, Avinashi Road, Opposite SITRA, Coimbatore',
      phone: '+91 99760 12345',
      website: 'https://freshharvest.example.com',
      cost_for_two: 400,
      latitude: 11.035800,
      longitude: 77.035500,
      google_maps_url: 'https://maps.google.com/place/Fresh+Harvest/@11.035800,77.035500,17z',
      location_verification_status: 'GOOGLE_MAPS_VERIFIED',
      verification_status: 'UNCLAIMED',
      is_ordering_enabled: false,
      is_active: true,
      cover_image: 'assets/images/placeholder_cafe.png',
    }),
  });

  assert.strictEqual(createRes.status, 201);
  const createData = await createRes.json();
  assert.strictEqual(createData.success, true);
  const newCafeId = createData.cafe.id;

  assert.strictEqual(createData.cafe.name, 'Fresh Harvest Coffee Roasters');
  assert.strictEqual(createData.cafe.latitude, 11.035800);
  assert.strictEqual(createData.cafe.longitude, 77.035500);
  assert.strictEqual(createData.cafe.google_maps_url, 'https://maps.google.com/place/Fresh+Harvest/@11.035800,77.035500,17z');
  assert.strictEqual(createData.cafe.location_verification_status, 'GOOGLE_MAPS_VERIFIED');
  assert.strictEqual(createData.cafe.is_ordering_enabled, false);

  // 2. Customer API retrieves the newly registered café with Haversine distance
  // From PSG CAS reference: 11.0326883, 77.0345773 -> ~0.36 km
  const custRes = await fetch(`${baseUrl}/cafes?lat=11.0326883&lon=77.0345773`);
  assert.strictEqual(custRes.status, 200);
  const custData = await custRes.json();
  assert.strictEqual(custData.count, 1);
  const retrieved = custData.cafes[0];
  assert.strictEqual(retrieved.id, newCafeId);
  assert.ok(retrieved.calculated_distance_km >= 0.3 && retrieved.calculated_distance_km <= 0.5);

  // 3. Clean up the test registered café so directory remains 0
  const delRes = await fetch(`${baseUrl}/admin/cafes/${newCafeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(delRes.status, 200);

  // Final check: directory is completely empty
  const finalCheck = await fetch(`${baseUrl}/cafes`);
  const finalData = await finalCheck.json();
  assert.strictEqual(finalData.count, 0);
});

