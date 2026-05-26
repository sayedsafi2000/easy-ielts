/**
 * Results data access.
 */
const { query } = require('../config/db');

async function listForStudent(studentId) {
  const sql = `
    SELECT
      r.id,
      r.attempt_id,
      r.submission_id,
      r.module,
      r.band_score,
      r.task1_score,
      r.task2_score,
      r.feedback,
      r.criteria,
      r.published_at,
      r.created_at,
      CASE WHEN a.id IS NULL THEN NULL ELSE
        jsonb_build_object(
          'track',  a.track,
          'format', a.format,
          'tests',  CASE WHEN t.id IS NULL THEN NULL
                         ELSE jsonb_build_object('title', t.title) END
        )
      END AS test_attempts,
      CASE WHEN rev.id IS NULL THEN NULL
           ELSE jsonb_build_object('full_name', rev.full_name)
      END AS reviewer
    FROM results r
    LEFT JOIN test_attempts a ON a.id = r.attempt_id
    LEFT JOIN tests t        ON t.id = a.test_id
    LEFT JOIN profiles rev   ON rev.id = r.reviewed_by
    WHERE r.student_id = $1
    ORDER BY r.created_at DESC;
  `;
  const { rows } = await query(sql, [studentId]);
  return rows;
}

async function create(payload) {
  const {
    attempt_id, student_id, submission_id,
    module, band_score, task1_score, task2_score,
    feedback, criteria, reviewed_by,
  } = payload;
  const { rows } = await query(
    `INSERT INTO results
       (attempt_id, student_id, submission_id, module,
        band_score, task1_score, task2_score, feedback, criteria, reviewed_by, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, NOW())
     RETURNING *`,
    [
      attempt_id, student_id, submission_id, module,
      band_score, task1_score, task2_score, feedback,
      JSON.stringify(criteria || {}), reviewed_by,
    ]
  );
  return rows[0];
}

async function averageBand() {
  const { rows } = await query(
    `SELECT AVG(band_score)::numeric(3,1) AS avg FROM results WHERE band_score IS NOT NULL`
  );
  return rows[0].avg;
}

module.exports = {
  listForStudent,
  create,
  averageBand,
};
