const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const source = path.resolve(process.env.DATABASE_PATH || path.join(__dirname, '..', 'portfolio.db'));
if (!fs.existsSync(source)) {
  console.error(`Database not found: ${source}`);
  process.exit(1);
}

const destinationDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'));
fs.mkdirSync(destinationDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFolder = path.join(destinationDir, `portfolio-${stamp}`);
fs.mkdirSync(backupFolder, { recursive: true });
const destination = path.join(backupFolder, 'portfolio.sqlite');
const uploadsSource = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
const db = new sqlite3.Database(source, sqlite3.OPEN_READONLY, (openError) => {
  if (openError) {
    console.error(`Could not open database: ${openError.message}`);
    process.exitCode = 1;
    return;
  }
  db.backup(destination, (backupError) => {
    if (backupError) {
      console.error(`Backup failed: ${backupError.message}`);
      process.exitCode = 1;
    } else {
      try {
        if (fs.existsSync(uploadsSource)) fs.cpSync(uploadsSource, path.join(backupFolder, 'uploads'), { recursive: true, force: true });
        console.log(`Portfolio backup created: ${backupFolder}`);
      } catch (error) {
        console.error(`Database copied, but upload backup failed: ${error.message}`);
        process.exitCode = 1;
      }
    }
    db.close();
  });
});
