/**
 * Tests controller — public list + admin CRUD.
 */
const testModel = require('../models/testModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const listPublished = asyncHandler(async (_req, res) => {
  const data = await testModel.listPublished();
  return res.json({ success: true, data });
});

const listAll = asyncHandler(async (_req, res) => {
  const data = await testModel.listAll();
  return res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const t = await testModel.findById(req.params.id);
  if (!t) throw httpError(404, 'Test not found.');
  return res.json({ success: true, data: t });
});

const create = asyncHandler(async (req, res) => {
  const { title, type, modules, difficulty, duration_minutes, status, notes } = req.body;
  if (!title) throw httpError(400, 'Title is required.');

  const t = await testModel.create({
    title,
    type: type || 'academic',
    modules: Array.isArray(modules) && modules.length ? modules : ['listening','reading','writing','speaking'],
    difficulty: difficulty || 'medium',
    duration_minutes: duration_minutes || 165,
    status: status || 'draft',
    notes: notes || null,
    created_by: req.user.id,
  });
  return res.status(201).json({ success: true, data: t, message: 'Test created.' });
});

const update = asyncHandler(async (req, res) => {
  const t = await testModel.update(req.params.id, req.body);
  if (!t) throw httpError(404, 'Test not found.');
  return res.json({ success: true, data: t, message: 'Test updated.' });
});

const remove = asyncHandler(async (req, res) => {
  await testModel.remove(req.params.id);
  return res.json({ success: true, message: 'Test deleted.' });
});

module.exports = { listPublished, listAll, getById, create, update, remove };
