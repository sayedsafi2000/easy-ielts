/**
 * Speaking bookings data access + state machine.
 *
 * Status flow:
 *   requested -> assigned -> (scheduled | time_proposed)
 *   time_proposed -> (scheduled | declined)
 *   scheduled -> completed
 *   any non-terminal -> cancelled
 *
 * Transitions are enforced with state-asserting conditional UPDATEs
 * (`... WHERE id=$1 AND status='<expected>'`); a 0-row result means the booking
 * wasn't in the expected state and the caller should return 409. Scheduling
 * (which creates a real meeting) runs inside a transaction with `SELECT ... FOR
 * UPDATE` so concurrent accepts serialize and exactly one meeting is created.
 */
const { query, withTransaction } = require('../config/db');
const providers = require('../lib/meetingProviders');
const { httpError } = require('../middleware/errorHandler');

const EXAMINER_JSON = `CASE WHEN ex.id IS NULL THEN NULL
  ELSE jsonb_build_object('id', ex.id, 'full_name', ex.full_name, 'email', ex.email) END`;

// ─── Reads ──────────────────────────────────────────────────
async function listForStudent(studentId) {
  const { rows } = await query(
    `SELECT
        b.id, b.scheduled_at, b.proposed_at, b.status, b.provider, b.join_url,
        b.duration_minutes, b.recording_status, b.recording_url, b.transcript_url,
        b.result_id, b.created_at,
        ${EXAMINER_JSON} AS examiner,
        (SELECT band_score::float FROM results r WHERE r.id = b.result_id) AS band
      FROM speaking_bookings b
      LEFT JOIN profiles ex ON ex.id = b.examiner_id
      WHERE b.student_id = $1
      ORDER BY b.scheduled_at DESC`,
    [studentId]
  );
  return rows;
}

