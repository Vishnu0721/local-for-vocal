const mongoose = require('mongoose');

const ArtisanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    village: {
        type: String,
        required: [true, 'Please add a village']
    },
    story: {
        type: String,
        required: [true, 'Please add your story']
    },
    skills: {
        type: [String],
        required: true
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    area: String,
    craftCategory: String,
    totalProductsSold: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 },
    isApproved: {
        type: Boolean,
        default: false
    },
    qrCodeUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Artisan', ArtisanSchema);
