/**
 * Small AES-256-GCM helper for encrypting runtime-acquired secrets at rest
 * (currently the Google "scheduler" refresh token in integration_credentials).
 *
 * Key derived from INTEGRATION_ENC_KEY (fall back to JWT_SECRET in dev). The
 * blob format is base64(iv).base64(tag).base64(ciphertext).
 */
const crypto = require('crypto');

const KEY = crypto
  .createHash('sha256')
  .update(process.env.INTEGRATION_ENC_KEY || process.env.JWT_SECRET || 'dev-insecure-key')
  .digest(); // 32 bytes

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
}

function decrypt(blob) {
  if (!blob || typeof blob !== 'string' || !blob.includes('.')) return null;
  try {
    const [ivb, tagb, encb] = blob.split('.');
    const iv = Buffer.from(ivb, 'base64');
    const tag = Buffer.from(tagb, 'base64');
    const enc = Buffer.from(encb, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch (err) {
    console.error('[crypto] decrypt failed:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
