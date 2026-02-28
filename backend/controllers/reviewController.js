const Review = require('../models/Review');
const Order = require('../models/Order');
const Artisan = require('../models/Artisan');

// @desc    Create Review
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = async (req, res) => {
    try {
        const { productId, artisanId, rating, comment } = req.body;

        const justOrdered = await Order.findOne({
            customerId: req.user._id,
            'products.productId': productId
        });

        if (!justOrdered) {
            return res.status(403).json({ message: "Only verified buyers can review this product." });
        }

        const review = new Review({
            productId,
            artisanId,
            customerId: req.user._id,
            rating: Number(rating),
            comment
        });

        await review.save();

        const artisanReviews = await Review.find({ artisanId });
        const avg = artisanReviews.reduce((acc, item) => item.rating + acc, 0) / artisanReviews.length;

        await Artisan.updateOne({ userId: artisanId }, { averageRating: avg });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).populate('customerId', 'name');

        const count = reviews.length;
        const avg = count > 0 ? (reviews.reduce((acc, item) => item.rating + acc, 0) / count) : 0;

        res.json({ reviews, average: avg, count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createReview, getProductReviews };
