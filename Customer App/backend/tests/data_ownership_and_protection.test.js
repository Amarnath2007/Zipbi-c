const { test, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const baseUrl = 'http://localhost:5000/api/v1';

let superAdminToken = '';
let staffAdminToken = '';
let customerToken = '';
let initialDirectorySnapshot = '';
let targetProtectedCafeId = 'cafe-the-german-cafe';

const dataPaths = [
  path.resolve(__dirname, '../../data/cafes.json'),
  path.resolve(__dirname, '../data/cafes.json'),
  path.resolve(__dirname, '../../assets/data/cafes.json'),
];

function snapshotDirectory() {
  for (const p of dataPaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch (_) {}
    }
  }
  return null;
}

function restoreDirectory(snapshot) {
  if (!snapshot) return;
  for (const p of dataPaths) {
    try {
      fs.writeFileSync(p, snapshot, 'utf8');
    } catch (_) {}
  }
  try {
    const db = require('../src/db');
    db.reloadCafes();
  } catch (_) {}
}

before(async () => {
  initialDirectorySnapshot = snapshotDirectory();
  assert.ok(initialDirectorySnapshot, 'Directory snapshot must be preserved before tests');

  // 1. Authenticate Super Admin (Platform Owner)
  const superLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  assert.strictEqual(superLoginRes.status, 200, 'Super admin login must succeed');
  const superData = await superLoginRes.json();
  superAdminToken = superData.token;
  assert.strictEqual(superData.user.isSuperAdmin, true);
  assert.strictEqual(superData.user.role, 'SUPER_ADMIN');

  // 2. Authenticate Standard Admin (Staff)
  const staffLoginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'staff@zipbi.com',
      password: 'Admin@ZipBi2026',
    }),
  });
  assert.strictEqual(staffLoginRes.status, 200, 'Staff admin login must succeed');
  const staffData = await staffLoginRes.json();
  staffAdminToken = staffData.token;
  assert.strictEqual(staffData.user.isSuperAdmin, false);
  assert.strictEqual(staffData.user.role, 'ADMIN');

  // 3. Register/Login a customer user
  const custRes = await fetch(`${baseUrl}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919999988888',
      otp: '123456',
      fullName: 'Test Customer',
    }),
  });
  if (custRes.ok) {
    const custData = await custRes.json();
    customerToken = custData.token || '';
  }

  // 4. Resolve a protected cafe ID
  const cafesRes = await fetch(`${baseUrl}/admin/cafes`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  if (cafesRes.ok) {
    const cafesData = await cafesRes.json();
    const prot = (cafesData.cafes || []).find((c) => c.is_protected);
    if (prot) targetProtectedCafeId = prot.id;
  }
});

after(() => {
  // Always restore directory after all tests complete
  restoreDirectory(initialDirectorySnapshot);
  const db = require('../src/db');
  assert.strictEqual(db.getAllCafes({ includeInactive: true }).length, 18, 'All 18 businesses must remain intact');
});

test('1. Direct API mutations without token must return 401 Unauthorized', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Cafe' }),
  });
  assert.strictEqual(res.status, 401, 'Unauthenticated POST /admin/cafes must be 401');

  const putRes = await fetch(`${baseUrl}/cafes/cafe-1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacked Name' }),
  });
  assert.strictEqual(putRes.status, 401, 'Unauthenticated PUT /cafes/:id must be 401');
});

test('2. Standard Admin (staff@zipbi.com) receives 403 Forbidden attempting to edit protected café', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
    body: JSON.stringify({
      name: 'Tampered German Cafe',
    }),
  });
  assert.strictEqual(res.status, 403, 'Non-Super Admin must be rejected with 403 when editing protected business');
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.message.includes('Platform Owner'), 'Message must indicate owner protection');
});

test('3. Standard Admin receives 403 Forbidden attempting to delete protected café', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${staffAdminToken}` },
  });
  assert.strictEqual(res.status, 403, 'Non-Super Admin must be rejected with 403 when deleting protected business');
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('4. Standard Admin receives 403 Forbidden attempting to toggle status of protected café', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
    body: JSON.stringify({ isActive: false }),
  });
  assert.strictEqual(res.status, 403, 'Non-Super Admin must be rejected with 403 when toggling status of protected business');
});

test('5. Standard Admin receives 403 Forbidden attempting to add/modify menu of protected café', async () => {
  // Add category
  const catRes = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}/menu/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
    body: JSON.stringify({ name: 'Unauthorized Category' }),
  });
  assert.strictEqual(catRes.status, 403, 'Non-Super Admin must be rejected with 403 when adding category to protected business');

  // Import menu
  const importRes = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}/menu/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
    body: JSON.stringify({
      menu: { categories: [{ name: 'Fake Cat', items: [] }] },
      mode: 'replace',
    }),
  });
  assert.strictEqual(importRes.status, 403, 'Non-Super Admin must be rejected with 403 when importing menu to protected business');
});

test('6. Customer/Merchant token receives 403 Forbidden attempting to modify café or menu', async () => {
  if (!customerToken) return;

  const res = await fetch(`${baseUrl}/cafes/${targetProtectedCafeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ name: 'Tampered by Customer' }),
  });
  assert.strictEqual(res.status, 403, 'Customer token must be 403 Forbidden on cafe mutation');

  const menuRes = await fetch(`${baseUrl}/cafes/${targetProtectedCafeId}/menu`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ categories: [] }),
  });
  assert.strictEqual(menuRes.status, 403, 'Customer token must be 403 Forbidden on cafe menu mutation');
});

