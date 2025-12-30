const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Technician = require('../models/Technician');


// Request a ride (Job)
router.post('/request', async (req, res) => {
    try {
        const { pickup, destination, serviceType, customerId, paymentMethod } = req.body;
        const rideId = `job_${Date.now()}`;

        const ride = new Ride({
            rideId,
            pickup,
            destination: destination || { address: 'TBD', lat: 0, lng: 0 },
            serviceType: serviceType || 'service',
            customerId,
            status: 'REQUESTED',
            paymentMethod: paymentMethod || 'COD'
        });

        await ride.save();

        const io = req.app.get('io');
        // Broadcast to all potential technicians
        io.emit('ride:requested', {
            rideId,
            pickup,
            destination,
            serviceType: ride.serviceType,
            paymentMethod: ride.paymentMethod
        });

        res.json({ success: true, data: ride });
    } catch (error) {
        console.error('Job request error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get a single ride by rideId
router.get('/:rideId', async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await Ride.findOne({ rideId }).populate('driverId');

        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found' });
        }

        // Fetch technician profile if assigned
        let technicianData = null;
        if (ride.driverId) {
            const technician = await Technician.findOne({ userId: ride.driverId._id });
            technicianData = {
                id: ride.driverId._id,
                name: ride.driverId.name,
                phone: ride.driverId.mobile,
                rating: technician?.stats?.rating || 4.5,
                location: technician?.currentLocation ? {
                    lat: technician.currentLocation.lat,
                    lng: technician.currentLocation.lng
                } : null
            };
        }

        res.json({
            success: true,
            data: {
                ...ride.toObject(),
                technician: technicianData
            }
        });
    } catch (error) {
        console.error('Fetch ride error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get pending jobs (for technicians)
router.get('/pending', async (req, res) => {
    try {
        const rides = await Ride.find({ status: 'REQUESTED' }).sort({ createdAt: -1 });
        res.json({ success: true, data: rides });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Accept a job
router.post('/accept', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride || (ride.status !== 'REQUESTED' && ride.status !== 'ACCEPTED')) {
            return res.status(404).json({ success: false, error: 'Job no longer available' });
        }

        const technician = await Technician.getOrCreate(driverId);

        // Uber-style Enforcement: Check if COD is blocked
        if (ride.paymentMethod === 'COD' && technician.wallet.commissionDue >= technician.wallet.codLimit) {
            return res.status(403).json({
                success: false,
                error: 'COD_LIMIT_EXCEEDED',
                message: 'Please clear pending company dues to accept cash jobs.'
            });
        }

        // Generate 4-digit Entrance OTP
        const arrivalOtp = Math.floor(1000 + Math.random() * 9000).toString();

        ride.status = 'ACCEPTED';
        ride.driverId = driverId;
        ride.arrivalOtp = arrivalOtp;
        await ride.save();

        // Use population to get technician user details
        const populatedRide = await Ride.findOne({ rideId }).populate('driverId');

        // Fetch technician-specific profile info (already fetched on line 100)

        const technicianData = {
            id: driverId,
            name: populatedRide.driverId?.name || 'Professional Technician',
            phone: populatedRide.driverId?.mobile || null,
            rating: technician?.stats?.rating || 4.5,
            location: technician?.currentLocation ? {
                lat: technician.currentLocation.lat,
                lng: technician.currentLocation.lng
            } : null
        };

        console.log('✅ Technician accepted job:', rideId, '| Entrance OTP:', arrivalOtp);

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:accepted', {
            rideId,
            driverId,
            technician: technicianData,
            arrivalOtp // Send OTP to customer
        });

        res.json({ success: true, data: { ...ride.toObject(), technician: technicianData } });
    } catch (error) {
        console.error('❌ Accept job error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Verify Arrival OTP (Entrance)
router.post('/verify-arrival', async (req, res) => {
    try {
        const { rideId, otp } = req.body;
        const ride = await Ride.findOne({ rideId });

        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        if (ride.arrivalOtp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid Entrance OTP' });
        }

        ride.status = 'ARRIVED';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:arrived', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the service
router.post('/start-service', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.status = 'IN_PROGRESS';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:in_progress', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update payment method
router.post('/update-payment-method', async (req, res) => {
    try {
        const { rideId, paymentMethod } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.paymentMethod = paymentMethod;
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('payment:method_updated', { rideId, paymentMethod });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// End the service (Complete)
router.post('/end-service', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        // Generate 5-digit Main OTP for completion
        const completionOtp = Math.floor(10000 + Math.random() * 90000).toString();
        ride.completionOtp = completionOtp;

        // If COD, we can show OTP immediately to complete.
        // If ONLINE, it remains hidden until paymentStatus is PAID.
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:service_ended', {
            rideId,
            paymentMethod: ride.paymentMethod,
            completionOtp: ride.paymentMethod === 'COD' ? completionOtp : null // Only send if COD
        });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Mock Payment Success (For Online Payment)
router.post('/payment-success', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.paymentStatus = 'PAID';
        await ride.save();

        const io = req.app.get('io');
        // Sending OTP now that payment is successful
        io.to(`ride:${rideId}`).emit('payment:success', {
            rideId,
            completionOtp: ride.completionOtp
        });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Complete the job (Verify Final OTP)
router.post('/complete', async (req, res) => {
    try {
        const { rideId, otp } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Job not found' });

        if (ride.completionOtp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid Completion OTP' });
        }

        ride.status = 'COMPLETED';
        ride.paymentStatus = 'VERIFIED';
        await ride.save();

        // Updated Uber-style Financial Logic for Ride Completion
        const technician = await Technician.findOne({ userId: ride.driverId });
        if (technician) {
            const price = ride.price || 1000; // Fallback to 1000 if not set
            const COMMISSION_RATE = 0.20;
            const commission = Math.round(price * COMMISSION_RATE);
            const earnings = price - commission;

            if (ride.paymentMethod === 'COD') {
                // Technician keeps the cash, so we mark it as owed
                technician.wallet.balance += earnings;
                technician.wallet.commissionDue += commission;
                console.log(`💰 COD Completion: Technician earned ₹${earnings}, owes ₹${commission} commission.`);
            } else {
                // Online Payment: Auto-recovery logic
                if (technician.wallet.commissionDue > 0) {
                    const recoverableAmount = Math.min(technician.wallet.commissionDue, earnings);
                    technician.wallet.commissionDue -= recoverableAmount;
                    const remainingEarnings = earnings - recoverableAmount;
                    technician.wallet.balance += remainingEarnings;
                    console.log(`🏦 Online Completion: Recovered ₹${recoverableAmount} from dues.`);
                } else {
                    technician.wallet.balance += earnings;
                }
            }

            // Update stats
            technician.stats.todayEarnings += earnings;
            technician.stats.completedJobs += 1;
            technician.stats.totalJobs += 1;
            await technician.save();
        }

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:completed', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


// Get job history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query;

        let query = { status: 'COMPLETED' };
        if (role === 'driver') {
            query.driverId = userId;
        } else {
            query.customerId = userId;
        }

        const history = await Ride.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
