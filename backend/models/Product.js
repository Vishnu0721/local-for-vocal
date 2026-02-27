const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    artisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a product name']
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    materials: {
        type: String,
        required: [true, 'Please add materials used']
    },
    rawMaterials: String,
    materialCost: { type: Number, default: 0 },
    laborHours: { type: Number, default: 0 },
    productionTime: {
        type: String,
        required: [true, 'Please add production time']
    },
    makingStory: {
        type: String,
        required: [true, 'Please add the story behind this craft']
    },
    makingProcess: String,
    images: [{
        type: String
    }],
    qrCodeUrl: {
        type: String
    },
    qrCode: String,
    uniqueProductId: {
        type: String,
        unique: true
    },
    verifiedArtisanOnly: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
