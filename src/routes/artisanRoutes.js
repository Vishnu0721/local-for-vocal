const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../middleware/uploadMiddleware');
const { createOrUpdateProfile } = require('../controllers/artisanController');

const router = express.Router();

router.post(
  '/create-profile',
  authenticateJWT,
  authorizeRoles('ARTISAN'),
  upload.single('profileImage'),
  [
    body('bio').notEmpty().withMessage('Bio is required'),
    body('story').notEmpty().withMessage('Story is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
  ],
  validateRequest,
  createOrUpdateProfile,
);

module.exports = router;

