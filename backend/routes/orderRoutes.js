const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getArtisanOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').post(protect, authorize('customer'), createOrder).get(protect, authorize('customer'), getMyOrders);
router.route('/artisan/stats').get(protect, authorize('artisan'), getArtisanOrders);
router.route('/:id').get(protect, getOrderById);

module.exports = router;
