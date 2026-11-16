const path = require('path');

function createRemoteDatabase() {
  const { createClient } = require('@libsql/client');
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  let pending = Promise.resolve();

  const enqueue = (sql, args, callback, mode) => {
    const operation = pending.then(() => client.execute({ sql, args }));
    pending = operation.catch(() => {});
    if (!callback) return;
    operation.then((result) => {
      const rows = result.rows.map((row) => Object.fromEntries(result.columns.map((column, index) => [column, row[index]])));
      if (mode === 'all') callback(null, rows);
      else if (mode === 'get') callback(null, rows[0]);
      else callback.call({ lastID: Number(result.lastInsertRowid || 0), changes: Number(result.rowsAffected || 0) }, null);
    }).catch(callback);
  };

  return {
    serialize(fn) { fn(); },
    run(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueue(sql, args || [], callback, 'run');
      return this;
    },
    get(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueue(sql, args || [], callback, 'get');
      return this;
    },
    all(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueue(sql, args || [], callback, 'all');
      return this;
    },
  };
}

module.exports = process.env.TURSO_DATABASE_URL
  ? createRemoteDatabase()
  : new (require('sqlite3').verbose().Database)(path.resolve(process.env.DATABASE_PATH || path.join(__dirname, '..', 'portfolio.db')));
