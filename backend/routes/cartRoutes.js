const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(protect, authorize('customer'), getCart).post(protect, authorize('customer'), addToCart);
router.route('/clear').post(protect, authorize('customer'), clearCart);
router.route('/:productId').delete(protect, authorize('customer'), removeFromCart); // For RESTful delete
router.route('/remove/:productId').post(protect, authorize('customer'), removeFromCart); // For frontend fetch simplicity

module.exports = router;
