/**
 * Submissions data access.
 */
const { query } = require('../config/db');

async function create({ attempt_id, student_id, module, answers, word_count }) {
  const { rows } = await query(
    `INSERT INTO submissions (attempt_id, student_id, module, answers, word_count, status)
     VALUES ($1, $2, $3, $4::jsonb, $5, 'pending')
     RETURNING *`,
    [attempt_id, student_id, module, JSON.stringify(answers || {}), word_count ?? null]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM submissions WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listAllWithMeta() {
  // For admin queue. Joins student profile + nested test data + result (for reviewed band).
  const sql = `
    SELECT
      s.id,
      s.attempt_id,
      s.module,
      s.answers,
      s.word_count,
      s.status,
      s.submitted_at,
      jsonb_build_object(
        'full_name', p.full_name,
        'email',     p.email,
        'plan',      p.plan
      ) AS profiles,
      CASE WHEN a.id IS NULL THEN NULL ELSE
        jsonb_build_object(
          'track',  a.track,
          'format', a.format,
          'tests',  CASE WHEN t.id IS NULL THEN NULL
                         ELSE jsonb_build_object('title', t.title) END
        )
      END AS test_attempts,
      r.band_score::float   AS band_score,
      rev.full_name          AS reviewer_name
    FROM submissions s
    LEFT JOIN profiles      p    ON p.id  = s.student_id
    LEFT JOIN test_attempts a    ON a.id  = s.attempt_id
    LEFT JOIN tests         t    ON t.id  = a.test_id
    LEFT JOIN results       r    ON r.submission_id = s.id
    LEFT JOIN profiles      rev  ON rev.id = r.reviewed_by
    ORDER BY s.submitted_at DESC;
  `;
  const { rows } = await query(sql);
  return rows;
}

async function countPending() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM submissions WHERE status = 'pending'`
  );
  return rows[0].count;
}

async function markReviewed(id) {
  await query(`UPDATE submissions SET status = 'reviewed' WHERE id = $1`, [id]);
}

module.exports = {
  create,
  findById,
  listAllWithMeta,
  countPending,
  markReviewed,
};
