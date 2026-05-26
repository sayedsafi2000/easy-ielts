/**
 * Tests data access.
 */
const { query } = require('../config/db');

async function listPublished() {
  const { rows } = await query(
    `SELECT id, title, type, modules, difficulty, duration_minutes, status, created_at
       FROM tests
      WHERE status = 'published'
      ORDER BY created_at DESC`
  );
  return rows;
}

async function listAll() {
  const { rows } = await query(
    `SELECT id, title, type, modules, difficulty, duration_minutes, status, notes, created_at
       FROM tests
      ORDER BY created_at DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM tests WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ title, type, modules, difficulty, duration_minutes, status, notes, created_by }) {
  const { rows } = await query(
    `INSERT INTO tests (title, type, modules, difficulty, duration_minutes, status, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, type, modules, difficulty, duration_minutes, status, notes, created_by]
  );
  return rows[0];
}

async function update(id, fields) {
  const allowed = ['title', 'type', 'modules', 'difficulty', 'duration_minutes', 'status', 'notes'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      sets.push(`${k} = $${i++}`);
      values.push(fields[k]);
    }
  }
  if (!sets.length) return findById(id);
  values.push(id);
  const { rows } = await query(
    `UPDATE tests SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0];
}

async function remove(id) {
  await query(`DELETE FROM tests WHERE id = $1`, [id]);
}

async function countAttemptsThisMonth() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
       FROM test_attempts
      WHERE started_at >= date_trunc('month', NOW())`
  );
  return rows[0].count;
}

async function totalAttemptCount() {
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM test_attempts`);
  return rows[0].count;
}

module.exports = {
  listPublished,
  listAll,
  findById,
  create,
  update,
  remove,
  countAttemptsThisMonth,
  totalAttemptCount,
};
