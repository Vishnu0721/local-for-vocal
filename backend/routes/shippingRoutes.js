const express = require('express');
const router = express.Router();
const {
    createShipment,
    trackShipment
} = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create/:orderId', protect, authorize('admin', 'artisan'), createShipment);
router.get('/track/:orderId', protect, trackShipment);

module.exports = router;
