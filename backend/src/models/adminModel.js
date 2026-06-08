/**
 * Admin-specific database queries.
 * All public admin API endpoints use these functions.
 */
const { query } = require('../config/db');

// ─── Students ────────────────────────────────────────────────────────
/**
 * List all students with test count + best band included.
 */
async function listStudents({ limit = 200, offset = 0 } = {}) {
  const sql = `
    SELECT
      p.id, p.email, p.full_name, p.avatar_url, p.role, p.plan,
      p.target_band, p.country, p.track, p.email_verified, p.created_at, p.updated_at,
      COALESCE(COUNT(DISTINCT a.id), 0)::int            AS test_count,
      COALESCE(MAX(r.band_score)::numeric, NULL)        AS best_band
    FROM profiles p
    LEFT JOIN test_attempts a ON a.student_id = p.id
    LEFT JOIN results        r ON r.student_id = p.id
    WHERE p.role = 'student'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await query(sql, [limit, offset]);
  return rows;
}

async function getStudentDetail(studentId) {
  const profRes = await query(
    `SELECT id, email, full_name, avatar_url, role, plan, target_band, country, track, email_verified, created_at
       FROM profiles WHERE id = $1 LIMIT 1`,
    [studentId]
  );
  if (!profRes.rows[0]) return null;

  const attRes = await query(
    `SELECT
        a.id, a.track, a.format, a.module, a.status,
        a.started_at, a.submitted_at, a.completed_at,
        COALESCE(t.title, 'Mock Test') AS test_title,
        COALESCE(t.type, 'academic')   AS test_type,
        COALESCE(
          jsonb_agg(
            jsonb_build_object('module', r.module, 'band_score', r.band_score)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) AS results
      FROM test_attempts a
      LEFT JOIN tests   t ON t.id = a.test_id
      LEFT JOIN results r ON r.attempt_id = a.id
      WHERE a.student_id = $1
      GROUP BY a.id, t.title, t.type
      ORDER BY a.started_at DESC`,
    [studentId]
  );

  const bkRes = await query(
    `SELECT
        COUNT(*)::int AS total,
        (SELECT scheduled_at FROM speaking_bookings
          WHERE student_id = $1 AND status = 'confirmed' AND scheduled_at >= NOW()
          ORDER BY scheduled_at LIMIT 1) AS next_session
     FROM speaking_bookings WHERE student_id = $1`,
    [studentId]
  );

  return {
    profile:        profRes.rows[0],
    attempts:       attRes.rows,
    speaking_count: bkRes.rows[0]?.total  ?? 0,
    next_session:   bkRes.rows[0]?.next_session ?? null,
  };
}

async function setStudentStatus(id, suspended) {
  // We use email_verified as a lightweight active/suspended flag.
  // In a real app you'd add a `suspended_at` column.
  await query(
    `UPDATE profiles SET email_verified = $1, updated_at = NOW() WHERE id = $2`,
    [!suspended, id]
  );
}

// ─── Bookings ────────────────────────────────────────────────────────
async function listAllBookings() {
  const sql = `
    SELECT
      b.id, b.student_id, b.examiner_id, b.scheduled_at,
      b.duration_minutes, b.status, b.meeting_link,
      b.notes, b.created_at, b.attempt_id,
      sp.full_name                                              AS student_name,
      sp.email                                                  AS student_email,
      CASE WHEN ep.id IS NULL THEN NULL ELSE ep.full_name END   AS examiner_name,
      COALESCE(a.track, 'academic')                             AS track
    FROM speaking_bookings b
    LEFT JOIN profiles sp ON sp.id = b.student_id
    LEFT JOIN profiles ep ON ep.id = b.examiner_id
    LEFT JOIN test_attempts a ON a.id = b.attempt_id
    ORDER BY b.scheduled_at DESC NULLS LAST, b.created_at DESC;
  `;
  const { rows } = await query(sql);
  return rows;
}

async function updateBookingStatus(id, fields) {
  const allowed = ['status', 'scheduled_at'];
  const sets = [];
  const values = [];
  let i = 1;
  const payload = typeof fields === 'string' ? { status: fields } : fields;
  for (const k of allowed) {
    if (payload[k] !== undefined) {
      sets.push(`${k} = $${i++}`);
      values.push(payload[k]);
    }
  }
  if (!sets.length) {
    const { rows } = await query(`SELECT * FROM speaking_bookings WHERE id = $1`, [id]);
    return rows[0];
  }
  values.push(id);
  const { rows } = await query(
    `UPDATE speaking_bookings SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0];
}

