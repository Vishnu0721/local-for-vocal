const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { toggleFollowArtisan, getFollowedArtisansProducts, checkFollowStatus } = require('../controllers/followController');

router.post('/', protect, toggleFollowArtisan);
router.get('/products', protect, getFollowedArtisansProducts);
router.get('/status/:artisanId', protect, checkFollowStatus);

module.exports = router;
