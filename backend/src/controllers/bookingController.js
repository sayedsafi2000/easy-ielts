/**
 * Speaking bookings — student-facing endpoints.
 *
 *   GET  /api/bookings                 list own sessions
 *   POST /api/bookings                 create a request (date+time+provider)
 *   POST /api/bookings/:id/confirm-time confirm an examiner-proposed time
 *   POST /api/bookings/:id/decline-time decline an examiner-proposed time
 *   POST /api/bookings/:id/cancel       cancel own booking
 */
const bookingModel = require('../models/bookingModel');
const providers = require('../lib/meetingProviders');
const notify = require('../services/notify');
const { getBool } = require('../lib/settings');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const VALID_PROVIDERS = new Set(['google', 'zoom']);

function fmt(dt) {
  return new Date(dt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const listMine = asyncHandler(async (req, res) => {
  const data = await bookingModel.listForStudent(req.user.id);
  return res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { scheduled_at, provider, duration_minutes } = req.body;
  if (!scheduled_at) throw httpError(400, 'scheduled_at is required.');
  if (!provider || !VALID_PROVIDERS.has(provider)) {
    throw httpError(400, 'A valid provider (google or zoom) is required.');
  }
  const when = new Date(scheduled_at);
  if (Number.isNaN(when.getTime())) throw httpError(400, 'scheduled_at is not a valid date.');
  if (when.getTime() <= Date.now()) throw httpError(400, 'Please pick a time in the future.');

  const booking = await bookingModel.createRequest({
    student_id: req.user.id,
    provider,
    scheduled_at: when.toISOString(),
    duration_minutes: duration_minutes || 15,
  });

  // Notify all admins to assign an examiner.
  await notify.notifyAdmins({
    type: 'booking.requested',
    title: 'New speaking session request',
    body: `${req.user.email} requested a ${provider === 'zoom' ? 'Zoom' : 'Google Meet'} session for ${fmt(when)}. Assign an examiner.`,
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });

  return res.status(201).json({ success: true, data: booking, message: 'Request sent.' });
});

const confirmTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await bookingModel.findById(id);
  if (!existing) throw httpError(404, 'Booking not found.');
  if (existing.student_id !== req.user.id) throw httpError(403, 'Forbidden.');
  if (existing.status !== 'time_proposed') throw httpError(409, 'No proposed time to confirm.');

  const recordingEnabled = await getBool('meeting_recording_enabled', true);
  const booking = await bookingModel.schedule(id, 'time_proposed', {
    recordingEnabled, useProposedTime: true,
  });

  await notify.notifyUser(booking.examiner_id, {
    type: 'booking.scheduled',
    title: 'Speaking session confirmed',
    body: `The student confirmed your proposed time. Scheduled for ${fmt(booking.scheduled_at)}.`,
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });
  await notify.notifyAdmins({
    type: 'booking.scheduled',
    title: 'Speaking session scheduled',
    body: `A session was scheduled for ${fmt(booking.scheduled_at)}.`,
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'Time confirmed — session scheduled.' });
});

const declineTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingModel.declineProposed(id, req.user.id);
  if (!booking) throw httpError(409, 'No proposed time to decline.');

  if (booking.examiner_id) {
    await notify.notifyUser(booking.examiner_id, {
      type: 'booking.declined',
      title: 'Proposed time declined',
      body: 'The student declined your proposed time. An admin can reassign or a new time can be proposed.',
      link: '/admin/bookings',
      data: { booking_id: booking.id },
    });
  }
  await notify.notifyAdmins({
    type: 'booking.declined',
    title: 'Speaking time declined',
    body: 'A student declined a proposed speaking time. Reassign if needed.',
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'Proposed time declined.' });
});

const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingModel.cancel(id, { studentId: req.user.id });
  if (!booking) throw httpError(409, 'Booking cannot be cancelled.');

  // Best-effort tear down any created meeting.
  if (booking.provider_meeting_id) {
    await providers.deleteMeeting(booking.provider, booking.provider_meeting_id).catch(() => {});
  }
  if (booking.examiner_id) {
    await notify.notifyUser(booking.examiner_id, {
      type: 'booking.cancelled',
      title: 'Speaking session cancelled',
      body: 'A student cancelled their speaking session.',
      link: '/admin/bookings',
      data: { booking_id: booking.id },
    });
  }

  return res.json({ success: true, data: booking, message: 'Booking cancelled.' });
});

module.exports = { listMine, create, confirmTime, declineTime, cancel };
