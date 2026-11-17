try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')); } catch {}

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before migrating.');
}
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.SUPABASE_URL || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY before migrating uploads.');
}

const { createClient } = require('@libsql/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { getProjectUrl } = require('../server/supabase-url.cjs');
const remoteDb = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const supabase = createSupabaseClient(getProjectUrl(process.env.SUPABASE_URL), supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-uploads';
const source = new sqlite3.Database(path.join(__dirname, '..', 'portfolio.db'));
const tables = ['users', 'password_reset_tokens', 'projects', 'skills', 'home_content', 'about_content', 'visit_days', 'messages', 'counters'];
const localAll = (sql) => new Promise((resolve, reject) => source.all(sql, (error, rows) => error ? reject(error) : resolve(rows)));
const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;

async function main() {
  const { data: existing, error: bucketError } = await supabase.storage.getBucket(bucket);
  if (bucketError || !existing) {
    const created = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
    if (created.error && !/already exists/i.test(created.error.message)) throw created.error;
  }

  for (const table of tables) {
    const rows = await localAll(`SELECT * FROM ${quote(table)}`);
    if (!rows.length) continue;
    const columns = await localAll(`PRAGMA table_info(${quote(table)})`);
    const primaryKey = columns.filter((column) => column.pk).sort((a, b) => a.pk - b.pk).map((column) => column.name);
    if (!primaryKey.length) throw new Error(`No primary key found for ${table}`);
    const names = Object.keys(rows[0]);
    const conflictTarget = primaryKey.map(quote).join(', ');
    const updates = names.filter((name) => !primaryKey.includes(name));
    const upsert = updates.length
      ? `DO UPDATE SET ${updates.map((name) => `${quote(name)} = excluded.${quote(name)}`).join(', ')}`
      : 'DO NOTHING';
    const sql = `INSERT INTO ${quote(table)} (${names.map(quote).join(', ')}) VALUES (${names.map(() => '?').join(', ')}) ON CONFLICT (${conflictTarget}) ${upsert}`;
    for (const row of rows) await remoteDb.execute({ sql, args: names.map((name) => row[name] ?? null) });
    console.log(`Migrated ${rows.length} ${table} rows`);
  }

  const uploadDir = path.join(__dirname, '..', 'server', 'uploads');
  const contentTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
  for (const name of fs.readdirSync(uploadDir)) {
    const fullPath = path.join(uploadDir, name);
    if (!fs.statSync(fullPath).isFile()) continue;
    const { error } = await supabase.storage.from(bucket).upload(name, fs.readFileSync(fullPath), {
      contentType: contentTypes[path.extname(name).toLowerCase()] || 'application/octet-stream',
      upsert: true,
    });
    if (error) throw error;
    console.log(`Uploaded ${name}`);
  }
  await remoteDb.close();
  source.close();
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
