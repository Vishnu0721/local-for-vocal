const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { createOrder, getMyOrders } = require('../controllers/orderController');

const router = express.Router();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('CUSTOMER'),
  [
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('postalCode').notEmpty().withMessage('Postal code is required'),
    body('country').notEmpty().withMessage('Country is required'),
  ],
  validateRequest,
  createOrder,
);

router.get('/my-orders', authenticateJWT, authorizeRoles('CUSTOMER'), getMyOrders);

module.exports = router;

