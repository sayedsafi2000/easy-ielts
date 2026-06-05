/**
 * Transactional email — best-effort, configurable, degrades to a no-op.
 *
 * Provider resolution order:
 *   1. RESEND_API_KEY set            → send via the Resend HTTP API (global fetch).
 *   2. SMTP_HOST + SMTP_USER set     → send via nodemailer (lazy-required).
 *   3. otherwise                     → no-op (log in dev) so the app never breaks.
 *
 * Callers should treat email as best-effort: never let a mail failure roll back
 * a DB transaction. `sendMail` resolves to { sent, provider, error? } and never
 * throws.
 */

const FROM = process.env.MAIL_FROM || 'Easy IELTS <no-reply@easy-ielts.local>';

function provider() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER) return 'smtp';
  return 'none';
}

function isConfigured() {
  return provider() !== 'none';
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

let _transport;
async function sendViaSmtp({ to, subject, html, text }) {
  // Lazy require so the app runs without nodemailer installed unless SMTP is used.
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return _transport.sendMail({ from: FROM, to, subject, html, text });
}

/**
 * Send an email. Never throws; returns a small status object.
 * @param {{to:string|string[], subject:string, html?:string, text?:string}} msg
 */
async function sendMail(msg) {
  const p = provider();
  if (p === 'none' || !msg || !msg.to) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[mail:none] would send "${msg?.subject}" to ${msg?.to}`);
    }
    return { sent: false, provider: 'none' };
  }
  try {
    if (p === 'resend') await sendViaResend(msg);
    else await sendViaSmtp(msg);
    return { sent: true, provider: p };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { sent: false, provider: p, error: err.message };
  }
}

module.exports = { sendMail, isConfigured, provider };
