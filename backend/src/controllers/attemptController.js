/**
 * Test attempts controller.
 */
const attemptModel = require('../models/attemptModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const { test_id, track, format, module } = req.body;
  const a = await attemptModel.create({
    student_id: req.user.id,
    test_id: test_id || null,
    track: track || 'academic',
    format: format || 'full',
    module: module || null,
  });
  return res.status(201).json({ success: true, data: a, message: 'Attempt created.' });
});

const listMine = asyncHandler(async (req, res) => {
  const data = await attemptModel.listForStudent(req.user.id, { limit: 100 });
  return res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const a = await attemptModel.findById(req.params.id);
  if (!a) throw httpError(404, 'Attempt not found.');
  if (a.student_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'examiner') {
    throw httpError(403, 'Forbidden.');
  }
  return res.json({ success: true, data: a });
});

module.exports = { create, listMine, getById };
