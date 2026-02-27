const axios = require('axios');
const Order = require('../models/Order');

// Mock Shiprocket Authentication
let shiprocketToken = "MOCK_SHIPROCKET_TOKEN_12345";

// @desc    Create shipment via Shiprocket
// @route   POST /api/shipping/create/:orderId
// @access  Private/Admin
const createShipment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('customerId', 'name email phone');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Simulate Shiprocket API call
        // Real logic: axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adHoc', data, {headers})

        const mockTrackingId = "AWB" + Math.floor(Math.random() * 1000000000);

        order.status = "shipped";
        order.trackingId = mockTrackingId;
        order.shipmentStatus = "MANIFESTED";
        order.courierName = "Delhivery";
        await order.save();

        res.json({ success: true, trackingId: mockTrackingId, message: "Shipment created successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Track shipment via Shiprocket
// @route   GET /api/shipping/track/:orderId
// @access  Private
const trackShipment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order || !order.trackingId) {
            return res.status(404).json({ message: 'Tracking details not found for this order' });
        }

        // Simulate Shiprocket tracking API
        // Real logic: axios.get(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.trackingId}`, {headers})

        const mockTrackingData = {
            tracking_url: `https://shiprocket.co/tracking/${order.trackingId}`,
            status: order.shipmentStatus,
            courier: order.courierName,
            expected_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };

        res.json({ success: true, tracking: mockTrackingData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createShipment,
    trackShipment
};
