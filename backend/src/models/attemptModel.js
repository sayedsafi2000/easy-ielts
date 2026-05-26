/**
 * Test attempts data access. Joins tests + nested results when needed
 * so that the API matches the shape the frontend already expects.
 */
const { query } = require('../config/db');

/**
 * Returns attempts for a student, newest first, with nested test info
 * and an array of result rows for the dashboard / history pages.
 */
async function listForStudent(studentId, { limit = 50 } = {}) {
  const sql = `
    SELECT
      a.id,
      a.test_id,
      a.track,
      a.format,
      a.module,
      a.status,
      a.started_at,
      a.submitted_at,
      a.completed_at,
      CASE WHEN t.id IS NULL THEN NULL
           ELSE jsonb_build_object('title', t.title, 'type', t.type)
      END AS tests,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('module', r.module, 'band_score', r.band_score))
           FROM results r
          WHERE r.attempt_id = a.id),
        '[]'::jsonb
      ) AS results
    FROM test_attempts a
    LEFT JOIN tests t ON t.id = a.test_id
    WHERE a.student_id = $1
    ORDER BY a.started_at DESC
    LIMIT $2;
  `;
  const { rows } = await query(sql, [studentId, limit]);
  return rows;
}

async function create({ student_id, test_id, track = 'academic', format = 'full', module = null }) {
  const { rows } = await query(
    `INSERT INTO test_attempts (student_id, test_id, track, format, module, status)
     VALUES ($1, $2, $3, $4, $5, 'in_progress')
     RETURNING *`,
    [student_id, test_id, track, format, module]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM test_attempts WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

async function markSubmitted(id) {
  const { rows } = await query(
    `UPDATE test_attempts
        SET status = 'submitted',
            submitted_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [id]
  );
  return rows[0];
}

async function markCompleted(id) {
  const { rows } = await query(
    `UPDATE test_attempts
        SET status = 'completed',
            completed_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [id]
  );
  return rows[0];
}

module.exports = {
  listForStudent,
  create,
  findById,
  markSubmitted,
  markCompleted,
};
