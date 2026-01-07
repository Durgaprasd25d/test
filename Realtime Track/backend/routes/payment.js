const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Ride = require('../models/Ride');
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

/**
 * Handle successful payment logic (Internal Accounting + Sockets)
 * Reusable for both client verify and server webhook
 */
const handlePaymentSuccess = async (ride, paymentDetails, io) => {
    if (ride.paymentStatus === 'PAID') return; // Already processed

    const rideId = ride.rideId;

    // Update ride with payment details
    ride.paymentStatus = 'PAID';
    ride.razorpayDetails = {
        ...ride.razorpayDetails,
        ...paymentDetails,
        paidAt: new Date()
    };
    await ride.save();

    console.log(`✅ Payment success processed for ${rideId}`);

    // PHASE 2: INTERNAL ACCOUNTING (SPLIT LOGIC)
    if (ride.driverId && ride.price > 0) {
        try {
            const technician = await Technician.findOne({ userId: ride.driverId });
            if (technician) {
                const techEarning = Math.floor(ride.price * 0.8);
                const companyComm = ride.price - techEarning;

                technician.wallet.balance += techEarning;
                technician.stats.todayEarnings += techEarning;
                await technician.save();

                await Transaction.create({
                    technician: ride.driverId,
                    type: 'credit',
                    amount: techEarning,
                    description: `Earning for job ${rideId} (80% share)`,
                    job: ride._id,
                    status: 'completed',
                    metadata: {
                        paymentMethod: 'Razorpay',
                        totalAmount: ride.price,
                        companyCommission: companyComm
                    }
                });
                console.log(`💰 Split complete for ${rideId}: Tech +₹${techEarning}`);
            }
        } catch (err) {
            console.error('❌ Accounting Error:', err);
        }
    }

    // SOCKET EMITS
    if (ride.completionOtp) {
        io.to(`user:${ride.customerId}`).emit('payment:success', {
            rideId,
            completionOtp: ride.completionOtp
        });
    }

    io.to(`ride:${rideId}`).emit('payment:verified', {
        rideId,
        message: 'Payment received. Customer has the completion code.'
    });

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
};

// Create Razorpay order for customer payment (both prepaid and postpaid)
router.post('/create-order', async (req, res) => {
    try {
        const { rideId, amount } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found' });
        }

        const finalAmount = amount || ride.price || 0;
        if (finalAmount < 1) {
            return res.status(400).json({ success: false, error: 'Payment amount must be at least ₹1' });
        }

        const options = {
            amount: Math.round(finalAmount * 100), // amount in paise
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

        const io = req.app.get('io');
        await handlePaymentSuccess(ride, {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        }, io);

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

// Razorpay Webhook (Production Level State Recovery)
router.post('/webhook', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
        const signature = req.headers['x-razorpay-signature'];

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('⚠️ Invalid Webhook Signature');
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        console.log(`🔔 Webhook Event: ${event} | Order: ${payload.order_id}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const ride = await Ride.findOne({ 'razorpayDetails.orderId': payload.order_id });

            if (ride) {
                const io = req.app.get('io');
                await handlePaymentSuccess(ride, {
                    paymentId: payload.id,
                    orderId: payload.order_id
                }, io);
                console.log(`✅ Webhook processed success for ride: ${ride.rideId}`);
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
