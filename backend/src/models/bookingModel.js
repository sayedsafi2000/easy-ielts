/**
 * Speaking bookings data access.
 */
const { query } = require('../config/db');

async function listForStudent(studentId) {
  const sql = `
    SELECT
      b.*,
      CASE WHEN ex.id IS NULL THEN NULL
           ELSE jsonb_build_object('full_name', ex.full_name) END AS examiner
    FROM speaking_bookings b
    LEFT JOIN profiles ex ON ex.id = b.examiner_id
    WHERE b.student_id = $1
    ORDER BY b.scheduled_at;
  `;
  const { rows } = await query(sql, [studentId]);
  return rows;
}

async function nextUpcomingForStudent(studentId) {
  const { rows } = await query(
    `SELECT *
       FROM speaking_bookings
      WHERE student_id = $1
        AND status = 'confirmed'
        AND scheduled_at >= NOW()
      ORDER BY scheduled_at
      LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
}

async function listUpcoming(limit = 5) {
  const sql = `
    SELECT
      b.id,
      b.scheduled_at,
      b.status,
      jsonb_build_object('full_name', sp.full_name) AS student,
      CASE WHEN ep.id IS NULL THEN NULL
           ELSE jsonb_build_object('full_name', ep.full_name) END AS examiner
    FROM speaking_bookings b
    LEFT JOIN profiles sp ON sp.id = b.student_id
    LEFT JOIN profiles ep ON ep.id = b.examiner_id
    WHERE b.status = 'confirmed'
      AND b.scheduled_at >= NOW()
    ORDER BY b.scheduled_at
    LIMIT $1;
  `;
  const { rows } = await query(sql, [limit]);
  return rows;
}

async function create({ student_id, examiner_id, attempt_id, scheduled_at, meeting_link }) {
  const { rows } = await query(
    `INSERT INTO speaking_bookings
       (student_id, examiner_id, attempt_id, scheduled_at, status, meeting_link)
     VALUES ($1, $2, $3, $4, 'confirmed', $5)
     RETURNING *`,
    [student_id, examiner_id, attempt_id, scheduled_at, meeting_link]
  );
  return rows[0];
}

module.exports = {
  listForStudent,
  nextUpcomingForStudent,
  listUpcoming,
  create,
};
