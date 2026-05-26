const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').optional().isString(),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isString().notEmpty().withMessage('Password required'),
  ],
  validate,
  ctrl.login
);

router.post('/logout', ctrl.logout);
router.get('/me',     requireAuth, ctrl.me);
router.patch('/me',   requireAuth, ctrl.updateMe);
router.post('/change-password', requireAuth, ctrl.changePassword);

module.exports = router;
