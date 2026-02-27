const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    getMyProducts,
    suggestPrice,
    getProductsByArtisanId
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(getProducts).post(protect, authorize('artisan'), upload.array('images', 5), createProduct);
router.post('/suggest-price', protect, authorize('artisan'), suggestPrice);
router.get('/artisan/myproducts', protect, authorize('artisan'), getMyProducts);
router.get('/artisan/:artisanId', getProductsByArtisanId);
router.route('/:id').get(getProductById);

module.exports = router;
