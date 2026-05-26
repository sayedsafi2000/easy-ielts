const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/testContentController');

// Public read of test content (so unauthenticated visitors can preview is
// optional — for now we require auth so a token is always present).
router.get('/:id/listening', requireAuth, ctrl.listening);
router.get('/:id/reading',   requireAuth, ctrl.reading);
router.get('/:id/writing',   requireAuth, ctrl.writing);
router.get('/:id/speaking',  requireAuth, ctrl.speaking);

module.exports = router;
