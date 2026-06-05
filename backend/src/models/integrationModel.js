/**
 * integration_credentials data access — runtime-acquired secrets (encrypted).
 * Currently stores the Google "scheduler" OAuth refresh token.
 */
const { query } = require('../config/db');
const { encrypt, decrypt } = require('../lib/crypto');

/**
 * Persist a credential. `refresh_token` is encrypted at rest; other fields
 * (email, connected_by) are kept plaintext in the JSON.
 */
async function saveCredential(provider, { refresh_token, email = null, connected_by = null }) {
  const data = {
    refresh_token_enc: refresh_token ? encrypt(refresh_token) : null,
    email,
    connected_by,
    connected_at: new Date().toISOString(),
  };
  await query(
    `INSERT INTO integration_credentials (provider, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (provider) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [provider, JSON.stringify(data)]
  );
}

/**
 * Returns { refresh_token (decrypted), email, connected_at } or null.
 */
async function getCredential(provider) {
  const { rows } = await query(
    `SELECT data FROM integration_credentials WHERE provider = $1 LIMIT 1`,
    [provider]
  );
  if (!rows[0]) return null;
  const d = rows[0].data || {};
  return {
    refresh_token: d.refresh_token_enc ? decrypt(d.refresh_token_enc) : null,
    email: d.email || null,
    connected_at: d.connected_at || null,
  };
}

async function hasCredential(provider) {
  const { rows } = await query(
    `SELECT 1 FROM integration_credentials WHERE provider = $1 LIMIT 1`,
    [provider]
  );
  return rows.length > 0;
}

module.exports = { saveCredential, getCredential, hasCredential };
