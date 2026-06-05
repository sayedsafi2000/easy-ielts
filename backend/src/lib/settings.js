/**
 * Read-through helper for the platform_settings key/value table, with a short
 * in-memory cache so hot paths (e.g. scheduling) don't hit the DB each time.
 */
const { query } = require('../config/db');

const cache = new Map(); // key -> { value, at }
const TTL = 60_000;

async function getSetting(key, fallback = null) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  let value = fallback;
  try {
    const { rows } = await query(`SELECT value FROM platform_settings WHERE key = $1 LIMIT 1`, [key]);
    if (rows[0]) value = rows[0].value;
  } catch (_) { /* fall back */ }
  cache.set(key, { value, at: Date.now() });
  return value;
}

async function getBool(key, fallback = false) {
  const v = await getSetting(key, fallback ? 'true' : 'false');
  return v === true || v === 'true';
}

module.exports = { getSetting, getBool };
