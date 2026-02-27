const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/users').get(protect, authorize('admin'), getUsers);
router.route('/users/:id/suspend').put(protect, authorize('admin'), toggleSuspendUser);
router.route('/artisans').get(protect, authorize('admin'), getArtisansAdmin);
router.route('/pending-artisans').get(protect, authorize('admin'), getPendingArtisans);
router.route('/all-artisans').get(protect, authorize('admin'), getAllArtisans);
router.route('/all-customers').get(protect, authorize('admin'), getAllCustomers);
router.route('/verify-artisan/:id').patch(protect, authorize('admin'), verifyArtisan);

router.route('/artisans/:id/approve').put(protect, authorize('admin'), approveArtisan);
router.route('/artisans/:id/reject').put(protect, authorize('admin'), rejectArtisan);
router.route('/settings').get(protect, authorize('admin'), getAdminSettings).put(protect, authorize('admin'), updateAdminSettings);
router.route('/orders').get(protect, authorize('admin'), getAllOrders);
router.route('/orders/:id/status').put(protect, authorize('admin'), updateOrderStatus);
router.route('/products').get(protect, authorize('admin'), getAdminProducts);
router.route('/products/:id/approve').put(protect, authorize('admin'), approveProduct);
router.route('/products/:id').delete(protect, authorize('admin'), removeProduct);

module.exports = router;
