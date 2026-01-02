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

module.exports = router;
