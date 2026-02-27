const express = require('express');
const router = express.Router();
const { createProfile, getProfile, getArtisans, getArtisanById, verifyAadhaarOtp } = require('../controllers/artisanController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/artisan/profile', protect, authorize('artisan'), upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'govtIdImage', maxCount: 1 }, { name: 'selfieImage', maxCount: 1 }]), createProfile);
router.get('/artisan/profile', protect, authorize('artisan'), getProfile);
router.get('/artisans', getArtisans);
router.get('/artisans/:id', getArtisanById);

module.exports = router;
