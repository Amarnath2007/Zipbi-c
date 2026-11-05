const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const db = require('../src/db');
const { parseMenuText, SAMPLE_MENU_TEXT, AI_EXTRACTION_PROMPT } = require('../src/utils/menuTextParser');

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
        description: 'Test cafe for plain-English menu paste',
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

test('1. Plain-English Parser: Standard format parses successfully', () => {
  const res = parseMenuText(SAMPLE_MENU_TEXT, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(res.categoriesCount, 3);
  assert.strictEqual(res.itemsCount, 6);
  assert.strictEqual(res.nameMismatch, false);
  assert.strictEqual(res.pastedCafeName, 'The German Cafe');

  // Verify first category & item
  const pastaCat = res.sanitizedMenu.categories[0];
  assert.strictEqual(pastaCat.name, 'Pasta');
  assert.strictEqual(pastaCat.items.length, 3);
  assert.strictEqual(pastaCat.items[0].name, 'Pink Sauce Penne');
  assert.strictEqual(pastaCat.items[0].price, 180);
  assert.strictEqual(pastaCat.items[0].description, 'Creamy pink sauce pasta');
  assert.strictEqual(pastaCat.items[0].food_type, 'vegetarian');
  assert.strictEqual(pastaCat.items[0].is_veg, true);

  // Verify missing description ("Not provided") converts to null
  assert.strictEqual(pastaCat.items[1].name, 'White Sauce Pasta');
  assert.strictEqual(pastaCat.items[1].description, null);
  assert.strictEqual(pastaCat.items[1].food_type, 'unknown');
  assert.strictEqual(pastaCat.items[1].is_veg, false);
});

test('2. Plain-English Parser: Handles "Price: Not listed" without fabricating numbers', () => {
  const text = `CAFE NAME: The German Cafe

CATEGORY: Chef Specials
Truffle Pasta | Price: Not listed | Description: Fresh black truffle | Type: Vegetarian
Daily Soup | Price: Not provided | Description: Not provided | Type: Unknown`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].price, null);
  assert.strictEqual(res.sanitizedMenu.categories[0].items[1].price, null);
  assert.strictEqual(res.summary.totalUnpricedItems, 2);
});

test('3. Plain-English Parser: Ignores blank lines and whitespace differences', () => {
  const text = `

CAFE NAME:    The German Cafe   


CATEGORY:    Beverages   

Cold Coffee   |   Price:   ₹120   |   Description:   Chilled brew   |   Type:   Vegetarian  

`;
  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.categoriesCount, 1);
  assert.strictEqual(res.itemsCount, 1);
  assert.strictEqual(res.sanitizedMenu.categories[0].name, 'Beverages');
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].name, 'Cold Coffee');
  assert.strictEqual(res.sanitizedMenu.categories[0].items[0].price, 120);
});

test('4. Plain-English Parser: Identifies exact line number for items placed before any CATEGORY:', () => {
  const text = `CAFE NAME: The German Cafe

Orphan Item | Price: ₹150 | Description: No category | Type: Vegetarian

CATEGORY: Pasta
Arrabbiata | Price: ₹160 | Description: Spicy sauce | Type: Vegetarian`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.length > 0);
  assert.match(res.errors[0], /Line 3: Menu item found before any "CATEGORY:" header/i);
});

test('5. Plain-English Parser: Identifies exact line number for invalid price', () => {
  const text = `CAFE NAME: The German Cafe

CATEGORY: Pasta
Invalid Price Item | Price: -100 | Description: Negative price | Type: Vegetarian`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.length > 0);
  assert.match(res.errors[0], /Line 4: Invalid price "-100"/i);
});

test('6. Plain-English Parser: Detects duplicate categories with exact line number', () => {
  const text = `CAFE NAME: The German Cafe

CATEGORY: Desserts
Brownie | Price: ₹90 | Description: Walnut brownie | Type: Vegetarian

CATEGORY: desserts
Cheesecake | Price: ₹150 | Description: Blueberry | Type: Vegetarian`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Line 6: Duplicate category name "desserts" detected.')));
});

test('7. Plain-English Parser: Detects duplicate items within same category with line number', () => {
  const text = `CAFE NAME: The German Cafe

CATEGORY: Snacks
Crispy Corn | Price: ₹120 | Description: Fried corn | Type: Vegetarian
Crispy Corn | Price: ₹130 | Description: Duplicate item | Type: Vegetarian`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, false);
  assert.ok(res.errors.some((e) => e.includes('Line 5: Duplicate item name "Crispy Corn" detected')));
});

