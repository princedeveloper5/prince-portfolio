const path = require('path');

function createRemoteDatabase() {
  const { createClient } = require('@libsql/client');
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  let writeQueue = Promise.resolve();
  const activeReads = new Set();

  const deliver = (operation, callback, mode) => {
    if (!callback) return;
    operation.then((result) => {
      const rows = result.rows.map((row) => Object.fromEntries(result.columns.map((column, index) => [column, row[index]])));
      if (mode === 'all') callback(null, rows);
      else if (mode === 'get') callback(null, rows[0]);
      else callback.call({ lastID: Number(result.lastInsertRowid || 0), changes: Number(result.rowsAffected || 0) }, null);
    }).catch(callback);
  };

  const enqueueWrite = (sql, args, callback) => {
    // Keep mutations ordered and let any reads already in flight finish first.
    const operation = Promise.all([writeQueue, ...activeReads]).then(() => client.execute({ sql, args }));
    writeQueue = operation.catch(() => {});
    deliver(operation, callback, 'run');
  };

  const enqueueRead = (sql, args, callback, mode) => {
    // Reads wait for earlier writes, while reads from the same snapshot can
    // run together instead of paying one network round trip at a time.
    const operation = writeQueue.then(() => client.execute({ sql, args }));
    activeReads.add(operation);
    const removeRead = () => activeReads.delete(operation);
    operation.then(removeRead, removeRead);
    deliver(operation, callback, mode);
  };

  return {
    serialize(fn) { fn(); },
    run(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueueWrite(sql, args || [], callback);
      return this;
    },
    get(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueueRead(sql, args || [], callback, 'get');
      return this;
    },
    all(sql, args, callback) {
      if (typeof args === 'function') { callback = args; args = []; }
      enqueueRead(sql, args || [], callback, 'all');
      return this;
    },
  };
}

module.exports = process.env.TURSO_DATABASE_URL
  ? createRemoteDatabase()
  : new (require('sqlite3').verbose().Database)(path.resolve(process.env.DATABASE_PATH || path.join(__dirname, '..', 'portfolio.db')));
