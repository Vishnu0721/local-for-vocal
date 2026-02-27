const Artisan = require('../models/Artisan');
const User = require('../models/User');
const { validateAadhaar } = require('../utils/verhoeff');
const QRCode = require('qrcode');

// @desc    Create artisan profile
// @route   POST /api/artisan/profile
// @access  Private (Artisan)
const createProfile = async (req, res) => {
    try {
        const { village, story, skills, latitude, longitude, govtId, bankAccount, ifsc, phone } = req.body;

        const existingProfile = await Artisan.findOne({ userId: req.user.id });

        if (existingProfile) {
            return res.status(400).json({ message: 'Artisan profile already exists' });
        }

        // Aadhaar Strict Validation
        if (!validateAadhaar(govtId)) {
            return res.status(400).json({ message: 'Invalid Aadhaar Number. Please verify.' });
        }

        // Check for required images
        if (!req.files || !req.files['govtIdImage'] || !req.files['selfieImage']) {
            return res.status(400).json({ message: 'Both Government ID and Selfie images are required.' });
        }

        // Mask Aadhaar before saving
        const aadhaarLast4 = govtId.slice(-4);
        const maskedAadhaar = `XXXX-XXXX-${aadhaarLast4}`;

        // Get image URLs
        const getUrl = (fileArray) => fileArray && fileArray.length > 0 ? `http://localhost:5000/uploads/${fileArray[0].filename}` : null;

        let photoUrl = getUrl(req.files['photo']) || 'no-photo.jpg';
        let govtIdImageUrl = getUrl(req.files['govtIdImage']);
        let selfieImageUrl = getUrl(req.files['selfieImage']);

        // Update User model with verification details
        await User.findByIdAndUpdate(req.user.id, {
            govtId: maskedAadhaar, // OVERWRITE full
            aadhaarLast4: aadhaarLast4,
            govtIdImage: govtIdImageUrl,
            selfieImage: selfieImageUrl,
            bankAccount,
            ifsc,
            phone,
            identityDocsSubmitted: true,
            verificationStatus: 'pending'
        });

        const artisan = await Artisan.create({
            userId: req.user.id,
            photo: photoUrl,
            village,
            story,
            skills: skills ? skills.split(',').map(s => s.trim()) : [],
            location: {
                latitude,
                longitude
            }
        });

        const user = await User.findById(req.user.id);
        const qrData = JSON.stringify({
            type: "artisan",
            artisanId: artisan._id,
            name: user.name,
            govtId: maskedAadhaar,
            verified: false,
            physicalAddress: village,
            story: story
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        artisan.qrCodeUrl = qrCodeDataUrl;
        await artisan.save();

        res.status(201).json({ success: true, message: "Profile and identity documents submitted successfully. Please wait for admin approval." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get artisan profile
// @route   GET /api/artisan/profile
// @access  Private (Artisan)
const getProfile = async (req, res) => {
    try {
        const artisan = await Artisan.findOne({ userId: req.user.id }).populate('userId', 'name email');

        if (!artisan) {
            return res.status(404).json({ message: 'Artisan profile not found' });
        }

        res.json({ success: true, data: artisan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all artisans
// @route   GET /api/artisans
// @access  Public
const getArtisans = async (req, res) => {
    try {
        const artisans = await Artisan.find({ isApproved: true }).populate('userId', 'name email');
        res.json({ success: true, data: artisans });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get artisan by ID
// @route   GET /api/artisans/:id
// @access  Public
const getArtisanById = async (req, res) => {
    try {
        const artisan = await Artisan.findById(req.params.id).populate('userId', 'name email');
        if (!artisan) return res.status(404).json({ message: 'Artisan not found' });
        res.json({ success: true, data: artisan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProfile,
    getProfile,
    getArtisans,
    getArtisanById
};
