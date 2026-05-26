const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/sessionController');

router.post('/start',  requireAuth, ctrl.start);
router.post('/save',   requireAuth, ctrl.save);
router.post('/submit', requireAuth, ctrl.submit);

module.exports = router;
