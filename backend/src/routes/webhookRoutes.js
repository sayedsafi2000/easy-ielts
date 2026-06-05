const router = require('express').Router();
const ctrl = require('../controllers/webhookController');

// No auth — verified by provider signature over the raw body.
router.post('/zoom', ctrl.zoom);

module.exports = router;
