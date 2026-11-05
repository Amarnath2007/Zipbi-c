const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const db = require('../src/db');
const { validateMenuJson, SAMPLE_MENU_JSON } = require('../src/utils/menuJsonValidator');

let server;
let baseUrl;
let adminToken = '';
let testCafeId = '';

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });

  // Ensure DB is reloaded
  db.reloadCafes();

  // Authenticate as Super Admin
  const loginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zipbi.com', password: 'Admin@ZipBi2026' }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  adminToken = loginData.token;
  assert.ok(adminToken);

  // Retrieve test cafe or create a dedicated test cafe
  let cafes = db.getAllCafes();
  if (!cafes || cafes.length === 0) {
    db.reloadCafes();
    cafes = db.getAllCafes();
  }

  if (cafes && cafes.length > 0) {
    testCafeId = cafes[0].id;
  } else {
    // Create test cafe
    const createRes = await fetch(`${baseUrl}/admin/cafes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'The German Cafe',
        category: 'Café',
        description: 'Test cafe for structured menu paste',
        area: 'SITRA, Coimbatore',
        address: 'Avinashi Road, Coimbatore',
        phone: '+91 99999 11111',
        cost_for_two: 350,
        latitude: 11.0326883,
        longitude: 77.0345773,
        is_active: true,
      }),
    });
    const cData = await createRes.json();
    testCafeId = cData.cafe.id;
  }
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Schema Validation: Standard format validates successfully', () => {
  const sample = {
    cafe_name: 'The German Cafe',
    currency: 'INR',
    categories: [
      {
        name: 'Pasta',
        items: [
          { name: 'Pink Sauce Penne', description: 'Creamy pink sauce pasta', price: 180, food_type: 'unknown' },
          { name: 'White Sauce Pasta', description: null, price: 170, food_type: 'unknown' },
        ],
      },
      {
        name: 'Snacks',
        items: [
          { name: 'Crispy Corn', description: null, price: 120, food_type: 'vegetarian' },
        ],
      },
    ],
  };

  const res = validateMenuJson(sample, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(res.categoriesCount, 2);
  assert.strictEqual(res.itemsCount, 3);
  assert.strictEqual(res.nameMismatch, false);
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].food_type, 'unknown');
  assert.strictEqual(res.sanitizedMenu.categories[1].items[0].is_veg, true);
});

test('2. Schema Validation: Validates JSON string input cleanly', () => {
  const jsonStr = JSON.stringify(SAMPLE_MENU_JSON);
  const res = validateMenuJson(jsonStr, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.sanitizedMenu.categories.length, 2);
});

test('3. Schema Validation: Rejects invalid JSON syntax with clear error', () => {
  const res = validateMenuJson('{ cafe_name: invalid json without quotes, }', 'The German Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.length > 0);
  assert.match(res.errors[0], /Invalid JSON syntax/i);
});

test('4. Schema Validation: Rejects missing categories array', () => {
  const res = validateMenuJson({ cafe_name: 'Test Cafe', currency: 'INR' }, 'Test Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('"categories" array is required')));
});

test('5. Schema Validation: Rejects empty categories array', () => {
  const res = validateMenuJson({ cafe_name: 'Test Cafe', categories: [] }, 'Test Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('At least one category is required')));
});

test('6. Schema Validation: Rejects missing or empty category name', () => {
  const res = validateMenuJson({
    categories: [{ name: '   ', items: [{ name: 'Item 1', price: 50 }] }],
  });
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Category #1 name is required')));
});

test('7. Schema Validation: Rejects missing or empty item name', () => {
  const res = validateMenuJson({
    categories: [{ name: 'Snacks', items: [{ name: '', price: 50 }] }],
  });
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Item name is required')));
});

test('8. Schema Validation: Rejects negative prices', () => {
  const res = validateMenuJson({
    categories: [{ name: 'Snacks', items: [{ name: 'Samosa', price: -10 }] }],
  });
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Price cannot be negative')));
});

test('9. Schema Validation: Allows null description and null price without fabricating data', () => {
  const res = validateMenuJson({
    categories: [{ name: 'Specialties', items: [{ name: 'Seasonal Dish', description: null, price: null }] }],
  });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].price, null);
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].description, null);
});

test('10. Schema Validation: Detects duplicate categories', () => {
  const res = validateMenuJson({
    categories: [
      { name: 'Pasta', items: [{ name: 'White Sauce', price: 100 }] },
      { name: 'pasta', items: [{ name: 'Red Sauce', price: 120 }] },
    ],
  });
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Duplicate category name')));
});

test('11. Schema Validation: Detects duplicate items within the same category', () => {
  const res = validateMenuJson({
    categories: [
      {
        name: 'Beverages',
        items: [
          { name: 'Cold Coffee', price: 80 },
          { name: 'Cold Coffee', price: 90 },
        ],
      },
    ],
  });
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Duplicate item name')));
});

test('12. Schema Validation: Detects café name mismatch and sets warning flag', () => {
  const res = validateMenuJson(
    {
      cafe_name: 'Different Bistro',
      categories: [{ name: 'Coffee', items: [{ name: 'Espresso', price: 90 }] }],
    },
    'The German Cafe'
  );
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.nameMismatch, true);
  assert.ok(res.warnings.length > 0);
  assert.match(res.warnings[0], /Different Bistro/i);
});

test('13. GET /admin/menu/sample-json returns standard schema and instructions', async () => {
  const res = await fetch(`${baseUrl}/admin/menu/sample-json`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.sample.cafe_name, 'The German Cafe');
  assert.strictEqual(data.sample.categories.length, 2);
  assert.ok(data.ai_prompt_suggestion);
});

test('14. POST /admin/cafes/:id/menu/validate-json validates pasted string', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/validate-json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      raw_json: JSON.stringify({
        cafe_name: 'Imported Cafe',
        categories: [
          {
            name: 'Burgers',
            items: [{ name: 'Classic Veg Burger', price: 99, food_type: 'vegetarian' }],
          },
        ],
      }),
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.valid, true);
  assert.strictEqual(data.categoriesCount, 1);
  assert.strictEqual(data.itemsCount, 1);
});

test('15. POST /admin/cafes/:id/menu/import in REPLACE mode imports into database', async () => {
  const targetCafe = db.getCafeById(testCafeId);
  const menuPayload = {
    cafe_name: targetCafe.name,
    currency: 'INR',
    categories: [
      {
        name: 'Pasta',
        items: [
          { name: 'Pink Sauce Penne', description: 'Creamy pink sauce pasta', price: 180, food_type: 'unknown' },
          { name: 'White Sauce Pasta', description: null, price: 170, food_type: 'unknown' },
        ],
      },
      {
        name: 'Snacks',
        items: [{ name: 'Crispy Corn', description: null, price: 120, food_type: 'vegetarian' }],
      },
    ],
  };

  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      menu: menuPayload,
      mode: 'replace',
      menu_status: 'Verified Menu',
      allow_name_mismatch: true,
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.importedCategoriesCount, 2);
  assert.strictEqual(data.importedItemsCount, 3);
  assert.strictEqual(data.mode, 'replace');

  // Verify records directly in db
  const updatedCafe = db.getCafeById(testCafeId);
  assert.strictEqual(updatedCafe.menu_status, 'Verified Menu');
  assert.strictEqual(updatedCafe.menu_import_source, 'Structured JSON Paste (AI Extracted)');
  assert.strictEqual(updatedCafe.menu_items_count, 3);
  assert.strictEqual(updatedCafe.menu_categories.length, 2);

  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.ok(pastaCat);
  assert.strictEqual(pastaCat.items.length, 2);
  const penne = pastaCat.items.find((i) => i.name === 'Pink Sauce Penne');
  assert.strictEqual(penne.price, 180);
  assert.strictEqual(penne.description, 'Creamy pink sauce pasta');
  assert.ok(penne.id);
  assert.strictEqual(penne.is_available, true);
});

test('16. POST /admin/cafes/:id/menu/import in MERGE mode appends new categories and items', async () => {
  const mergePayload = {
    categories: [
      {
        name: 'Pasta',
        items: [
          { name: 'Arrabbiata Red Sauce Pasta', description: 'Spicy red sauce', price: 195, food_type: 'vegetarian' },
        ],
      },
      {
        name: 'Beverages',
        items: [{ name: 'Iced Peach Tea', price: 90, food_type: 'vegetarian' }],
      },
    ],
  };

  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      menu: mergePayload,
      mode: 'merge',
      allow_name_mismatch: true,
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);

  const updatedCafe = db.getCafeById(testCafeId);
  assert.strictEqual(updatedCafe.menu_categories.length, 3);

  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.strictEqual(pastaCat.items.length, 3);

  const bevCat = updatedCafe.menu_categories.find((c) => c.name === 'Beverages');
  assert.strictEqual(bevCat.items.length, 1);
});

test('17. Imported items can be manually edited or deleted via manual endpoints', async () => {
  const updatedCafe = db.getCafeById(testCafeId);
  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  const itemToEdit = pastaCat.items[0];

  const editRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemToEdit.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      categoryName: 'Pasta',
      name: 'Pink Sauce Penne (Signature)',
      price: 199,
      food_type: 'VEG',
      is_available: true,
    }),
  });

  assert.strictEqual(editRes.status, 200);
  const editData = await editRes.json();
  assert.strictEqual(editData.success, true);

  const reloadedCafe = db.getCafeById(testCafeId);
  const reloadedCat = reloadedCafe.menu_categories.find((c) => c.name === 'Pasta');
  const reloadedItem = reloadedCat.items.find((i) => i.id === itemToEdit.id);
  assert.strictEqual(reloadedItem.name, 'Pink Sauce Penne (Signature)');
  assert.strictEqual(reloadedItem.price, 199);

  const delRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemToEdit.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(delRes.status, 200);

  const afterDelCafe = db.getCafeById(testCafeId);
  const afterDelCat = afterDelCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.strictEqual(afterDelCat.items.some((i) => i.id === itemToEdit.id), false);
});

test('18. Public Customer API /cafes/:id/menu returns the imported menu without photos', async () => {
  const res = await fetch(`${baseUrl}/cafes/${testCafeId}/menu`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.categories);
  assert.ok(data.categories.length > 0);

  data.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      assert.strictEqual(item.image_url, undefined);
      assert.strictEqual(item.photo, undefined);
      assert.strictEqual(typeof item.name, 'string');
    });
  });
});
