/**
 * Apply every *.sql file in /migrations (alphabetical order) to the
 * configured PostgreSQL database. Idempotent — uses CREATE TABLE IF NOT EXISTS
 * etc. throughout.
 *
 * Run:  npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

(async () => {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  if (!files.length) {
    console.warn('No migration files found in', dir);
    process.exit(0);
  }

  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log(`Running ${f}…`);
      await pool.query(sql);
      console.log(`  ✅  ${f}`);
    }
    console.log('\n✅  All migrations applied.');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
