const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { createOrUpdateReview, getReviewsForProduct } = require('../controllers/reviewController');

const router = express.Router();

router.post(
  '/',
  authenticateJWT,
  [
    body('productId').notEmpty().withMessage('productId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Comment is required'),
  ],
  validateRequest,
  createOrUpdateReview,
);

router.get('/:productId', getReviewsForProduct);

module.exports = router;

