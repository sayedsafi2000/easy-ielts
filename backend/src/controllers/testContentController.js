/**
 * Public read-only test content fetchers — Listening / Reading / Writing /
 * Speaking. The shape returned matches the data structures the existing
 * frontend pages already render, so no UI changes are needed.
 */
const content       = require('../models/contentModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const listening = asyncHandler(async (req, res) => {
  const data = await content.getListeningTest(req.params.id);
  if (!data.length) throw httpError(404, 'No listening content for this test.');
  return res.json({ success: true, data });
});

const reading = asyncHandler(async (req, res) => {
  const data = await content.getReadingTest(req.params.id);
  if (!data.length) throw httpError(404, 'No reading content for this test.');
  return res.json({ success: true, data });
});

const writing = asyncHandler(async (req, res) => {
  const data = await content.getWritingTest(req.params.id);
  if (!data.length) throw httpError(404, 'No writing content for this test.');
  return res.json({ success: true, data });
});

const speaking = asyncHandler(async (req, res) => {
  const data = await content.getSpeakingTest(req.params.id);
  if (!data.length) throw httpError(404, 'No speaking content for this test.');
  return res.json({ success: true, data });
});

module.exports = { listening, reading, writing, speaking };
