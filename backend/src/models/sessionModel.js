/**
 * Test sessions — server-side timer + per-question answer storage.
 *
 * One session row exists per (attempt_id, module). The session decides when
 * the test must auto-submit (`expires_at`), independent of the client clock.
 */
const { query } = require('../config/db');

const MODULE_DURATIONS = {
  listening: 30 * 60,   // 30 minutes
  reading:   60 * 60,   // 60 minutes
  writing:   60 * 60,   // 60 minutes
  speaking:  15 * 60,   // 15 minutes (used as session length only)
};

/**
 * Get an existing session for (attempt, module) or create one.
 * Uses ON CONFLICT DO NOTHING to handle React StrictMode double-invocation
 * and any other race conditions gracefully.
 */
async function startOrResume(attemptId, module) {
  const dur = MODULE_DURATIONS[module] ?? 30 * 60;
  const { rows } = await query(
    `INSERT INTO test_sessions (attempt_id, module, duration_seconds, started_at, expires_at)
     VALUES ($1, $2, $3, NOW(), NOW() + ($3::int || ' seconds')::interval)
     ON CONFLICT (attempt_id, module) DO UPDATE
       SET attempt_id = EXCLUDED.attempt_id  -- no-op update, just to get RETURNING
     RETURNING *`,
    [attemptId, module, dur]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM test_sessions WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByAttemptModule(attemptId, module) {
  const { rows } = await query(
    `SELECT * FROM test_sessions WHERE attempt_id = $1 AND module = $2`,
    [attemptId, module]
  );
  return rows[0] || null;
}

async function markSubmitted(id) {
  await query(`UPDATE test_sessions SET submitted_at = NOW() WHERE id = $1`, [id]);
}

/**
 * Bulk upsert per-question answers for a (attempt, module).
 * `answers` is a map {1: "B", 2: "London", ...}
 * `flagged` is a map {3: true, 5: true}
 */
async function upsertAnswers(attemptId, module, answers, flagged = {}) {
  const numbers = new Set([
    ...Object.keys(answers || {}),
    ...Object.keys(flagged || {}),
  ].map((n) => parseInt(n, 10)).filter(Number.isFinite));

  for (const n of numbers) {
    const v = answers && answers[n] !== undefined ? String(answers[n]) : null;
    const f = !!(flagged && flagged[n]);
    await query(
      `INSERT INTO attempt_answers (attempt_id, module, question_number, answer_value, flagged, saved_at)
       VALUES ($1,$2,$3,$4,$5, NOW())
       ON CONFLICT (attempt_id, module, question_number)
         DO UPDATE SET answer_value = EXCLUDED.answer_value,
                       flagged      = EXCLUDED.flagged,
                       saved_at     = NOW()`,
      [attemptId, module, n, v, f]
    );
  }
  await query(
    `UPDATE test_sessions SET last_saved_at = NOW()
      WHERE attempt_id = $1 AND module = $2`,
    [attemptId, module]
  );
}

async function listAnswers(attemptId, module) {
  const { rows } = await query(
    `SELECT question_number, answer_value, is_correct, flagged
       FROM attempt_answers
      WHERE attempt_id = $1 AND module = $2
      ORDER BY question_number`,
    [attemptId, module]
  );
  return rows;
}

async function markCorrectness(attemptId, module, perQuestion) {
  // perQuestion = [{n: 1, correct: true}, ...]
  for (const p of perQuestion) {
    await query(
      `UPDATE attempt_answers
          SET is_correct = $1
        WHERE attempt_id = $2 AND module = $3 AND question_number = $4`,
      [p.correct, attemptId, module, p.n]
    );
  }
}

module.exports = {
  MODULE_DURATIONS,
  startOrResume,
  findById,
  findByAttemptModule,
  markSubmitted,
  upsertAnswers,
  listAnswers,
  markCorrectness,
};
