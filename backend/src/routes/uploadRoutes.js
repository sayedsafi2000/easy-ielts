const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadHandler } = require('../controllers/uploadController');

// Admin only — POST /api/uploads with multipart field "file"
router.post('/', requireAuth, requireRole('admin'), uploadHandler);

module.exports = router;
