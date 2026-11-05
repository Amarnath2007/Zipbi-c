const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const baseUrl = 'http://localhost:5000/api/v1';

let adminToken = '';
let testCafeId = '';
let cafesBackupForTests = null;

test('0. Setup: Authenticate Admin & Backup Directory', async () => {
  // Backup cafes
  const dataPath = path.resolve(__dirname, '../../data/cafes.json');
  if (fs.existsSync(dataPath)) {
    cafesBackupForTests = fs.readFileSync(dataPath, 'utf8');
  }

  const loginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const data = await loginRes.json();
  adminToken = data.token;
  assert.ok(adminToken, 'Admin token must be acquired');
});

test('1. Category Validation: Rejects invalid business category', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Invalid Category Business',
      category: 'Footwear & Apparel',
      address: 'Cross Cut Road, Gandhipuram, Coimbatore',
      latitude: 11.0168,
      longitude: 76.9558,
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Invalid category/i);
});

test('2. "Others" Category: Requires "specified_business_type"', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Juice Master Outlet',
      category: 'Others',
      // missing specified_business_type
      address: 'Avinashi Road, Peelamedu, Coimbatore',
      latitude: 11.028,
      longitude: 77.025,
    }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Specify Business Type is required/i);
});

test('3. "Others" Category: Successfully registers with specified_business_type and retrieves in Customer API', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Frosty Scoops Ice Cream Parlour',
      category: 'Others',
      specified_business_type: 'Ice Cream Parlour',
      address: '123 Civil Aerodrome Road, SITRA, Coimbatore',
      area: 'SITRA, Coimbatore',
      latitude: 11.0345,
      longitude: 77.037,
      phone: '+91 98765 43210',
      cost_for_two: 250,
      is_active: true,
      cover_image: 'assets/images/placeholder_cafe.png',
    }),
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  testCafeId = data.cafe.id;
  assert.strictEqual(data.cafe.category, 'Others');
  assert.strictEqual(data.cafe.specified_business_type, 'Ice Cream Parlour');

  // Query Customer API with category=Others
  const filterRes = await fetch(`${baseUrl}/cafes?category=Others`);
  assert.strictEqual(filterRes.status, 200);
  const filterData = await filterRes.json();
  const matched = filterData.cafes.find((c) => c.id === testCafeId);
  assert.ok(matched, 'Newly created Others category business must appear in category=Others query');
  assert.strictEqual(matched.category, 'Others');
  assert.strictEqual(matched.specified_business_type, 'Ice Cream Parlour');

  // Query Customer API searching for specified type: "Ice Cream"
  const searchRes = await fetch(`${baseUrl}/cafes?category=Ice Cream Parlour`);
  assert.strictEqual(searchRes.status, 200);
  const searchData = await searchRes.json();
  const matchedSearch = searchData.cafes.find((c) => c.id === testCafeId);
  assert.ok(matchedSearch, 'Business must also be discoverable by specified_business_type');

  // Clean up created test cafe
  await fetch(`${baseUrl}/admin/cafes/${testCafeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
});

test('4. Danger Zone Directory Reset: Rejects unauthenticated and customer requests', async () => {
  // 1. No token
  const unauthRes = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: 'Admin@ZipBi2026',
      confirmationPhrase: 'RESET DIRECTORY',
    }),
  });
  assert.strictEqual(unauthRes.status, 401);

  // 2. Customer token
  const custLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginIdentifier: 'amarnath.b@example.com',
      password: 'Password123',
    }),
  });
  const custData = await custLogin.json();
  const custForbidden = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custData.token}`,
    },
    body: JSON.stringify({
      password: 'Password123',
      confirmationPhrase: 'RESET DIRECTORY',
    }),
  });
  assert.strictEqual(custForbidden.status, 403);
});

test('5. Danger Zone Directory Reset: Enforces re-authentication and phrase verification', async () => {
  // Missing password
  const missingPwdRes = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      confirmationPhrase: 'RESET DIRECTORY',
    }),
  });
  assert.strictEqual(missingPwdRes.status, 401);
  const missingPwdData = await missingPwdRes.json();
  assert.match(missingPwdData.message, /password/i);

  // Incorrect password
  const wrongPwdRes = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      password: 'WrongPassword999',
      confirmationPhrase: 'RESET DIRECTORY',
    }),
  });
  assert.strictEqual(wrongPwdRes.status, 401);
  const wrongPwdData = await wrongPwdRes.json();
  assert.match(wrongPwdData.message, /Incorrect administrator password/i);

  // Incorrect confirmation phrase
  const wrongPhraseRes = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      password: 'Admin@ZipBi2026',
      confirmationPhrase: 'reset please',
    }),
  });
  assert.strictEqual(wrongPhraseRes.status, 400);
  const wrongPhraseData = await wrongPhraseRes.json();
  assert.match(wrongPhraseData.message, /RESET DIRECTORY/);
});

test('6. Danger Zone Directory Reset: Execution generates backup, logs audit, and resets directory safely', async () => {
  try {
    const resetRes = await fetch(`${baseUrl}/admin/reset-directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        password: 'Admin@ZipBi2026',
        confirmationPhrase: 'RESET DIRECTORY',
      }),
    });
    assert.strictEqual(resetRes.status, 200);
    const data = await resetRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.totalCafes, 0);
    assert.strictEqual(data.totalCategories, 0);
    assert.strictEqual(data.totalItems, 0);
    assert.ok(data.backupFile, 'Backup file path must be returned');
    assert.ok(fs.existsSync(data.backupFile), 'Backup file must exist on disk');

    // Verify activity log was recorded
    const logsRes = await fetch(`${baseUrl}/admin/activity-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(logsRes.status, 200);
    const logsData = await logsRes.json();
    const hasResetLog = logsData.logs.some((l) => l.action === 'SUPER_ADMIN_DIRECTORY_RESET');
    assert.ok(hasResetLog, 'Audit log must contain SUPER_ADMIN_DIRECTORY_RESET');

    // Verify Super Admin and Customer accounts still intact
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(usersRes.status, 200);
    const usersData = await usersRes.json();
    assert.ok(usersData.users.length >= 2, 'User accounts must remain completely intact');
  } finally {
    // Restore backup
    if (cafesBackupForTests) {
      const pathsToRestore = [
        path.resolve(__dirname, '../../data/cafes.json'),
        path.resolve(__dirname, '../data/cafes.json'),
        path.resolve(__dirname, '../../assets/data/cafes.json'),
      ];
      for (const p of pathsToRestore) {
        try {
          fs.writeFileSync(p, cafesBackupForTests, 'utf8');
        } catch (_) {}
      }
      try {
        const db = require('../src/db');
        db.reloadCafes();
      } catch (_) {}
    }
  }
});
