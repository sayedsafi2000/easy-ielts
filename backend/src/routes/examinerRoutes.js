const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/examinerController');

const EX = [requireAuth, requireRole('examiner', 'admin')];

router.get('/bookings',                  ...EX, ctrl.listMine);
router.post('/bookings/:id/accept',       ...EX, ctrl.accept);
router.post('/bookings/:id/propose-time', ...EX, ctrl.proposeTime);
router.post('/bookings/:id/marks',        ...EX, ctrl.submitMarks);
router.post('/bookings/:id/recording',    ...EX, ctrl.uploadRecording);
router.put('/bookings/:id/transcript',    ...EX, ctrl.setTranscript);

module.exports = router;
