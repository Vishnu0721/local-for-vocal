const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Transporter verification failed:", error);
    } else {
        console.log("Transporter verified. Server is ready to take our messages");
    }
});

// @desc    Register new user
// @route   POST /api/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        console.log(`Generated OTP for ${email}: ${otp}`);

        // Create user FIRST (Save OTP before emailing)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'customer',
            phone,
            otp,
            otpExpires,
            verificationStatus: role === 'customer' ? 'approved' : 'pending' // Defaults
        });

        console.log("User saved:", user);

        if (user) {
            // Send OTP via email
            console.log(`Starting email sending to ${email}`);
            try {
                const mailOptions = {
                    from: `"KalaConnect Support" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'KalaConnect Email Verification',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0ea5e9; padding: 20px; text-align: center;">
                    <h2 style="color: white; margin: 0;">KalaConnect</h2>
                </div>
                <div style="padding: 20px;">
                    <p style="font-size: 16px;">Hello ${user.name},</p>
                    <p style="font-size: 16px;">Thank you for registering on KalaConnect. Please verify your email using the OTP below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0ea5e9;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
                </div>
            </div>
          `
                };
                await transporter.sendMail(mailOptions);
                console.log(`Email successfully sent to ${email}`);

                return res.status(201).json({
                    success: true,
                    message: 'Registration successful. Please verify your email with the OTP sent to you.',
                    userId: user._id
                });
            } catch (err) {
                console.error("Email error:", err);
                return res.status(500).json({ success: false, message: 'Email sending failed' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: 'User already verified' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.verified = true;
        user.emailVerified = true;
        if (user.role === 'customer') {
            user.verificationStatus = 'approved';
        } else if (user.role === 'artisan') {
            user.verificationStatus = 'pending';
        }

        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Account verified successfully',
            token: generateToken(user._id, user.role),
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Resend OTP
// @route   POST /api/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: 'User already verified' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        console.log(`Generated NEW OTP for ${email}: ${otp}`);

        // Send OTP via email
        console.log(`Starting email sending to ${email} (Resend)`);
        try {
            const mailOptions = {
                from: `"KalaConnect Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'KalaConnect Email Verification',
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0ea5e9; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">KalaConnect</h2>
            </div>
            <div style="padding: 20px;">
                <p style="font-size: 16px;">Hello ${user.name},</p>
                <p style="font-size: 16px;">You requested a new OTP. Please verify your email using the OTP below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0ea5e9;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
            </div>
        </div>
        `
            };
            await transporter.sendMail(mailOptions);
            console.log(`Email successfully sent to ${email}`);

            return res.status(200).json({
                success: true,
                message: 'A new OTP has been sent to your email.'
            });
        } catch (err) {
            console.error("Email error:", err);
            return res.status(500).json({ success: false, message: 'Email sending failed' });
        }

    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.verified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                success: true,
                message: 'Login successful',
                token: generateToken(user._id, user.role),
                user: {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser
};
