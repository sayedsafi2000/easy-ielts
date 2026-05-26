/**
 * PostgreSQL connection pool.
 *
 * Uses node-postgres (pg). All queries should be issued through this pool
 * via parameterised queries. NEVER concatenate user input into SQL strings.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // Catastrophic pool error — log and exit so the process supervisor restarts us.
  console.error('[pg] Unexpected pool error:', err);
  process.exit(1);
});

/**
 * Helper: run a parameterised query and return rows.
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    const ms = Date.now() - start;
    console.log(`[pg] ${ms}ms · rows=${res.rowCount} · ${text.split('\n')[0].slice(0, 80)}`);
  }
  return res;
}

module.exports = { pool, query };
