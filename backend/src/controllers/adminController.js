/**
 * Admin-only stats + students list.
 */
const userModel        = require('../models/userModel');
const testModel        = require('../models/testModel');
const submissionModel  = require('../models/submissionModel');
const bookingModel     = require('../models/bookingModel');
const resultModel      = require('../models/resultModel');
const adminModel       = require('../models/adminModel');
const providers        = require('../lib/meetingProviders');
const mailer           = require('../lib/mailer');
const notify           = require('../services/notify');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const stats = asyncHandler(async (_req, res) => {
  const [totalStudents, testsThisMonth, pendingReviews, upcomingSpeaking, avg] = await Promise.all([
    userModel.countByRole('student'),
    testModel.countAttemptsThisMonth(),
    submissionModel.countPending(),
    bookingModel.listUpcoming(5),
    resultModel.averageBand(),
  ]);

  return res.json({
    success: true,
    data: {
      totalStudents,
      testsThisMonth,
      pendingReviews,
      upcomingSpeaking,
      avgBand: avg ? Number(avg).toFixed(1) : '—',
    },
  });
});

const listStudents = asyncHandler(async (_req, res) => {
  const data = await adminModel.listStudents({ limit: 200 });
  return res.json({ success: true, data });
});

const getStudent = asyncHandler(async (req, res) => {
  const data = await adminModel.getStudentDetail(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: 'Student not found.' });
  return res.json({ success: true, data });
});

const setStudentStatus = asyncHandler(async (req, res) => {
  const { suspended } = req.body;
  await adminModel.setStudentStatus(req.params.id, !!suspended);
  return res.json({ success: true, message: suspended ? 'Account suspended.' : 'Account activated.' });
});

const listBookings = asyncHandler(async (_req, res) => {
  const data = await adminModel.listAllBookings();
  return res.json({ success: true, data });
});

const updateBooking = asyncHandler(async (req, res) => {
  const b = await adminModel.updateBookingStatus(req.params.id, req.body);
  return res.json({ success: true, data: b });
});

/** Admin assigns (or reassigns) an examiner to a requested booking. */
const assignBooking = asyncHandler(async (req, res) => {
  const { examiner_id } = req.body;
  if (!examiner_id) throw httpError(400, 'examiner_id is required.');

  const examiner = await userModel.findById(examiner_id);
  if (!examiner || examiner.role !== 'examiner') throw httpError(400, 'That user is not an examiner.');

  const booking = await bookingModel.assignExaminer(req.params.id, examiner_id, req.user.id);
  if (!booking) throw httpError(409, 'Booking cannot be assigned in its current state.');

  await notify.notifyUser(examiner_id, {
    type: 'booking.assigned',
    title: 'You have a new speaking session to review',
    body: 'An admin assigned you a speaking session. Accept the time or propose a new one.',
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'Examiner assigned.' });
});

/** Which integrations are wired (no secrets) — for the admin Settings page. */
const integrationsStatus = asyncHandler(async (_req, res) => {
  const meeting = await providers.statuses();
  return res.json({
    success: true,
    data: { meeting, email: mailer.isConfigured() },
  });
});

const listResults = asyncHandler(async (_req, res) => {
  const data = await adminModel.listAllResults();
  return res.json({ success: true, data });
});

const listExaminers = asyncHandler(async (_req, res) => {
  const data = await adminModel.listAllExaminers();
  return res.json({ success: true, data });
});

const createExaminer = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, speciality } = req.body;
  if (!email) throw httpError(400, 'Email is required.');

  const full_name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || email.split('@')[0];

  let specialization = ['Writing', 'Speaking'];
  if (typeof speciality === 'string') {
    if (speciality.toLowerCase().includes('writing only')) specialization = ['Writing'];
    else if (speciality.toLowerCase().includes('speaking only')) specialization = ['Speaking'];
  }

  const bcrypt     = require('bcryptjs');
  const q          = require('../config/db').query;
  const httpErr    = require('../middleware/errorHandler').httpError;

  const existing = await userModel.findByEmail(email);
  if (existing) throw httpErr(409, 'An account with that email already exists.');

  const tempPassword  = Math.random().toString(36).slice(2, 10) + 'A1!';
  const password_hash = await bcrypt.hash(tempPassword, 10);

  const user = await q(
    `INSERT INTO profiles (email, password_hash, full_name, role, plan, email_verified)
     VALUES ($1,$2,$3,'examiner','premium',TRUE) RETURNING id`,
    [email, password_hash, full_name]
  );
  const profileId = user.rows[0].id;

  await q(
    `INSERT INTO examiners (profile_id, specialization, rating)
     VALUES ($1, $2, 4.8) ON CONFLICT (profile_id) DO NOTHING`,
    [profileId, specialization]
  );

  return res.status(201).json({
    success: true,
    message: `Examiner created. Temp password: ${tempPassword}`,
    data: { id: profileId, email, full_name, role: 'examiner', tempPassword },
  });
});

const getSubmission = asyncHandler(async (req, res) => {
  const data = await adminModel.getSubmissionById(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: 'Submission not found.' });
  return res.json({ success: true, data });
});

const listTestsAdmin = asyncHandler(async (_req, res) => {
  const data = await adminModel.listAllTestsAdmin();
  return res.json({ success: true, data });
});

const getSettings = asyncHandler(async (_req, res) => {
  const { query: q } = require('../config/db');
  const { rows } = await q('SELECT key, value FROM platform_settings ORDER BY key');
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return res.json({ success: true, data: settings });
});

const saveSettings = asyncHandler(async (req, res) => {
  const { query: q } = require('../config/db');
  const entries = Object.entries(req.body ?? {});
  for (const [key, value] of entries) {
    await q(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, String(value)]
    );
  }
  return res.json({ success: true, message: 'Settings saved.' });
});

module.exports = {
  stats, listStudents, getStudent, setStudentStatus,
  listBookings, updateBooking, assignBooking, integrationsStatus,
  listResults, listExaminers, createExaminer,
  getSubmission, listTestsAdmin,
  getSettings, saveSettings,
};
