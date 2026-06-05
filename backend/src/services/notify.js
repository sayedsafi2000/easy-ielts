/**
 * Notification service.
 *
 * The in-app notification row is the source of truth and is always written
 * first. Email is best-effort: gated by the `notify_email_enabled` platform
 * setting and the mailer being configured, and never allowed to throw into the
 * caller (so a mail outage can't roll back a booking transaction).
 *
 * Call these AFTER the DB transaction that changed state has committed.
 */
const notificationModel = require('../models/notificationModel');
const { query } = require('../config/db');
const { sendMail, isConfigured } = require('../lib/mailer');

const FRONTEND = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Tiny cache for the email toggle so we don't hit the DB on every notification.
let _emailToggle = { value: null, at: 0 };
async function emailEnabled() {
  if (!isConfigured()) return false;
  const now = Date.now();
  if (_emailToggle.value !== null && now - _emailToggle.at < 60_000) return _emailToggle.value;
  let on = true;
  try {
    const { rows } = await query(
      `SELECT value FROM platform_settings WHERE key = 'notify_email_enabled' LIMIT 1`
    );
    if (rows[0]) on = rows[0].value !== 'false';
  } catch (_) { /* default on */ }
  _emailToggle = { value: on, at: now };
  return on;
}

function renderHtml({ title, body, link }) {
  const url = link ? `${FRONTEND}${link}` : null;
  const button = url
    ? `<p style="margin:24px 0"><a href="${url}" style="background:#8f69f7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600">Open Easy IELTS</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
    <h2 style="color:#6a45d0">${title}</h2>
    ${body ? `<p style="font-size:15px;line-height:1.6;color:#444">${body}</p>` : ''}
    ${button}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#999">Easy IELTS — speaking sessions</p>
  </div>`;
}

async function maybeEmail(recipients, payload) {
  try {
    if (!recipients || recipients.length === 0) return;
    if (!(await emailEnabled())) return;
    await sendMail({
      to: recipients,
      subject: payload.email?.subject || payload.title,
      text: payload.email?.text || payload.body || payload.title,
      html: payload.email?.html || renderHtml(payload),
    });
  } catch (err) {
    console.error('[notify] email failed:', err.message);
  }
}

/**
 * Notify a single user (in-app + best-effort email).
 * @param {string} userId
 * @param {{type,title,body?,link?,data?,email?}} payload
 */
async function notifyUser(userId, payload) {
  try {
    await notificationModel.create({ user_id: userId, ...payload });
  } catch (err) {
    console.error('[notify] create failed:', err.message);
    return;
  }
  const email = await notificationModel.emailForUser(userId);
  await maybeEmail(email ? [email] : [], payload);
}

/**
 * Notify every user with a role (in-app fan-out + best-effort bulk email).
 */
async function notifyRole(role, payload) {
  try {
    await notificationModel.createForRole(role, payload);
  } catch (err) {
    console.error('[notify] role fan-out failed:', err.message);
    return;
  }
  const emails = await notificationModel.emailsForRole(role);
  await maybeEmail(emails, payload);
}

const notifyAdmins = (payload) => notifyRole('admin', payload);

module.exports = { notifyUser, notifyRole, notifyAdmins };
