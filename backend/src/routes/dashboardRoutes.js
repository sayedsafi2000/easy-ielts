const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.get('/', requireAuth, ctrl.get);

module.exports = router;
