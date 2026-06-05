const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/bookingController');

router.get('/',                  requireAuth, ctrl.listMine);
router.post('/',                 requireAuth, ctrl.create);
router.post('/:id/confirm-time', requireAuth, ctrl.confirmTime);
router.post('/:id/decline-time', requireAuth, ctrl.declineTime);
router.post('/:id/cancel',       requireAuth, ctrl.cancel);

module.exports = router;
