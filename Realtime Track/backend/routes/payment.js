const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// Create a new Razorpay order
router.post('/create-order', async (req, res) => {
    const { amount, currency, receipt } = req.body;
    if (!amount) {
        return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const result = await paymentService.createOrder(amount, currency, receipt);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// Verify Razorpay payment signature
router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (result.success) {
        res.json({ success: true, message: 'Payment verified successfully' });
    } else {
        res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
});

module.exports = router;
