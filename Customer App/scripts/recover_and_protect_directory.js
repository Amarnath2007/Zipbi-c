const fs = require('fs');
const path = require('path');

function recoverAndProtect() {
  const currentPath = path.resolve(__dirname, '../data/cafes.json');
  const backup15Path = path.resolve(__dirname, '../data/backups/cafes_backup_20261104.json');
  const backendDataPath = path.resolve(__dirname, '../backend/data/cafes.json');
  const assetsDataPath = path.resolve(__dirname, '../assets/data/cafes.json');

  const currentData = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
  const backup15Data = JSON.parse(fs.readFileSync(backup15Path, 'utf8'));

  const currentCafes = currentData.cafes || [];
  const backupCafes = backup15Data.cafes || [];

  const mergedMap = new Map();

  // 1. Populate with 15 historical cafes and full menus
  for (const c of backupCafes) {
    mergedMap.set(c.id, {
      ...c,
      created_by: 'admin@zipbi.com',
      created_at: c.created_at || '2026-11-04T12:00:00.000Z',
      last_modified_by: 'admin@zipbi.com',
      last_modified_at: '2026-11-05T18:00:00.000Z',
      record_ownership: 'SUPER_ADMIN',
      is_protected: true,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      menu_categories: (c.menu_categories || []).map((cat) => ({
        ...cat,
        created_by: 'admin@zipbi.com',
        record_ownership: 'SUPER_ADMIN',
        is_protected: true,
        items: (cat.items || []).map((item) => ({
          ...item,
          created_by: 'admin@zipbi.com',
          record_ownership: 'SUPER_ADMIN',
          is_protected: true,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        })),
      })),
    });
  }

  // 2. Overlay newer edits from current cafes (Mario Juicy, Aroma Bakery, RR Tea Corner, and newest Google Maps info for German Cafe & RIP)
  for (const c of currentCafes) {
    if (c.id && (c.id.includes('temp') || c.name.toLowerCase().includes('temp') || c.id.includes('test-partner') || c.name.toLowerCase().includes('temporary'))) continue;
    if (mergedMap.has(c.id)) {
      const existing = mergedMap.get(c.id);
      const menusToKeep =
        Array.isArray(c.menu_categories) && c.menu_categories.length > 0
          ? c.menu_categories
          : existing.menu_categories;

      mergedMap.set(c.id, {
        ...existing,
        ...c, // keep newer Google Maps URL, updated coordinates, address, phone, uploaded cover
        menu_categories: menusToKeep,
        created_by: 'admin@zipbi.com',
        last_modified_by: 'admin@zipbi.com',
        last_modified_at: new Date().toISOString(),
        record_ownership: 'SUPER_ADMIN',
        is_protected: true,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      });
    } else {
      mergedMap.set(c.id, {
        ...c,
        created_by: 'admin@zipbi.com',
        created_at: c.created_at || '2026-11-05T08:00:00.000Z',
        last_modified_by: 'admin@zipbi.com',
        last_modified_at: new Date().toISOString(),
        record_ownership: 'SUPER_ADMIN',
        is_protected: true,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        menu_categories: (c.menu_categories || []).map((cat) => ({
          ...cat,
          created_by: 'admin@zipbi.com',
          record_ownership: 'SUPER_ADMIN',
          is_protected: true,
          items: (cat.items || []).map((item) => ({
            ...item,
            created_by: 'admin@zipbi.com',
            record_ownership: 'SUPER_ADMIN',
            is_protected: true,
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
          })),
        })),
      });
    }
  }

  const AUTHENTIC_BUSINESS_IDS = new Set([
    'cafe-the-german-cafe',
    'cafe-rest-in-peace',
    'cafe-terminal-2',
    'cafe-shadow-lights',
    'cafe-dark-knight',
    'cafe-cafe-talks',
    'cafe-juice-world',
    'cafe-zesty-mania',
    'cafe-kovai-brews',
    'cafe-refresh-cafe',
    'cafe-friends-zone',
    'cafe-dee-chill',
    'cafe-den-cafe',
    'cafe-rain-cafe',
    'cafe-sandsha-cafe',
    'cafe-mario-juicy',
    'cafe-aroma-bakery',
    'cafe-rr-tea-corner',
  ]);

  const finalCafes = Array.from(mergedMap.values()).filter((c) => AUTHENTIC_BUSINESS_IDS.has(c.id));
  const finalPayload = {
    reference_point: currentData.reference_point || {
      name: 'PSG College of Arts and Science Main Gate',
      area: 'Civil Aerodrome Post, Avinashi Road, Coimbatore, Tamil Nadu',
      latitude: 11.0326883,
      longitude: 77.0345773,
    },
    cafes: finalCafes,
  };

  const jsonStr = JSON.stringify(finalPayload, null, 2);

  // Write to all target files
  fs.writeFileSync(currentPath, jsonStr, 'utf8');
  console.log(`[Hydration] Successfully wrote ${finalCafes.length} cafes to ${currentPath}`);

  if (fs.existsSync(path.dirname(backendDataPath))) {
    fs.writeFileSync(backendDataPath, jsonStr, 'utf8');
    console.log(`[Hydration] Synced to ${backendDataPath}`);
  }

  if (fs.existsSync(path.dirname(assetsDataPath))) {
    fs.writeFileSync(assetsDataPath, jsonStr, 'utf8');
    console.log(`[Hydration] Synced to ${assetsDataPath}`);
  }

  console.log('\n=== RECOVERY & PROTECTION VERIFICATION ===');
  console.log(`Total Businesses:           ${finalCafes.length}`);
  const totalCats = finalCafes.reduce((acc, c) => acc + (c.menu_categories || []).length, 0);
  const totalItems = finalCafes.reduce(
    (acc, c) => acc + (c.menu_categories || []).reduce((a, x) => a + (x.items || []).length, 0),
    0
  );
  console.log(`Total Menu Categories:      ${totalCats}`);
  console.log(`Total Menu Items:           ${totalItems}`);
  console.log(`Owner Protected Records:    ${finalCafes.filter((c) => c.is_protected).length}`);
  console.log(`Active (Non-deleted):       ${finalCafes.filter((c) => !c.is_deleted).length}`);
}

recoverAndProtect();