test('7. Non-Super Admin receives 403 Forbidden attempting Directory Reset', async () => {
  const res = await fetch(`${baseUrl}/admin/reset-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
    body: JSON.stringify({
      password: 'Admin@ZipBi2026',
      confirmationPhrase: 'RESET DIRECTORY',
    }),
  });
  assert.strictEqual(res.status, 403, 'Directory Reset must strictly forbid non-Super Admins');
});

test('8. Super Admin can edit protected records and updates metadata', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      description: 'Authentic European style cafe and bakery updated by Platform Owner.',
    }),
  });
  assert.strictEqual(res.status, 200, 'Super Admin must successfully update protected business');
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.cafe.last_modified_by, 'admin@zipbi.com');
  assert.ok(data.cafe.last_modified_at);
  assert.strictEqual(data.cafe.is_protected, true);
});

test('9. Super Admin soft-delete archives record, creates automated backup, and filters from public directory', async () => {
  // Create an isolated test cafe first
  const createRes = await fetch(`${baseUrl}/admin/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      name: 'Temporary Ownership Test Cafe',
      category: 'Others',
      specified_business_type: 'Dessert Parlour',
      area: 'Peelamedu, Coimbatore',
      latitude: 11.025,
      longitude: 77.012,
    }),
  });
  assert.strictEqual(createRes.status, 201);
  const createdData = await createRes.json();
  const tempCafeId = createdData.cafe.id;

  // Verify created record carries ownership metadata
  assert.strictEqual(createdData.cafe.record_ownership, 'SUPER_ADMIN');
  assert.strictEqual(createdData.cafe.is_protected, true);
  assert.strictEqual(createdData.cafe.created_by, 'admin@zipbi.com');

  // Count backups before deletion
  const backupDir = path.resolve(__dirname, '../../data/backups');
  const countBefore = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).length : 0;

  // Soft delete as Super Admin
  const delRes = await fetch(`${baseUrl}/admin/cafes/${tempCafeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(delRes.status, 200);
  const delData = await delRes.json();
  assert.strictEqual(delData.success, true);
  assert.strictEqual(delData.soft_deleted, true);

  // Automated backup must have been created
  const countAfter = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).length : 0;
  assert.ok(countAfter > countBefore, 'An automated backup must be created before soft deletion');

  // Verify it is excluded from public customer directory
  const pubRes = await fetch(`${baseUrl}/cafes/${tempCafeId}`);
  assert.strictEqual(pubRes.status, 404, 'Soft-deleted cafe must not appear in public API');

  // Verify it appears when includeDeleted=true is requested
  const adminRes = await fetch(`${baseUrl}/admin/cafes?includeDeleted=true`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(adminRes.status, 200);
  const adminData = await adminRes.json();
  const archived = adminData.cafes.find((c) => c.id === tempCafeId);
  assert.ok(archived, 'Soft-deleted cafe must be found with includeDeleted=true');
  assert.strictEqual(archived.is_deleted, true);
  assert.strictEqual(archived.deleted_by, 'admin@zipbi.com');

  // 10. Test Restoration: Super Admin restores the archived cafe
  const restoreRes = await fetch(`${baseUrl}/admin/cafes/${tempCafeId}/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`,
    },
  });
  assert.strictEqual(restoreRes.status, 200, 'Restoration must succeed for Super Admin');
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.success, true);
  assert.strictEqual(restoreData.cafe.is_deleted, false);

  // Clean up the temporary test cafe via purge
  const purgeRes = await fetch(`${baseUrl}/admin/cafes/${tempCafeId}/purge`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert.strictEqual(purgeRes.status, 200, 'Super Admin purge of temporary test cafe must succeed');
});

test('10. Non-Super Admin cannot restore archived records', async () => {
  const restoreRes = await fetch(`${baseUrl}/admin/cafes/${targetProtectedCafeId}/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffAdminToken}`,
    },
  });
  assert.strictEqual(restoreRes.status, 403, 'Non-Super Admin must receive 403 on restore endpoint');
});
