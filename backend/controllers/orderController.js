const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { orderItems, totalPrice } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Format products for Order schema model
        const products = orderItems.map((item) => ({
            productId: item.productId || item.product._id, // depending on frontend send format
            quantity: item.qty || item.quantity,
            price: item.price || item.product.price
        }));

        const order = new Order({
            customerId: req.user._id,
            products,
            totalPrice,
            status: 'pending'
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user._id })
            .populate('products.productId', 'name images price qrCodeUrl')
            .sort('-date');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name email role')
            .populate('products.productId', 'name images price artisanId qrCodeUrl');

        if (order && (order.customerId._id.equals(req.user._id) || req.user.role === 'admin' || req.user.role === 'artisan')) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found or unauthorized' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Get artisan orders and revenue
// @route   GET /api/orders/artisan
// @access  Private/Artisan
const getArtisanOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('products.productId', 'name images price artisanId qrCodeUrl');

        // Filter orders that have products belonging to this artisan
        const artisanOrders = orders.filter(order =>
            order.products.some(p => p.productId && p.productId.artisanId && p.productId.artisanId.toString() === req.user._id.toString())
        );

        let totalRevenue = 0;
        let totalOrdersCount = artisanOrders.length;

        artisanOrders.forEach(order => {
            order.products.forEach(p => {
                if (p.productId && p.productId.artisanId && p.productId.artisanId.toString() === req.user._id.toString()) {
                    totalRevenue += p.price * p.quantity;
                }
            })
        });

        res.json({ success: true, count: totalOrdersCount, revenue: totalRevenue, data: artisanOrders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getArtisanOrders
};
