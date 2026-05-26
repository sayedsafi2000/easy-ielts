const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const adminCtrl      = require('../controllers/adminController');
const submissionCtrl = require('../controllers/submissionController');
const adminContent   = require('../controllers/adminContentController');

const AE = [requireAuth, requireRole('admin', 'examiner')];
const AO = [requireAuth, requireRole('admin')];

// Dashboard stats
router.get('/stats',                ...AE, adminCtrl.stats);

// Students
router.get('/students',             ...AO, adminCtrl.listStudents);
router.get('/students/:id',         ...AO, adminCtrl.getStudent);
router.patch('/students/:id/status',...AO, adminCtrl.setStudentStatus);

// Submissions queue
router.get('/submissions',          ...AE, submissionCtrl.listAll);
router.get('/submissions/:id',      ...AE, adminCtrl.getSubmission);
router.post('/submissions/:id/review', ...AE, submissionCtrl.review);

// Bookings
router.get('/bookings',             ...AE, adminCtrl.listBookings);
router.patch('/bookings/:id',       ...AE, adminCtrl.updateBooking);

// Results (read-only — results are created via submission review)
router.get('/results',              ...AE, adminCtrl.listResults);

// Examiners
router.get('/examiners',            ...AE, adminCtrl.listExaminers);
router.post('/examiners',           ...AO, adminCtrl.createExaminer);

// Settings — simple key-value store in a JSON column on the profiles table
// For now we store platform-level settings in a dedicated settings table.
router.get('/settings',  ...AO, adminCtrl.getSettings);
router.patch('/settings',...AO, adminCtrl.saveSettings);
router.get('/tests',                ...AO, adminCtrl.listTestsAdmin);
router.get('/tests/:id/content',    ...AO, adminContent.getFullContent);
router.put('/tests/:id/listening',  ...AO, adminContent.saveListening);
router.put('/tests/:id/reading',    ...AO, adminContent.saveReading);
router.put('/tests/:id/writing',    ...AO, adminContent.saveWriting);
router.put('/tests/:id/speaking',   ...AO, adminContent.saveSpeaking);

module.exports = router;
