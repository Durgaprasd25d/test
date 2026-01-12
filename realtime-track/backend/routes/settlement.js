const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

// Create Razorpay Order for dues
router.post('/create-order', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: `rcpt_due_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Payment and update dues
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            userId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEYSECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        // Apply payment to commissionDue
        const paidAmount = parseFloat(amount);
        technician.wallet.commissionDue = Math.max(0, technician.wallet.commissionDue - paidAmount);
        await technician.save();

        // Create transaction record
        await Transaction.create({
            technician: userId,
            type: 'settlement',
            amount: paidAmount,
            description: `Dues Paid via Razorpay`,
            status: 'completed',
            metadata: {
                razorpay_payment_id,
                razorpay_order_id
            }
        });

        res.json({
            success: true,
            newCommissionDue: technician.wallet.commissionDue,
            balance: technician.wallet.balance,
            message: 'Commission dues settled successfully!'
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Old endpoint remains for backward compatibility or manual admin use
// Pay company dues
router.post('/pay-dues', async (req, res) => {
    try {
        const { userId, amount, paymentMethod } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        // Apply payment to commissionDue
        technician.wallet.commissionDue = Math.max(0, technician.wallet.commissionDue - amount);
        await technician.save();

        // Create transaction record
        await Transaction.create({
            technician: userId,
            type: 'settlement',
            amount: amount,
            description: `Commission Settlement via ${paymentMethod || 'UPI'}`,
            status: 'completed',
            createdAt: new Date()
        });

        res.json({
            success: true,
            newCommissionDue: technician.wallet.commissionDue,
            message: 'Payment successful. Your dues have been updated.'
        });
    } catch (error) {
        console.error('Settlement error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
