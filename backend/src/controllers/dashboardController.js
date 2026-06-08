/**
 * Student dashboard aggregator.
 *
 * Returns: profile, recent attempts (with nested test + results),
 * the next confirmed speaking booking, submission counts, and booking counts.
 */
const userModel = require('../models/userModel');
const attemptModel = require('../models/attemptModel');
const bookingModel = require('../models/bookingModel');
const submissionModel = require('../models/submissionModel');
const { asyncHandler } = require('../middleware/errorHandler');

const get = asyncHandler(async (req, res) => {
  const [profile, attempts, upcomingSpeaking, allBookings, submissions] = await Promise.all([
    userModel.findById(req.user.id),
    attemptModel.listForStudent(req.user.id, { limit: 10 }),
    bookingModel.nextUpcomingForStudent(req.user.id),
    bookingModel.listForStudent(req.user.id).catch(() => []),
    submissionModel ? submissionModel.listForStudent(req.user.id).catch(() => []) : Promise.resolve([]),
  ]);

  // Calculate counts
  const totalBookings = Array.isArray(allBookings) ? allBookings.length : 0;
  const pendingSubmissions = Array.isArray(submissions) 
    ? submissions.filter(s => s.status === 'pending' || s.status === 'submitted').length 
    : 0;

  return res.json({
    success: true,
    data: { 
      profile, 
      attempts, 
      upcomingSpeaking,
      totalBookings,
      pendingSubmissions,
    },
  });
});

module.exports = { get };
