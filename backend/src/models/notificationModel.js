/**
 * In-app notifications data access.
 */
const { query } = require('../config/db');

async function create({ user_id, type, title, body = null, link = null, data = {} }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body, link, data)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [user_id, type, title, body, link, JSON.stringify(data || {})]
  );
  return rows[0];
}

/**
 * Fan-out insert to every profile with the given role (e.g. all admins),
 * in a single statement. Returns the created rows.
 */
async function createForRole(role, { type, title, body = null, link = null, data = {} }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body, link, data)
     SELECT id, $2, $3, $4, $5, $6::jsonb FROM profiles WHERE role = $1
     RETURNING *`,
    [role, type, title, body, link, JSON.stringify(data || {})]
  );
  return rows;
}

async function listForUser(userId, { limit = 30 } = {}) {
  const { rows } = await query(
    `SELECT id, type, title, body, link, data, read_at, created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function unreadCount(userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return rows[0].count;
}

async function markRead(userId, id) {
  const { rows } = await query(
    `UPDATE notifications SET read_at = NOW()
      WHERE id = $1 AND user_id = $2 AND read_at IS NULL
      RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
}

async function markAllRead(userId) {
  await query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
}

/** Emails of every profile with a given role — for email fan-out. */
async function emailsForRole(role) {
  const { rows } = await query(
    `SELECT email FROM profiles WHERE role = $1 AND email IS NOT NULL`,
    [role]
  );
  return rows.map((r) => r.email);
}

/** Email for a single user id. */
async function emailForUser(userId) {
  const { rows } = await query(`SELECT email FROM profiles WHERE id = $1 LIMIT 1`, [userId]);
  return rows[0]?.email || null;
}

module.exports = {
  create,
  createForRole,
  listForUser,
  unreadCount,
  markRead,
  markAllRead,
  emailsForRole,
  emailForUser,
};
