const User = require('../models/User');
const Product = require('../models/Product');

const toggleFollowArtisan = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { artisanId } = req.body;

        if (user.followedArtisans.includes(artisanId)) {
            user.followedArtisans = user.followedArtisans.filter(id => id.toString() !== artisanId);
        } else {
            user.followedArtisans.push(artisanId);
        }
        await user.save();
        res.json({ success: true, isFollowing: user.followedArtisans.includes(artisanId) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getFollowedArtisansProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const products = await Product.find({ artisanId: { $in: user.followedArtisans }, isApproved: true })
            .populate('artisanId', 'name')
            .sort('-createdAt')
            .limit(10);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const checkFollowStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { artisanId } = req.params;
        const isFollowing = user.followedArtisans.includes(artisanId);
        res.json({ isFollowing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { toggleFollowArtisan, getFollowedArtisansProducts, checkFollowStatus };
