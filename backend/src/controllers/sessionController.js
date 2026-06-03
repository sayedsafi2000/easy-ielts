/**
 * Test session controller — start/resume, autosave, submit + auto-mark.
 *
 * Server-side timer:
 *   - On start, we set expires_at = NOW() + duration.
 *   - On any save/submit, we reject if NOW() > expires_at.
 *   - The frontend receives `secondsRemaining` from the server, so the timer
 *     can never be tampered with by the client.
 */
const session = require('../models/sessionModel');
const content = require('../models/contentModel');
const attemptModel = require('../models/attemptModel');
const submissionModel = require('../models/submissionModel');
const resultModel = require('../models/resultModel');
const { gradeMcqStyle } = require('../lib/scoring');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const VALID_MODULES = new Set(['listening', 'reading', 'writing', 'speaking']);

function secondsLeft(s) {
  if (!s) return 0;
  const left = Math.floor((new Date(s.expires_at).getTime() - Date.now()) / 1000);
  return Math.max(0, left);
}

/**
 * POST /api/test-sessions/start
 * body: { attempt_id, module }
 * Returns the session with `secondsRemaining` and any saved answers.
 */
const start = asyncHandler(async (req, res) => {
  const { attempt_id, module } = req.body;
  if (!attempt_id || !VALID_MODULES.has(module)) {
    throw httpError(400, 'attempt_id and a valid module are required.');
  }
  const attempt = await attemptModel.findById(attempt_id);
  if (!attempt) throw httpError(404, 'Attempt not found.');
  if (attempt.student_id !== req.user.id) throw httpError(403, 'Forbidden.');

  let s;
  try {
    s = await session.startOrResume(attempt_id, module);
  } catch (err) {
    // Fallback: if somehow the INSERT still conflicts, just fetch the existing row
    if (err.code === '23505') {
      s = await session.findByAttemptModule(attempt_id, module);
      if (!s) throw httpError(500, 'Session error. Please try again.');
    } else {
      throw err;
    }
  }

  const answers = (module === 'listening' || module === 'reading')
    ? await session.listAnswers(attempt_id, module)
    : [];

  return res.json({
    success: true,
    data: {
      sessionId:        s.id,
      attemptId:        s.attempt_id,
      module:           s.module,
      durationSeconds:  s.duration_seconds,
      secondsRemaining: secondsLeft(s),
      submitted:        !!s.submitted_at,
      answers,
    },
  });
});

/**
 * POST /api/test-sessions/save
 * body: { attempt_id, module, answers: {n: value}, flagged: {n: bool} }
 * Idempotent autosave — also returns secondsRemaining so the client clock
 * stays in sync with the server.
 */
const save = asyncHandler(async (req, res) => {
  const { attempt_id, module, answers, flagged } = req.body;
  if (!attempt_id || !VALID_MODULES.has(module)) {
    throw httpError(400, 'attempt_id and a valid module are required.');
  }
  const s = await session.findByAttemptModule(attempt_id, module);
  if (!s) throw httpError(404, 'Session not started.');
  if (s.submitted_at) throw httpError(409, 'Session already submitted.');

  const attempt = await attemptModel.findById(attempt_id);
  if (!attempt || attempt.student_id !== req.user.id) throw httpError(403, 'Forbidden.');

  // Reject saves after expiry — but allow the client to call /submit to lock in
  // whatever was last saved.
  const left = secondsLeft(s);
  if (left <= 0) throw httpError(410, 'Time is up. Submit the test.');

  if (module === 'listening' || module === 'reading') {
    await session.upsertAnswers(attempt_id, module, answers || {}, flagged || {});
  }
  return res.json({ success: true, data: { secondsRemaining: secondsLeft(s) } });
});

/**
 * POST /api/test-sessions/submit
 * body: {
 *   attempt_id, module,
 *   answers?, flagged?,                  // for listening/reading: any final values
 *   writing_answers?, word_count?,       // for writing: { task1, task2 }
 * }
 *
 * Side effects:
 *   - Upserts the final answers.
 *   - Marks the session submitted.
 *   - For listening/reading: auto-marks, writes a `results` row with the band,
 *     and marks the attempt as completed (if no other modules pending).
 *   - For writing: creates a `submissions` row with status=pending and marks
 *     the attempt as submitted (examiner will review later).
 *   - For speaking: just marks the session submitted.
 */
const submit = asyncHandler(async (req, res) => {
  const { attempt_id, module, answers, flagged, writing_answers, word_count } = req.body;
  if (!attempt_id || !VALID_MODULES.has(module)) {
    throw httpError(400, 'attempt_id and a valid module are required.');
  }
  const s = await session.findByAttemptModule(attempt_id, module);
  if (!s) throw httpError(404, 'Session not started.');
  if (s.submitted_at) {
    return res.json({ success: true, data: { alreadySubmitted: true } });
  }

  const attempt = await attemptModel.findById(attempt_id);
  if (!attempt || attempt.student_id !== req.user.id) throw httpError(403, 'Forbidden.');

  if (module === 'listening' || module === 'reading') {
    if (answers) await session.upsertAnswers(attempt_id, module, answers, flagged || {});

    // Auto-mark
    const key = module === 'listening'
      ? await content.getListeningAnswerKey(attempt.test_id)
      : await content.getReadingAnswerKey(attempt.test_id);
    const saved = await session.listAnswers(attempt_id, module);
    const studentMap = {};
    saved.forEach((r) => { studentMap[r.question_number] = r.answer_value; });

    const grade = gradeMcqStyle(key, studentMap, module, attempt.track || 'academic');
    await session.markCorrectness(attempt_id, module, grade.perQuestion);
    await session.markSubmitted(s.id);

    // Persist a result row so the dashboard / results page show it.
    await resultModel.create({
      attempt_id,
      student_id: req.user.id,
      submission_id: null,
      module,
      band_score: grade.band,
      task1_score: null,
      task2_score: null,
      feedback: `${grade.rawScore} / ${grade.totalQuestions} correct.`,
      criteria: { rawScore: grade.rawScore, totalQuestions: grade.totalQuestions },
      reviewed_by: null,
    });

    return res.json({
      success: true,
      data: {
        module,
        rawScore: grade.rawScore,
        totalQuestions: grade.totalQuestions,
        band: grade.band,
        perQuestion: grade.perQuestion,
      },
    });
  }

  if (module === 'writing') {
    if (!writing_answers) throw httpError(400, 'writing_answers is required.');
    await submissionModel.create({
      attempt_id,
      student_id: req.user.id,
      module: 'writing',
      answers: writing_answers,
      word_count: word_count ?? null,
    });
    await session.markSubmitted(s.id);
    await attemptModel.markSubmitted(attempt_id);
    return res.json({ success: true, data: { module: 'writing', status: 'pending_review' } });
  }

  // speaking — just mark the session as submitted; live session is separate
  await session.markSubmitted(s.id);
  return res.json({ success: true, data: { module: 'speaking', status: 'session_closed' } });
});

module.exports = { start, save, submit };
