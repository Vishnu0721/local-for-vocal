const Product = require('../models/Product');
const Artisan = require('../models/Artisan');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const keyword = req.query.keyword
            ? {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i',
                },
            }
            : {};

        const categoryFilter = req.query.category ? { categoryId: req.query.category } : {};

        const products = await Product.find({ ...keyword, ...categoryFilter, isApproved: true })
            .populate({ path: 'artisanId', select: 'name email' })
            .populate('categoryId', 'name slug');

        // Populate actual artisan profile data manually to avoid complex mongoose bugs if ref is weak
        const productsWithArtisanData = await Promise.all(products.map(async (prod) => {
            const artisanProfile = await Artisan.findOne({ userId: prod.artisanId._id });
            return {
                ...prod.toObject(),
                artisanProfile
            };
        }));

        res.json({ success: true, data: productsWithArtisanData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isApproved: true })
            .populate('artisanId', 'name email')
            .populate('categoryId', 'name slug');

        if (product) {
            const artisanProfile = await Artisan.findOne({ userId: product.artisanId._id });
            res.json({
                ...product.toObject(),
                artisanProfile
            });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Artisan
const createProduct = async (req, res) => {
    try {
        const { name, price, description, materials, productionTime, makingStory, categoryId } = req.body;

        if (!makingStory) {
            return res.status(400).json({ message: 'Making story is required for authenticity.' });
        }

        if (!categoryId) {
            return res.status(400).json({ message: 'Category is required.' });
        }

        const urls = [];
        if (req.files) {
            for (let file of req.files) {
                urls.push(`http://localhost:5000/uploads/${file.filename}`);
            }
        }

        // Only Verified Artisan can publish
        const user = await User.findById(req.user._id);
        if (user.verificationStatus !== 'approved') {
            return res.status(403).json({ message: 'Your account is not verified by admin.' });
        }

        const product = new Product({
            name,
            price,
            description,
            categoryId,
            materials,
            rawMaterials: materials,
            productionTime,
            makingStory,
            makingProcess: makingStory,
            materialCost: req.body.materialCost ? Number(req.body.materialCost) : 0,
            laborHours: req.body.laborHours ? Number(req.body.laborHours) : 0,
            images: urls,
            artisanId: req.user._id,
            uniqueProductId: crypto.randomBytes(8).toString('hex'),
            verifiedArtisanOnly: true
        });

        const createdProduct = await product.save();
        const Category = require('../models/Category');
        const category = await Category.findById(categoryId);

        const qrData = JSON.stringify({
            type: "product",
            productId: createdProduct._id,
            productName: createdProduct.name,
            category: category ? category.name : "Uncategorized",
            materialCost: createdProduct.materialCost,
            laborHours: createdProduct.laborHours,
            retailPrice: createdProduct.price,
            artisanName: user.name,
            artisanId: createdProduct.artisanId,
            uniqueProductCode: createdProduct.uniqueProductId,
            rawMaterials: createdProduct.rawMaterials,
            manufacturingProcess: createdProduct.makingProcess
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        // Save QR Code
        createdProduct.qrCodeUrl = qrCodeDataUrl;
        createdProduct.qrCode = qrCodeDataUrl;
        await createdProduct.save();

        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get artisan's products
// @route   GET /api/products/artisan/myproducts
// @access  Private/Artisan
const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ artisanId: req.user._id }).populate('categoryId', 'name slug');
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Suggest dynamic price for product
// @route   POST /api/products/suggest-price
// @access  Private/Artisan
const suggestPrice = async (req, res) => {
    try {
        const { materialCost, productionHours, location } = req.body;

        if (!materialCost || !productionHours) {
            return res.status(400).json({ message: 'Must provide materialCost and productionHours' });
        }

        // Base parameters adjustable via Admin
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({}); // create defaults if none
        }

        const laborRatePerHour = settings.laborRatePerHour || 100;
        const platformFeePercent = settings.platformFeePercent || 20;
        const markupPercent = settings.profitMarginPercent || 100;

        const materialCostNum = Number(materialCost);
        const laborHoursNum = Number(productionHours);

        if (materialCostNum < 0 || laborHoursNum <= 0) {
            return res.status(400).json({ message: 'Invalid material cost or production hours.' });
        }

        const laborCost = laborHoursNum * laborRatePerHour;
        const baseCost = materialCostNum + laborCost;
        const retailPrice = baseCost + (baseCost * markupPercent / 100);
        const platformFee = retailPrice * platformFeePercent / 100;
        const artisanNet = retailPrice - platformFee;
        const artisanProfit = artisanNet - baseCost;

        res.json({
            suggestedPrice: retailPrice,
            breakdown: {
                baseCost,
                retailPrice,
                platformFee,
                artisanNet,
                artisanProfit
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get products by generic artisan ID (Public)
// @route   GET /api/products/artisan/:artisanId
// @access  Public
const getProductsByArtisanId = async (req, res) => {
    try {
        const products = await Product.find({ artisanId: req.params.artisanId, isApproved: true });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    getMyProducts,
    suggestPrice,
    getProductsByArtisanId
};
