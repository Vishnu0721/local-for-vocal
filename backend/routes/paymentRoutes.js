const express = require('express');
const router = express.Router();
const {
    createPaymentOrder,
    verifyPayment,
    setCOD
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create-order', protect, authorize('customer'), createPaymentOrder);
router.post('/verify', protect, authorize('customer'), verifyPayment);
router.post('/cod', protect, authorize('customer'), setCOD);

module.exports = router;
