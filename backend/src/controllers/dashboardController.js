/**
 * Student dashboard aggregator.
 *
 * Returns: profile, recent attempts (with nested test + results),
 * and the next confirmed speaking booking.
 */
const userModel = require('../models/userModel');
const attemptModel = require('../models/attemptModel');
const bookingModel = require('../models/bookingModel');
const { asyncHandler } = require('../middleware/errorHandler');

const get = asyncHandler(async (req, res) => {
  const [profile, attempts, upcomingSpeaking] = await Promise.all([
    userModel.findById(req.user.id),
    attemptModel.listForStudent(req.user.id, { limit: 10 }),
    bookingModel.nextUpcomingForStudent(req.user.id),
  ]);

  return res.json({
    success: true,
    data: { profile, attempts, upcomingSpeaking },
  });
});

module.exports = { get };
