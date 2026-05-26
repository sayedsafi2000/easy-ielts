const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/submissionController');

router.post('/', requireAuth, ctrl.create);

module.exports = router;