// ─── Results ─────────────────────────────────────────────────────────
async function listAllResults() {
  const sql = `
    SELECT
      r.id, r.attempt_id, r.student_id, r.module,
      r.band_score::float,  r.task1_score::float, r.task2_score::float,
      r.feedback, r.criteria, r.published_at,
      sp.full_name                                              AS student_name,
      sp.email                                                  AS student_email,
      CASE WHEN rev.id IS NULL THEN NULL ELSE rev.full_name END AS reviewer_name,
      COALESCE(t.title, 'Mock Test')                            AS test_title,
      COALESCE(a.track, 'academic')                             AS track,
      COALESCE(a.format, 'full')                                AS format
    FROM results r
    LEFT JOIN profiles      sp  ON sp.id  = r.student_id
    LEFT JOIN profiles      rev ON rev.id = r.reviewed_by
    LEFT JOIN test_attempts a   ON a.id   = r.attempt_id
    LEFT JOIN tests         t   ON t.id   = a.test_id
    ORDER BY r.created_at DESC;
  `;
  const { rows } = await query(sql);
  return rows;
}

// ─── Examiners ───────────────────────────────────────────────────────
async function listAllExaminers() {
  const sql = `
    SELECT
      p.id, p.full_name, p.email, p.created_at,
      e.specialization, e.rating,
      COALESCE(COUNT(DISTINCT sb.id),  0)::int AS total_sessions,
      COALESCE(COUNT(DISTINCT sb2.id), 0)::int AS upcoming_today,
      (SELECT COUNT(*)::int FROM submissions WHERE status = 'pending') AS pending_reviews
    FROM profiles p
    LEFT JOIN examiners          e   ON e.profile_id  = p.id
    LEFT JOIN speaking_bookings  sb  ON sb.examiner_id = p.id AND sb.status = 'completed'
    LEFT JOIN speaking_bookings  sb2 ON sb2.examiner_id = p.id
                                    AND sb2.status = 'confirmed'
                                    AND sb2.scheduled_at >= NOW()
    WHERE p.role = 'examiner'
    GROUP BY p.id, p.full_name, p.email, p.created_at, e.specialization, e.rating
    ORDER BY p.created_at ASC;
  `;
  const { rows } = await query(sql);
  return rows;
}

// ─── Submissions ─────────────────────────────────────────────────────
async function getSubmissionById(id) {
  const sql = `
    SELECT
      s.id, s.attempt_id, s.student_id, s.module,
      s.answers, s.word_count, s.status, s.submitted_at,
      sp.full_name     AS student_name,
      sp.email         AS student_email,
      sp.plan          AS student_plan,
      sp.target_band,
      COALESCE(a.track,  'academic') AS track,
      COALESCE(a.format, 'full')     AS format,
      COALESCE(t.title, 'Mock Test') AS test_title,
      (SELECT r.band_score::float FROM results r
        WHERE r.student_id = s.student_id AND r.module = 'writing'
        ORDER BY r.created_at DESC LIMIT 1) AS prev_writing_band
    FROM submissions s
    LEFT JOIN profiles      sp ON sp.id = s.student_id
    LEFT JOIN test_attempts a  ON a.id  = s.attempt_id
    LEFT JOIN tests         t  ON t.id  = a.test_id
    WHERE s.id = $1 LIMIT 1;
  `;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
}

// ─── Tests ───────────────────────────────────────────────────────────
async function listAllTestsAdmin() {
  const sql = `
    SELECT
      t.id, t.title, t.type, t.modules, t.difficulty,
      t.duration_minutes, t.status, t.notes, t.created_at,
      COALESCE(COUNT(DISTINCT a.id), 0)::int AS attempts
    FROM tests t
    LEFT JOIN test_attempts a ON a.test_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC;
  `;
  const { rows } = await query(sql);
  return rows;
}

module.exports = {
  listStudents,
  getStudentDetail,
  setStudentStatus,
  listAllBookings,
  updateBookingStatus,
  listAllResults,
  listAllExaminers,
  getSubmissionById,
  listAllTestsAdmin,
};
