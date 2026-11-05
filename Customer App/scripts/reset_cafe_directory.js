const fs = require('fs');
const path = require('path');

function resetCafeDirectory() {
  const dataDir = path.resolve(__dirname, '../data');
  const backupDir = path.join(dataDir, 'backups');
  const cafesPath = path.join(dataDir, 'cafes.json');
  const assetCafesPath = path.resolve(__dirname, '../assets/data/cafes.json');
  const buildWebAssetPath = path.resolve(__dirname, '../build/web/assets/data/cafes.json');
  const buildWebNestedAssetPath = path.resolve(__dirname, '../build/web/assets/assets/data/cafes.json');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Read existing dataset & export backup
  let existingData = { reference_point: null, cafes: [] };
  if (fs.existsSync(cafesPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(cafesPath, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse existing cafes.json for backup:', e.message);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `cafes_pre_reset_backup_${timestamp}.json`);

  const backupPayload = {
    backup_timestamp: new Date().toISOString(),
    backup_reason: 'Administrator directory restart: initiating fresh Google Maps link-based café registration.',
    total_cafes_backed_up: (existingData.cafes || []).length,
    reference_point: existingData.reference_point || {
      name: 'PSG College of Arts and Science Main Gate',
      area: 'Civil Aerodrome Post, Avinashi Road, Coimbatore, Tamil Nadu',
      latitude: 11.0326883,
      longitude: 77.0345773,
    },
    cafes: existingData.cafes || [],
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupPayload, null, 2), 'utf-8');
  console.log(`[Backup] Exported ${backupPayload.total_cafes_backed_up} café record(s) to: ${backupFile}`);

  // 2. Prepare clean, pristine empty directory structure
  const cleanDirectory = {
    reference_point: {
      name: 'PSG College of Arts and Science Main Gate',
      area: 'Civil Aerodrome Post, Avinashi Road, Coimbatore, Tamil Nadu',
      latitude: 11.0326883,
      longitude: 77.0345773,
    },
    cafes: [],
  };

  const cleanJson = JSON.stringify(cleanDirectory, null, 2);

  // 3. Write to primary database file
  fs.writeFileSync(cafesPath, cleanJson, 'utf-8');
  console.log(`[Reset] Reset ${cafesPath} -> cafes: []`);

  // 4. Sync to Flutter assets
  if (fs.existsSync(path.dirname(assetCafesPath))) {
    fs.writeFileSync(assetCafesPath, cleanJson, 'utf-8');
    console.log(`[Sync] Synced empty directory to: ${assetCafesPath}`);
  }

  // 5. Sync to build/web if present
  if (fs.existsSync(path.dirname(buildWebAssetPath))) {
    fs.writeFileSync(buildWebAssetPath, cleanJson, 'utf-8');
    console.log(`[Sync] Synced empty directory to: ${buildWebAssetPath}`);
  }
  if (fs.existsSync(path.dirname(buildWebNestedAssetPath))) {
    fs.writeFileSync(buildWebNestedAssetPath, cleanJson, 'utf-8');
    console.log(`[Sync] Synced empty directory to: ${buildWebNestedAssetPath}`);
  }

  // 6. Verify counts
  const verified = JSON.parse(fs.readFileSync(cafesPath, 'utf-8'));
  const totalCafes = (verified.cafes || []).length;
  let totalCategories = 0;
  let totalItems = 0;
  for (const c of verified.cafes || []) {
    if (Array.isArray(c.menu_categories)) {
      totalCategories += c.menu_categories.length;
      for (const cat of c.menu_categories) {
        if (Array.isArray(cat.items)) totalItems += cat.items.length;
      }
    }
  }

  console.log('=============================================');
  console.log('  ZIPBI CAFÉ DIRECTORY RESET VERIFICATION');
  console.log('=============================================');
  console.log(`  Total Cafés     : ${totalCafes}`);
  console.log(`  Menu Categories : ${totalCategories}`);
  console.log(`  Menu Items      : ${totalItems}`);
  console.log('  Database Schema : INTACT & READY FOR REGISTRATION');
  console.log('=============================================');

  return { totalCafes, totalCategories, totalItems, backupFile };
}

if (require.main === module) {
  resetCafeDirectory();
}

module.exports = { resetCafeDirectory };

