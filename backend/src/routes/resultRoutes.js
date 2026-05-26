const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/resultController');

router.get('/', requireAuth, ctrl.listMine);

module.exports = router;
