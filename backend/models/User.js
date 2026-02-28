const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'artisan', 'admin'],
        default: 'customer'
    },
    verified: {
        type: Boolean,
        default: false
    },
    phone: String,
    govtId: String, // will be used to store generic ID if needed or we'll just not store full aadhaar
    aadhaarLast4: String,
    govtIdImage: String,
    selfieImage: String,
    bankAccount: String,
    ifsc: String,
    emailVerified: {
        type: Boolean,
        default: false
    },
    identityDocsSubmitted: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: String,
    otp: String,
    otpExpires: Date,
    isSuspended: {
        type: Boolean,
        default: false
    },
    followedArtisans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
