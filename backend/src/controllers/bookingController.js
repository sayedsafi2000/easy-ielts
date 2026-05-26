/**
 * Speaking bookings controller.
 */
const bookingModel = require('../models/bookingModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

function randomMeetingLink() {
  const slug = Math.random().toString(36).slice(2, 8);
  return `https://meet.google.com/demo-${slug}`;
}

const listMine = asyncHandler(async (req, res) => {
  const data = await bookingModel.listForStudent(req.user.id);
  return res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { scheduled_at, examiner_id, attempt_id } = req.body;
  if (!scheduled_at) throw httpError(400, 'scheduled_at is required.');

  const booking = await bookingModel.create({
    student_id: req.user.id,
    examiner_id: examiner_id || null,
    attempt_id: attempt_id || null,
    scheduled_at,
    meeting_link: randomMeetingLink(),
  });
  return res.status(201).json({ success: true, data: booking, message: 'Booking confirmed.' });
});

module.exports = { listMine, create };
