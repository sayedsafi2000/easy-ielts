/**
 * Results controller (student view of their results).
 */
const resultModel = require('../models/resultModel');
const { asyncHandler } = require('../middleware/errorHandler');

const listMine = asyncHandler(async (req, res) => {
  const data = await resultModel.listForStudent(req.user.id);
  return res.json({ success: true, data });
});

module.exports = { listMine };
