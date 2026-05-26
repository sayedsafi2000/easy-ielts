const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/attemptController');

router.post('/',     requireAuth, ctrl.create);
router.get('/mine',  requireAuth, ctrl.listMine);
router.get('/:id',   requireAuth, ctrl.getById);

module.exports = router;
