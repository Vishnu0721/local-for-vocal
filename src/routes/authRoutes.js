const express = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyEmailController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
} = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['customer', 'artisan'])
      .withMessage('Role must be either customer or artisan'),
  ],
  validateRequest,
  register,
);

router.get('/verify-email/:token', verifyEmailController);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  loginController,
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validateRequest,
  forgotPasswordController,
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validateRequest,
  resetPasswordController,
);

module.exports = router;

