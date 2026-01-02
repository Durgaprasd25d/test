const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Ride = require('../models/Ride');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

// Create Razorpay order for customer payment (both prepaid and postpaid)
router.post('/create-order', async (req, res) => {
    try {
        const { rideId, amount } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found' });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: 'INR',
            receipt: `rcpt_${rideId}`,
            notes: {
                rideId: rideId,
                paymentTiming: ride.paymentTiming
            }
        };

        const order = await razorpay.orders.create(options);

        // Store order ID in ride
        ride.razorpayDetails = ride.razorpayDetails || {};
        ride.razorpayDetails.orderId = order.id;
        await ride.save();

        res.json({
            success: true,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEYID
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Razorpay payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            rideId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEYSECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }

        const ride = await Ride.findOne({ rideId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found' });
        }

        // Update ride with payment details
        ride.paymentStatus = 'PAID';
        ride.razorpayDetails = {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            paidAt: new Date()
        };
        await ride.save();

        // Emit socket event for payment success
        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('payment:success', {
            rideId,
            completionOtp: ride.completionOtp // Send OTP if service is already complete
        });

        // IMPORTANT: Broadcast job to all technicians if it was PREPAID payment
        // (Postpaid jobs are broadcasted at request time)
        if (ride.paymentTiming === 'PREPAID') {
            console.log('📢 Broadcasting PREPAID job after payment success:', rideId);
            io.emit('ride:requested', {
                rideId: ride.rideId,
                pickup: ride.pickup,
                destination: ride.destination,
                serviceType: ride.serviceType,
                paymentMethod: ride.paymentMethod,
                paymentTiming: ride.paymentTiming
            });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            paymentStatus: ride.paymentStatus
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
