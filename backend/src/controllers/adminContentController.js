/**
 * Admin content management — bulk-replace content for a test module.
 *
 * Accepts the same shape that the admin "Edit Test" UI already uses (plus a
 * couple of normalisation helpers), and writes everything via the model's
 * replaceXxxContent() functions.
 */
const content = require('../models/contentModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const saveListening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sections } = req.body;
  if (!Array.isArray(sections)) throw httpError(400, '`sections` array is required.');
  await content.replaceListeningContent(id, sections);
  return res.json({ success: true, message: 'Listening content saved.' });
});

const saveReading = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { passages } = req.body;
  if (!Array.isArray(passages)) throw httpError(400, '`passages` array is required.');
  await content.replaceReadingContent(id, passages);
  return res.json({ success: true, message: 'Reading content saved.' });
});

const saveWriting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) throw httpError(400, '`tasks` array is required.');
  await content.replaceWritingContent(id, tasks);
  return res.json({ success: true, message: 'Writing content saved.' });
});

const saveSpeaking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { parts } = req.body;
  if (!Array.isArray(parts)) throw httpError(400, '`parts` array is required.');
  await content.replaceSpeakingContent(id, parts);
  return res.json({ success: true, message: 'Speaking content saved.' });
});

/**
 * GET /api/admin/tests/:id/content
 * Returns all four modules' content in one payload for the edit UI.
 */
const getFullContent = asyncHandler(async (req, res) => {
  const [listening, reading, writing, speaking] = await Promise.all([
    content.getListeningTest(req.params.id),
    content.getReadingTest(req.params.id),
    content.getWritingTest(req.params.id),
    content.getSpeakingTest(req.params.id),
  ]);
  return res.json({ success: true, data: { listening, reading, writing, speaking } });
});

module.exports = { saveListening, saveReading, saveWriting, saveSpeaking, getFullContent };
