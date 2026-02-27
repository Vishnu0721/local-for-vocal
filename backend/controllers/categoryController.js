const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
    { name: 'Handicrafts', slug: 'handicrafts' },
    { name: 'Handloom', slug: 'handloom' },
    { name: 'Pottery', slug: 'pottery' },
    { name: 'Jewelry', slug: 'jewelry' },
    { name: 'Woodwork', slug: 'woodwork' },
    { name: 'Paintings', slug: 'paintings' },
    { name: 'Textiles', slug: 'textiles' },
    { name: 'Eco Products', slug: 'eco-products' },
    { name: 'Home Decor', slug: 'home-decor' }
];

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        let categories = await Category.find({});
        if (categories.length === 0) {
            // Seed defaults
            await Category.insertMany(DEFAULT_CATEGORIES);
            categories = await Category.find({});
        }
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const category = await Category.create({ name, slug, description, createdByAdmin: req.user._id });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const { name, slug, description } = req.body;
        if (name) category.name = name;
        if (slug) category.slug = slug;
        if (description !== undefined) category.description = description;

        await category.save();
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
