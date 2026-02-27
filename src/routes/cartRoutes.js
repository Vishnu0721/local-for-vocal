const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { addToCart, getCart, removeCartItem } = require('../controllers/cartController');

const router = express.Router();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('CUSTOMER'),
  [
    body('productId').notEmpty().withMessage('productId is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validateRequest,
  addToCart,
);

router.get('/', authenticateJWT, authorizeRoles('CUSTOMER'), getCart);
router.delete('/:itemId', authenticateJWT, authorizeRoles('CUSTOMER'), removeCartItem);

module.exports = router;

