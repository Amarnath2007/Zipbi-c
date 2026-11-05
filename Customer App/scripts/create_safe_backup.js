const fs = require('fs');
const path = require('path');

const backupsDir = path.resolve(__dirname, '../data/backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const cafesBackup = path.join(backupsDir, `cafes_safe_backup_${ts}.json`);
const usersBackup = path.join(backupsDir, `users_safe_backup_${ts}.json`);

fs.copyFileSync(path.resolve(__dirname, '../data/cafes.json'), cafesBackup);
fs.copyFileSync(path.resolve(__dirname, '../data/users.json'), usersBackup);

console.log(`[BACKUP CREATED] ${cafesBackup}`);
console.log(`[BACKUP CREATED] ${usersBackup}`);