test('8. Plain-English Parser: Detects café name mismatch and sets warning flag', () => {
  const text = `CAFE NAME: Blue Tokai Coffee Roasters

CATEGORY: Coffee
Espresso | Price: ₹140 | Description: Double shot | Type: Vegetarian`;

  const res = parseMenuText(text, 'The German Cafe');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.nameMismatch, true);
  assert.ok(res.warnings.length > 0);
  assert.match(res.warnings[0], /Blue Tokai Coffee Roasters/i);
});

test('9. GET /admin/menu/sample-format returns plain-English sample and AI prompt', async () => {
  const res = await fetch(`${baseUrl}/admin/menu/sample-format`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.sample_text.includes('CAFE NAME: The German Cafe'));
  assert.ok(data.sample_text.includes('CATEGORY: Pasta'));
  assert.ok(data.ai_extraction_prompt.includes('Read the attached café menu photograph or PDF'));
});

test('10. POST /admin/cafes/:id/menu/validate-text validates plain-English input', async () => {
  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/validate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ raw_text: SAMPLE_MENU_TEXT }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.valid, true);
  assert.strictEqual(data.categoriesCount, 3);
  assert.strictEqual(data.itemsCount, 6);
});

test('11. POST /admin/cafes/:id/menu/import in REPLACE mode imports plain-English menu', async () => {
  const targetCafe = db.getCafeById(testCafeId);
  const parsed = parseMenuText(SAMPLE_MENU_TEXT, targetCafe.name);

  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      menu: parsed.sanitizedMenu,
      mode: 'replace',
      menu_status: 'Verified Menu',
      allow_name_mismatch: true,
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.importedCategoriesCount, 3);
  assert.strictEqual(data.importedItemsCount, 6);
  assert.strictEqual(data.mode, 'replace');

  // Verify DB state
  const updatedCafe = db.getCafeById(testCafeId);
  assert.strictEqual(updatedCafe.menu_status, 'Verified Menu');
  assert.strictEqual(updatedCafe.menu_import_source, 'Plain-English Text Paste (AI Extracted)');
  assert.strictEqual(updatedCafe.menu_items_count, 6);
  assert.strictEqual(updatedCafe.menu_categories.length, 3);

  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.ok(pastaCat);
  assert.strictEqual(pastaCat.items.length, 3);
  const penne = pastaCat.items.find((i) => i.name === 'Pink Sauce Penne');
  assert.strictEqual(penne.price, 180);
  assert.strictEqual(penne.description, 'Creamy pink sauce pasta');
  assert.strictEqual(penne.is_available, true);
  assert.ok(penne.id);
});

test('12. POST /admin/cafes/:id/menu/import in MERGE mode appends new categories and items', async () => {
  const mergeText = `CAFE NAME: The German Cafe

CATEGORY: Pasta
Mac and Cheese | Price: ₹190 | Description: Baked cheese pasta | Type: Vegetarian

CATEGORY: Desserts
Chocolate Lava Cake | Price: ₹140 | Description: Molten chocolate centre | Type: Vegetarian`;

  const parsed = parseMenuText(mergeText, 'The German Cafe');

  const res = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      menu: parsed.sanitizedMenu,
      mode: 'merge',
      allow_name_mismatch: true,
    }),
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);

  const updatedCafe = db.getCafeById(testCafeId);
  // Total categories should now be 4 (Pasta, Snacks, Beverages, Desserts)
  assert.strictEqual(updatedCafe.menu_categories.length, 4);

  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.strictEqual(pastaCat.items.length, 4); // 3 original + 1 merged

  const dessertCat = updatedCafe.menu_categories.find((c) => c.name === 'Desserts');
  assert.ok(dessertCat);
  assert.strictEqual(dessertCat.items.length, 1);
});

test('13. Imported items can be manually edited or deleted via regular manual controls', async () => {
  const updatedCafe = db.getCafeById(testCafeId);
  const pastaCat = updatedCafe.menu_categories.find((c) => c.name === 'Pasta');
  const itemToEdit = pastaCat.items[0];

  // Edit item via manual endpoint
  const editRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemToEdit.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      categoryName: 'Pasta',
      name: 'Pink Sauce Penne (Chef Special)',
      price: 210,
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
  assert.strictEqual(reloadedItem.name, 'Pink Sauce Penne (Chef Special)');
  assert.strictEqual(reloadedItem.price, 210);

  // Delete item via manual endpoint
  const delRes = await fetch(`${baseUrl}/admin/cafes/${testCafeId}/menu/items/${itemToEdit.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(delRes.status, 200);

  const afterDelCafe = db.getCafeById(testCafeId);
  const afterDelCat = afterDelCafe.menu_categories.find((c) => c.name === 'Pasta');
  assert.strictEqual(afterDelCat.items.some((i) => i.id === itemToEdit.id), false);
});

test('14. Public Customer API /cafes/:id/menu returns the imported menu without photos', async () => {
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
