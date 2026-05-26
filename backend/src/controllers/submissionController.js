/**
 * Submissions controller — student-side create + admin queue list + admin review.
 */
const submissionModel = require('../models/submissionModel');
const attemptModel    = require('../models/attemptModel');
const resultModel     = require('../models/resultModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const { attempt_id, module, answers, word_count } = req.body;
  if (!attempt_id || !module) throw httpError(400, 'attempt_id and module are required.');

  const attempt = await attemptModel.findById(attempt_id);
  if (!attempt) throw httpError(404, 'Attempt not found.');
  if (attempt.student_id !== req.user.id) throw httpError(403, 'Forbidden.');

  const submission = await submissionModel.create({
    attempt_id,
    student_id: req.user.id,
    module,
    answers: answers || {},
    word_count: word_count || null,
  });

  await attemptModel.markSubmitted(attempt_id);

  return res.status(201).json({ success: true, data: submission, message: 'Submission received.' });
});

const listAll = asyncHandler(async (_req, res) => {
  const data = await submissionModel.listAllWithMeta();
  return res.json({ success: true, data });
});

/**
 * Admin / examiner posts a review.
 */
const review = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    band_score, task1_score, task2_score, feedback, criteria,
    student_id, attempt_id,
  } = req.body;

  if (band_score === undefined) throw httpError(400, 'band_score is required.');

  await submissionModel.markReviewed(id);

  const result = await resultModel.create({
    attempt_id,
    student_id,
    submission_id: id,
    module: 'writing',
    band_score,
    task1_score,
    task2_score,
    feedback,
    criteria: criteria || {},
    reviewed_by: req.user.id,
  });

  await attemptModel.markCompleted(attempt_id);

  return res.json({ success: true, data: result, message: 'Review submitted.' });
});

module.exports = { create, listAll, review };
