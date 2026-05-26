const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/bookingController');

router.get('/',  requireAuth, ctrl.listMine);
router.post('/', requireAuth, ctrl.create);

module.exports = router;
