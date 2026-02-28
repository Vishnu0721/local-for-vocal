const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Order = require('../models/Order');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');

// Initialize Razorpay instance
let razorpayInstance = null;
try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123',
    });
} catch (e) {
    console.warn("Razorpay keys not properly configured. Fallback to mock mode.");
}

// Update Artisan Impact
const updateArtisanImpact = async (order) => {
    try {
        await order.populate('products.productId');
        const artisanUpdates = {};
        for (let item of order.products) {
            if (item.productId && item.productId.artisanId) {
                const artId = item.productId.artisanId.toString();
                if (!artisanUpdates[artId]) {
                    artisanUpdates[artId] = { addedProductsSold: 0, addedEarnings: 0 };
                }
                artisanUpdates[artId].addedProductsSold += item.quantity;
                artisanUpdates[artId].addedEarnings += (item.price * item.quantity);
            }
        }

        for (let artId in artisanUpdates) {
            const artisan = await Artisan.findOne({ userId: artId });
            if (artisan) {
                artisan.totalProductsSold += artisanUpdates[artId].addedProductsSold;
                artisan.totalEarnings += artisanUpdates[artId].addedEarnings;

                // Track repeat customers
                const artProducts = await Product.find({ artisanId: artId }).select('_id');
                const prevOrders = await Order.countDocuments({
                    customerId: order.customerId,
                    _id: { $ne: order._id },
                    'products.productId': { $in: artProducts }
                });
                if (prevOrders === 1) { // Only increment the very first time they repeat
                    artisan.repeatCustomers += 1;
                }
                await artisan.save();
            }
        }
    } catch (err) {
        console.error("Error updating artisan impact:", err);
    }
};

// Generate Receipt PDF
const generateReceipt = async (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `receipt_${order._id}.pdf`;
            const filePath = path.join(__dirname, '..', 'uploads', fileName);

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Receipt Header
            doc.fontSize(20).text('KalaConnect Official Receipt', { align: 'center' });
            doc.moveDown();

            // Order details
            doc.fontSize(12)
                .text(`Order ID: ${order._id}`)
                .text(`Date: ${new Date(order.date).toLocaleDateString()}`)
                .text(`Payment Method: ${order.paymentMethod}`)
                .text(`Payment Status: ${order.paymentStatus}`)
                .moveDown();

            const customerName = order.customerId ? order.customerId.name : "Customer";
            doc.text(`Customer Name: ${customerName}`).moveDown();

            doc.text('Items:', { underline: true }).moveDown(0.5);

            let total = 0;
            order.products.forEach(p => {
                const prodName = p.productId ? p.productId.name : "KalaConnect Assured Product";
                const lineTotal = p.price * p.quantity;
                total += lineTotal;
                doc.text(`- ${prodName} (x${p.quantity}): Rs. ${lineTotal.toFixed(2)}`);
            });

            doc.moveDown();
            const platformFee = total * 0.10;
            const grandTotal = total + platformFee;

            doc.text(`Subtotal: Rs. ${total.toFixed(2)}`);
            doc.text(`Platform Fee (inclusive GST mock): Rs. ${platformFee.toFixed(2)}`);
            doc.fontSize(14).font('Helvetica-Bold').text(`Grand Total: Rs. ${order.totalPrice.toFixed(2)}`, { indent: 20 });

            // Footer
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica-Oblique').text('Supporting local artisans. Thank you for your purchase!', { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                const url = `http://localhost:5000/uploads/${fileName}`;
                resolve(url);
            });
            writeStream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // convert to paise
            currency: "INR",
            receipt: "receipt_" + Date.now()
        };

        if (process.env.PAYMENT_MODE === 'demo' || !razorpayInstance) {
            // Keep order linked securely over backend
            if (orderId) {
                const order = await Order.findById(orderId);
                if (order) {
                    order.paymentMethod = "Razorpay (Demo)";
                    order.paymentStatus = "COD_PENDING"; // Wait till verify
                    await order.save();
                }
            }

            return res.json({
                success: true,
                id: `order_demo_${Date.now()}`,
                key_id: 'demo_key_123',
                currency: "INR",
                amount: Math.round(Number(amount) * 100),
                isDemo: true
            });
        }

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Keep order linked securely over backend
        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentMethod = "Razorpay";
                order.paymentStatus = "COD_PENDING"; // Wait till verify
                await order.save();
            }
        }

        res.json({
            success: true,
            id: razorpayOrder.id,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            isDemo: false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123')
            .update(body.toString())
            .digest("hex");

        let isAuthentic = expectedSignature === razorpay_signature || process.env.NODE_ENV === 'development'; // allow mock signature for dev
        if (razorpay_payment_id && razorpay_payment_id.startsWith('pay_demo_')) {
            isAuthentic = true;
        }

        if (isAuthentic) {
            const order = await Order.findById(order_id).populate('customerId', 'name').populate('products.productId', 'name');
            if (order) {
                order.paymentStatus = "Paid";
                order.status = "paid";
                if (razorpay_payment_id && razorpay_payment_id.startsWith('pay_demo_')) {
                    order.paymentMethod = "simulation";
                    order.paymentId = razorpay_payment_id;
                    order.paidAt = new Date();
                    order.razorpayPaymentId = razorpay_payment_id; // backward compatible
                } else {
                    order.paymentMethod = "Razorpay";
                    order.razorpayPaymentId = razorpay_payment_id;
                    order.paymentId = razorpay_payment_id; // backward compatible
                    order.paidAt = new Date();
                }

                // Generate Receipt
                const receiptUrl = await generateReceipt(order);
                order.receiptUrl = receiptUrl;

                await order.save();
                await updateArtisanImpact(order);

                res.json({ success: true, message: "Payment Verified successfully", receiptUrl });
            } else {
                res.status(404).json({ message: "Order not found" });
            }
        } else {
            res.status(400).json({ message: "Invalid payment signature" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Mark Order as COD
// @route   POST /api/payment/cod
// @access  Private
const setCOD = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ message: "Order not found" });

        order.paymentMethod = "COD";
        order.paymentStatus = "COD_PENDING";
        await order.save();
        await updateArtisanImpact(order);

        res.json({ success: true, message: "COD selected successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createPaymentOrder,
    verifyPayment,
    setCOD
};
