/**
 * User / profile data access — raw SQL via the pg pool.
 */
const { query } = require('../config/db');

const PUBLIC_COLUMNS = `
  id, email, full_name, avatar_url, role, plan, target_band, country, track,
  email_verified, created_at, updated_at
`;

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash
       FROM profiles
      WHERE email = $1
      LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM profiles WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createUser({ email, password_hash, full_name, role = 'student' }) {
  const { rows } = await query(
    `INSERT INTO profiles (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, password_hash, full_name, role]
  );
  return rows[0];
}

async function updateProfile(id, fields) {
  const allowed = ['full_name', 'avatar_url', 'plan', 'target_band', 'country', 'track'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      sets.push(`${k} = $${i}`);
      values.push(fields[k]);
      i++;
    }
  }
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rows } = await query(
    `UPDATE profiles SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${i}
     RETURNING ${PUBLIC_COLUMNS}`,
    values
  );
  return rows[0];
}

async function listStudents({ limit = 100, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT p.${PUBLIC_COLUMNS.split(',').map((c) => c.trim()).join(', p.')}
       FROM profiles p
      WHERE p.role = 'student'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function countByRole(role) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM profiles WHERE role = $1`,
    [role]
  );
  return rows[0].count;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateProfile,
  listStudents,
  countByRole,
};
