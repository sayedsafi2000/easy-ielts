const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/testController');

// Public list (published tests only)
router.get('/', ctrl.listPublished);
router.get('/:id', ctrl.getById);

// Admin CRUD
router.get('/admin/all', requireAuth, requireRole('admin'), ctrl.listAll);
router.post('/',       requireAuth, requireRole('admin'), ctrl.create);
router.patch('/:id',   requireAuth, requireRole('admin'), ctrl.update);
router.delete('/:id',  requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
