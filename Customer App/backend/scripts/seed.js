const fs = require('fs');
const path = require('path');
const db = require('../src/db');

console.log('--- ZIPBI DATABASE SEED SCRIPT ---');
console.log('Reloading verified Coimbatore cafes and menus...');
db.reloadCafes();
const cafes = db.getAllCafes();
console.log(`Successfully verified ${cafes.length} cafes in memory/database.`);
for (const c of cafes) {
  console.log(`- [${c.verification_status}] ${c.name} (${c.calculated_distance_km} km) - Ordering: ${c.is_ordering_enabled ? 'ENABLED' : 'DISABLED'}`);
}
console.log('Seed completed successfully.');

