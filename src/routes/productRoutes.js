const express = require('express');
const { body } = require('express-validator');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../middleware/uploadMiddleware');
const {
  createProduct,
  getProducts,
  getProductById,
  getProductsByArtisan,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/artisan/:id', getProductsByArtisan);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ARTISAN'),
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'handmadeProof', maxCount: 1 },
  ]),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
    body('materials').notEmpty().withMessage('Materials are required'),
    body('productionTime').notEmpty().withMessage('Production time is required'),
    body('geoLocationLat').isFloat().withMessage('Valid latitude is required'),
    body('geoLocationLng').isFloat().withMessage('Valid longitude is required'),
  ],
  validateRequest,
  createProduct,
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles('ARTISAN'),
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'handmadeProof', maxCount: 1 },
  ]),
  updateProduct,
);

router.delete('/:id', authenticateJWT, authorizeRoles('ARTISAN'), deleteProduct);

module.exports = router;