async function nextUpcomingForStudent(studentId) {
  const { rows } = await query(
    `SELECT * FROM speaking_bookings
      WHERE student_id = $1 AND status = 'scheduled' AND scheduled_at >= NOW()
      ORDER BY scheduled_at LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
}

/** The student's current/upcoming session for the live /test/speaking page. */
async function activeForStudent(studentId) {
  const { rows } = await query(
    `SELECT
        b.*, ${EXAMINER_JSON} AS examiner
      FROM speaking_bookings b
      LEFT JOIN profiles ex ON ex.id = b.examiner_id
      WHERE b.student_id = $1
        AND b.status IN ('scheduled','assigned','time_proposed','requested')
      ORDER BY (b.status = 'scheduled') DESC, b.scheduled_at
      LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
}

async function listUpcoming(limit = 5) {
  const { rows } = await query(
    `SELECT b.id, b.scheduled_at, b.status,
            jsonb_build_object('full_name', sp.full_name) AS student,
            ${EXAMINER_JSON} AS examiner
       FROM speaking_bookings b
       LEFT JOIN profiles sp ON sp.id = b.student_id
       LEFT JOIN profiles ex ON ex.id = b.examiner_id
      WHERE b.status = 'scheduled' AND b.scheduled_at >= NOW()
      ORDER BY b.scheduled_at LIMIT $1`,
    [limit]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM speaking_bookings WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

/** Bookings assigned to an examiner (their queue). */
async function listForExaminer(examinerId) {
  const { rows } = await query(
    `SELECT b.*, jsonb_build_object('id', sp.id, 'full_name', sp.full_name, 'email', sp.email) AS student
       FROM speaking_bookings b
       LEFT JOIN profiles sp ON sp.id = b.student_id
      WHERE b.examiner_id = $1
      ORDER BY b.scheduled_at DESC NULLS LAST, b.created_at DESC`,
    [examinerId]
  );
  return rows;
}

// ─── Create + simple transitions ────────────────────────────
async function createRequest({ student_id, provider, scheduled_at, duration_minutes = 15 }) {
  const { rows } = await query(
    `INSERT INTO speaking_bookings
       (student_id, provider, scheduled_at, duration_minutes, status)
     VALUES ($1, $2, $3, $4, 'requested')
     RETURNING *`,
    [student_id, provider, scheduled_at, duration_minutes]
  );
  return rows[0];
}

/** Admin assigns (or reassigns) an examiner. requested|declined -> assigned. */
async function assignExaminer(id, examinerId, assignedBy) {
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET examiner_id = $2, assigned_by = $3, status = 'assigned', updated_at = NOW()
      WHERE id = $1 AND status IN ('requested','declined')
      RETURNING *`,
    [id, examinerId, assignedBy]
  );
  return rows[0] || null;
}

/** Examiner proposes a new time. assigned|declined -> time_proposed. */
async function proposeTime(id, examinerId, proposedAt) {
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET proposed_at = $3, proposed_by = $2, status = 'time_proposed', updated_at = NOW()
      WHERE id = $1 AND examiner_id = $2 AND status IN ('assigned','declined')
      RETURNING *`,
    [id, examinerId, proposedAt]
  );
  return rows[0] || null;
}

/** Student declines a proposed time. time_proposed -> declined. */
async function declineProposed(id, studentId) {
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET status = 'declined', updated_at = NOW()
      WHERE id = $1 AND student_id = $2 AND status = 'time_proposed'
      RETURNING *`,
    [id, studentId]
  );
  return rows[0] || null;
}

/** Cancel a booking (student or admin). Returns the row pre-cancel for cleanup. */
async function cancel(id, { studentId = null } = {}) {
  const params = [id];
  let ownership = '';
  if (studentId) { ownership = 'AND student_id = $2'; params.push(studentId); }
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 ${ownership}
        AND status IN ('requested','assigned','time_proposed','scheduled')
      RETURNING *`,
    params
  );
  return rows[0] || null;
}

// ─── Scheduling (transactional, creates the meeting) ────────
/**
 * Move a booking to `scheduled`, creating the real meeting and a linked speaking
 * test_attempt in one transaction. Locks the row (FOR UPDATE) so concurrent
 * accept/confirm calls serialize. Rejects examiner time overlaps. On any failure
 * after the meeting is created, best-effort deletes that meeting.
 *
 * @param {string} id
 * @param {('assigned'|'time_proposed')} expectedStatus
 * @param {{ recordingEnabled:boolean, useProposedTime:boolean, actorId:string }} opts
 */
async function schedule(id, expectedStatus, { recordingEnabled, useProposedTime }) {
  return withTransaction(async (client) => {
    const lock = await client.query(`SELECT * FROM speaking_bookings WHERE id = $1 FOR UPDATE`, [id]);
    const b = lock.rows[0];
    if (!b) throw httpError(404, 'Booking not found.');
    if (b.status !== expectedStatus) throw httpError(409, 'Booking is not in the expected state.');

    const scheduledAt = useProposedTime && b.proposed_at ? b.proposed_at : b.scheduled_at;

    // Prevent the examiner being double-booked at an overlapping time.
    if (b.examiner_id) {
      const clash = await client.query(
        `SELECT 1 FROM speaking_bookings
          WHERE examiner_id = $1 AND id <> $2 AND status = 'scheduled'
            AND tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval)
              && tstzrange($3::timestamptz, $3::timestamptz + (($4 || ' minutes')::interval))
          LIMIT 1`,
        [b.examiner_id, id, scheduledAt, b.duration_minutes || 15]
      );
      if (clash.rowCount > 0) throw httpError(409, 'Examiner already has a session at that time.');
    }

    // Create the real meeting (falls back to `none` when provider unconfigured).
    const meeting = await providers.createMeeting(b.provider || 'none', {
      topic: 'IELTS Speaking Session',
      startISO: new Date(scheduledAt).toISOString(),
      durationMin: b.duration_minutes || 15,
      recordingEnabled,
      requestId: `eielts-${id}`,
    });

    try {
      // Linked speaking attempt so the eventual result flows through the normal
      // results/history pipeline (mirrors the writing flow).
      const trackRes = await client.query(`SELECT track FROM profiles WHERE id = $1`, [b.student_id]);
      const track = trackRes.rows[0]?.track || 'academic';
      const att = await client.query(
        `INSERT INTO test_attempts (student_id, test_id, track, format, module, status)
         VALUES ($1, NULL, $2, 'single', 'speaking', 'in_progress')
         RETURNING id`,
        [b.student_id, track]
      );
      const attemptId = att.rows[0].id;

      const upd = await client.query(
        `UPDATE speaking_bookings
            SET status = 'scheduled', scheduled_at = $2, attempt_id = $3,
                provider = $4, provider_meeting_id = $5, join_url = $6, host_url = $7,
                recording_status = $8, updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [id, scheduledAt, attemptId, meeting.provider, meeting.provider_meeting_id,
         meeting.join_url, meeting.host_url, meeting.recording_status]
      );
      return upd.rows[0];
    } catch (err) {
      // Roll back the just-created external meeting so we don't orphan it.
      await providers.deleteMeeting(meeting.provider, meeting.provider_meeting_id).catch(() => {});
      throw err;
    }
  });
}

/**
 * Examiner submits speaking marks for a scheduled session. In one transaction:
 * assert the session is scheduled and owned by this examiner, create the result
 * (module 'speaking'), mark the linked attempt completed, and flip the booking
 * to completed with result_id set. Mirrors the writing review flow.
 *
 * @returns {Promise<{booking, result}>}
 */
async function submitMarks(id, examinerId, { band_score, criteria, feedback }) {
  return withTransaction(async (client) => {
    const lock = await client.query(`SELECT * FROM speaking_bookings WHERE id = $1 FOR UPDATE`, [id]);
    const b = lock.rows[0];
    if (!b) throw httpError(404, 'Booking not found.');
    if (b.examiner_id !== examinerId) throw httpError(403, 'Not your session.');
    if (b.status !== 'scheduled') throw httpError(409, 'Session is not awaiting marks.');

    let attemptId = b.attempt_id;
    if (!attemptId) {
      // Defensive: create a linked attempt if one is somehow missing.
      const trackRes = await client.query(`SELECT track FROM profiles WHERE id = $1`, [b.student_id]);
      const track = trackRes.rows[0]?.track || 'academic';
      const att = await client.query(
        `INSERT INTO test_attempts (student_id, test_id, track, format, module, status)
         VALUES ($1, NULL, $2, 'single', 'speaking', 'in_progress') RETURNING id`,
        [b.student_id, track]
      );
      attemptId = att.rows[0].id;
    }

    const resRow = await client.query(
      `INSERT INTO results
         (attempt_id, student_id, submission_id, module,
          band_score, task1_score, task2_score, feedback, criteria, reviewed_by, published_at)
       VALUES ($1, $2, NULL, 'speaking', $3, NULL, NULL, $4, $5::jsonb, $6, NOW())
       RETURNING *`,
      [attemptId, b.student_id, band_score, feedback || null, JSON.stringify(criteria || {}), examinerId]
    );
    const result = resRow.rows[0];

    await client.query(
      `UPDATE test_attempts SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [attemptId]
    );
    const updRow = await client.query(
      `UPDATE speaking_bookings
          SET status = 'completed', result_id = $2, attempt_id = $3, updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [id, result.id, attemptId]
    );

    return { booking: updRow.rows[0], result };
  });
}

/**
 * Examiner manually attaches a recording (uploaded file URL or pasted link).
 * Allowed only on the examiner's own scheduled/completed sessions.
 */
async function attachRecording(id, examinerId, { recording_url }) {
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET recording_url = $3, recording_status = 'available', updated_at = NOW()
      WHERE id = $1 AND examiner_id = $2 AND status IN ('scheduled','completed')
      RETURNING *`,
    [id, examinerId, recording_url]
  );
  return rows[0] || null;
}

/** Examiner manually attaches a transcript (pasted text and/or a link). */
async function attachTranscript(id, examinerId, { transcript_text = null, transcript_url = null }) {
  const { rows } = await query(
    `UPDATE speaking_bookings
        SET transcript_text = COALESCE($3, transcript_text),
            transcript_url  = COALESCE($4, transcript_url),
            updated_at = NOW()
      WHERE id = $1 AND examiner_id = $2 AND status IN ('scheduled','completed')
      RETURNING *`,
    [id, examinerId, transcript_text, transcript_url]
  );
  return rows[0] || null;
}

// Count bookings that need attention (not confirmed)
async function countActionableForStudent(studentId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM speaking_bookings 
     WHERE student_id = $1 AND status != 'confirmed'`,
    [studentId]
  );
  return rows[0].count;
}

// Count bookings that need admin action (requested or time_proposed)
async function countActionableForAdmin() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM speaking_bookings 
     WHERE status IN ('requested', 'time_proposed', 'assigned')`,
    []
  );
  return rows[0].count;
}

module.exports = {
  listForStudent,
  nextUpcomingForStudent,
  activeForStudent,
  listUpcoming,
  findById,
  listForExaminer,
  createRequest,
  assignExaminer,
  proposeTime,
  declineProposed,
  cancel,
  schedule,
  submitMarks,
  attachRecording,
  attachTranscript,
  countActionableForStudent,
  countActionableForAdmin,
};
