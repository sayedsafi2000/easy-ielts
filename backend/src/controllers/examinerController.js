/**
 * Examiner-facing speaking session endpoints (mounted at /api/examiner).
 *
 *   GET  /api/examiner/bookings                 my assigned sessions
 *   POST /api/examiner/bookings/:id/accept      accept the requested time -> scheduled
 *   POST /api/examiner/bookings/:id/propose-time propose a new time
 *   POST /api/examiner/bookings/:id/marks       submit speaking marks -> result
 *
 * Ownership is asserted on every mutation (examiner_id must equal req.user.id).
 */
const multer = require('multer');
const bookingModel = require('../models/bookingModel');
const cloud = require('../lib/cloudinary');
const notify = require('../services/notify');
const { getBool } = require('../lib/settings');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

// Recording uploads: audio or video, up to 100 MB, kept in memory for streaming.
const REC_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
]);
const recUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (REC_TYPES.has(file.mimetype)) return cb(null, true);
    return cb(httpError(415, `Unsupported recording type: ${file.mimetype}`));
  },
}).single('file');

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    recUpload(req, res, (err) => (err ? reject(err) : resolve(null)));
  });
}

const CRITERIA_KEYS = ['fluency_coherence', 'lexical_resource', 'grammatical_range', 'pronunciation'];

function fmt(dt) {
  return new Date(dt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const listMine = asyncHandler(async (req, res) => {
  const data = await bookingModel.listForExaminer(req.user.id);
  return res.json({ success: true, data });
});

const accept = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await bookingModel.findById(id);
  if (!existing) throw httpError(404, 'Booking not found.');
  if (existing.examiner_id !== req.user.id) throw httpError(403, 'Not your session.');
  if (existing.status !== 'assigned') throw httpError(409, 'Session is not awaiting your acceptance.');

  const recordingEnabled = await getBool('meeting_recording_enabled', true);
  const booking = await bookingModel.schedule(id, 'assigned', {
    recordingEnabled, useProposedTime: false,
  });

  await notify.notifyUser(booking.student_id, {
    type: 'booking.scheduled',
    title: 'Speaking session confirmed',
    body: `Your speaking session is scheduled for ${fmt(booking.scheduled_at)}.${booking.join_url ? ' A join link is ready.' : ''}`,
    link: '/dashboard/book-speaking',
    data: { booking_id: booking.id },
  });
  await notify.notifyAdmins({
    type: 'booking.scheduled',
    title: 'Speaking session scheduled',
    body: `An examiner accepted a session for ${fmt(booking.scheduled_at)}.`,
    link: '/admin/bookings',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'Session scheduled.' });
});

const proposeTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { proposed_at } = req.body;
  if (!proposed_at) throw httpError(400, 'proposed_at is required.');
  const when = new Date(proposed_at);
  if (Number.isNaN(when.getTime())) throw httpError(400, 'proposed_at is not a valid date.');
  if (when.getTime() <= Date.now()) throw httpError(400, 'Propose a time in the future.');

  const booking = await bookingModel.proposeTime(id, req.user.id, when.toISOString());
  if (!booking) throw httpError(409, 'Cannot propose a time for this session.');

  await notify.notifyUser(booking.student_id, {
    type: 'booking.time_proposed',
    title: 'New time proposed for your speaking session',
    body: `Your examiner proposed ${fmt(when)}. Confirm or decline.`,
    link: '/dashboard/book-speaking',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'New time proposed.' });
});

const submitMarks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { criteria, feedback } = req.body;
  if (!criteria || typeof criteria !== 'object') throw httpError(400, 'criteria is required.');

  const values = CRITERIA_KEYS.map((k) => Number(criteria[k]));
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 9)) {
    throw httpError(400, 'Each criterion must be a band score between 0 and 9.');
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const band_score = Math.round(avg * 2) / 2;

  const cleanCriteria = {};
  CRITERIA_KEYS.forEach((k, i) => { cleanCriteria[k] = values[i]; });

  const { booking, result } = await bookingModel.submitMarks(id, req.user.id, {
    band_score, criteria: cleanCriteria, feedback,
  });

  await notify.notifyUser(booking.student_id, {
    type: 'result.published',
    title: 'Your speaking result is ready',
    body: `You scored band ${band_score} on your speaking session.`,
    link: '/results',
    data: { booking_id: booking.id, result_id: result.id },
  });

  return res.json({ success: true, data: { booking, result }, message: 'Marks submitted.' });
});

/**
 * Examiner attaches a recording — either an uploaded file (multipart "file",
 * sent to Cloudinary) or a pasted `recording_url`. Falls back to URL when
 * Cloudinary isn't configured.
 */
async function uploadRecordingHandler(req, res) {
  await runMulter(req, res).catch((err) => { throw httpError(err.status || 400, err.message || 'Upload error'); });

  const { id } = req.params;
  let url = (req.body && req.body.recording_url) || null;

  if (req.file) {
    if (!cloud.isConfigured()) {
      throw httpError(400, 'File upload is not configured on this server. Paste a recording URL instead.');
    }
    const stamp = Date.now().toString(36);
    const result = await cloud.uploadBuffer(req.file.buffer, {
      folder: 'ielts/recordings',
      public_id: `speaking-${id}-${stamp}`,
      resource_type: 'video', // Cloudinary uses 'video' for audio + video
      overwrite: false,
    });
    url = result.secure_url;
  }

  if (!url) throw httpError(400, 'Provide a recording file or a recording URL.');

  const booking = await bookingModel.attachRecording(id, req.user.id, { recording_url: url });
  if (!booking) throw httpError(409, 'Cannot attach a recording to this session.');

  await notify.notifyUser(booking.student_id, {
    type: 'recording.available',
    title: 'Your speaking session recording is ready',
    body: 'Your examiner uploaded the recording of your speaking session.',
    link: '/results',
    data: { booking_id: booking.id },
  });

  return res.json({ success: true, data: booking, message: 'Recording attached.' });
}
const uploadRecording = (req, res, next) => uploadRecordingHandler(req, res).catch(next);

/** Examiner attaches a transcript — pasted text and/or a link. */
const setTranscript = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transcript_text = req.body?.transcript_text?.trim() || null;
  const transcript_url = req.body?.transcript_url?.trim() || null;
  if (!transcript_text && !transcript_url) throw httpError(400, 'Provide transcript text or a transcript URL.');

  const booking = await bookingModel.attachTranscript(id, req.user.id, { transcript_text, transcript_url });
  if (!booking) throw httpError(409, 'Cannot attach a transcript to this session.');

  return res.json({ success: true, data: booking, message: 'Transcript saved.' });
});

module.exports = { listMine, accept, proposeTime, submitMarks, uploadRecording, setTranscript };
