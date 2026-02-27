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
