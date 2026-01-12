const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
    try {
        const { mobile, password, name, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ mobile });
        if (user) {
            return res.status(400).json({ success: false, error: 'Mobile number already registered' });
        }

        user = new User({
            mobile,
            password,
            name,
            role: role || 'customer'
        });

        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                mobile: user.mobile,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile });
        console.log(`Login attempt for ${mobile}. User found: ${!!user}`);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid mobile number or password' });
        }

        const isMatch = await user.comparePassword(password);
        console.log(`Password match for ${mobile}: ${isMatch}`);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid mobile number or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                mobile: user.mobile,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Firebase Verify (OTP)
router.post('/firebase-verify', async (req, res) => {
    try {
        const { idToken, name, role } = req.body;
        const { admin } = require('../config/firebase');

        if (!admin) {
            return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
        }

        // Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const phoneNumber = decodedToken.phone_number;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number not found in token' });
        }

        // Clean phone number (remove +91 if present for consistency with existing DB)
        const cleanMobile = phoneNumber.replace(/^\+91/, '');

        // Find or Create User
        let user = await User.findOne({ mobile: cleanMobile });

        if (!user) {
            // Auto-register new user
            user = new User({
                mobile: cleanMobile,
                name: name || 'New User',
                role: role || 'customer',
                password: Math.random().toString(36).slice(-8) // Random placeholder password
            });
            await user.save();
            console.log(`✅ Auto-registered new user via OTP: ${cleanMobile}`);
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                mobile: user.mobile,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Firebase Verify error:', err);
        res.status(401).json({ success: false, error: 'Invalid or expired Firebase token' });
    }
});

// Update FCM Token
router.post('/fcm-token', async (req, res) => {
    try {
        const { userId, fcmToken } = req.body;
        if (!userId || !fcmToken) {
            return res.status(400).json({ success: false, error: 'Missing userId or fcmToken' });
        }

        await User.findByIdAndUpdate(userId, { fcmToken });
        res.json({ success: true, message: 'FCM token updated successfully' });
    } catch (err) {
        console.error('FCM token update error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
