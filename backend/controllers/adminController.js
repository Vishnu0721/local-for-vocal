const User = require('../models/User');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AdminSettings = require('../models/AdminSettings');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all completed artisan applications
// @route   GET /api/admin/artisans
// @access  Private/Admin
const getArtisansAdmin = async (req, res) => {
    try {
        const artisans = await Artisan.find({}).populate('userId', 'name email verified phone govtId bankAccount ifsc artisanStatus govtIdImage selfieImage verificationStatus rejectionReason');
        res.json(artisans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending artisans
// @route   GET /api/admin/pending-artisans
// @access  Private/Admin
const getPendingArtisans = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            role: "artisan",
            verificationStatus: "pending"
        });
        console.log("Pending artisans:", pendingUsers);
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all artisans (User level)
// @route   GET /api/admin/all-artisans
// @access  Private/Admin
const getAllArtisans = async (req, res) => {
    try {
        const users = await User.find({ role: "artisan" });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all customers
// @route   GET /api/admin/all-customers
// @access  Private/Admin
const getAllCustomers = async (req, res) => {
    try {
        const users = await User.find({ role: "customer" });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify artisan (PATCH)
// @route   PATCH /api/admin/verify-artisan/:id
// @access  Private/Admin
const verifyArtisan = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (status === 'approved') {
            user.verificationStatus = 'approved';
            user.artisanStatus = 'verified';
            user.rejectionReason = '';
        } else if (status === 'rejected') {
            user.verificationStatus = 'rejected';
            user.artisanStatus = 'rejected';
            user.rejectionReason = reason || 'Requirements not met';
        }

        await user.save();

        const artisan = await Artisan.findOne({ userId: user._id });
        if (artisan) {
            artisan.isApproved = (status === 'approved');
            await artisan.save();
        }

        res.json({ success: true, message: `Artisan ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve artisan
// @route   PUT /api/admin/artisans/:id/approve
// @access  Private/Admin
const approveArtisan = async (req, res) => {
    try {
        const artisan = await Artisan.findById(req.params.id);

        if (artisan) {
            artisan.isApproved = true;
            const updatedArtisan = await artisan.save();

            // Also explicitly verify the User
            await User.findByIdAndUpdate(artisan.userId, {
                artisanStatus: 'verified',
                verificationStatus: 'approved',
                rejectionReason: ''
            });

            res.json(updatedArtisan);
        } else {
            res.status(404).json({ message: 'Artisan not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('artisanId', 'name email');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Approve Product
// @route   PUT /api/admin/products/:id/approve
// @access  Private/Admin
const approveProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.isApproved = true;
        await product.save();
        res.json({ success: true, message: "Product approved" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Remove/Delete Product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const removeProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Suspend/Unsuspend User
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const toggleSuspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isSuspended = !user.isSuspended;
        await user.save();
        res.json({ success: true, message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Reject artisan
// @route   PUT /api/admin/artisans/:id/reject
// @access  Private/Admin
const rejectArtisan = async (req, res) => {
    try {
        const artisan = await Artisan.findById(req.params.id);
        const { reason } = req.body;
        if (artisan) {
            artisan.isApproved = false;
            await artisan.save();
            await User.findByIdAndUpdate(artisan.userId, {
                artisanStatus: 'rejected',
                verificationStatus: 'rejected',
                rejectionReason: reason || 'Requirements not met'
            });
            res.json({ message: "Artisan application rejected." });
        } else {
            res.status(404).json({ message: 'Artisan not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getAdminSettings = async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({});
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAdminSettings = async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create(req.body);
        } else {
            settings.laborRatePerHour = req.body.laborRatePerHour || settings.laborRatePerHour;
            settings.platformFeePercent = req.body.platformFeePercent || settings.platformFeePercent;
            settings.profitMarginPercent = req.body.profitMarginPercent || settings.profitMarginPercent;
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('customerId', 'name email phone').populate('products.productId', 'name price artisanId');
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Update Order Status (Confirm COD, etc.)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.body.status) order.status = req.body.status;
        if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
        if (req.body.shipmentStatus) order.shipmentStatus = req.body.shipmentStatus;

        await order.save();
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getUsers,
    getArtisansAdmin,
    getPendingArtisans,
    getAllArtisans,
    getAllCustomers,
    verifyArtisan,
    approveArtisan,
    rejectArtisan,
    getAdminProducts,
    approveProduct,
    removeProduct,
    toggleSuspendUser,
    getAdminSettings,
    updateAdminSettings,
    getAllOrders,
    updateOrderStatus
};
