const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        console.log('Dashboard request - userId:', userId);
        if (!userId) {
            console.error('Dashboard error: No userId provided');
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const technician = await Technician.getOrCreate(userId);
        console.log('Technician profile:', technician ? 'Found/Created' : 'Error');

        // Get active job from Ride model
        const activeRide = await Ride.findOne({
            driverId: userId,
            status: { $in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] }
        }).populate('customerId', 'name mobile');

        res.json({
            success: true,
            data: {
                todayEarnings: technician.stats.todayEarnings,
                completedJobs: technician.stats.completedJobs,
                targetJobs: 10,
                activeJob: activeRide ? {
                    id: activeRide.rideId,
                    serviceType: activeRide.serviceType,
                    location: activeRide.pickup.address,
                    status: activeRide.status,
                    earnings: Math.round((activeRide.price || 1000) * 0.8) // 80% to technician
                } : null,
                isOnline: technician.isOnline,
                wallet: {
                    balance: technician.wallet.balance,
                    commissionDue: technician.wallet.commissionDue,
                    codLimit: technician.wallet.codLimit
                }
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle online/offline status
router.put('/online-status', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { isOnline, location } = req.body;

        console.log('📡 Online status update:', { userId, isOnline, location });

        const updateData = { isOnline };

        // Update location if provided
        if (location && location.lat && location.lng) {
            updateData['currentLocation.lat'] = location.lat;
            updateData['currentLocation.lng'] = location.lng;
            updateData['currentLocation.address'] = location.address || 'Current Location';
            updateData['currentLocation.lastUpdated'] = new Date();
            console.log('✅ Location being saved:', { lat: location.lat, lng: location.lng });
        }

        const technician = await Technician.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true }
        );

        console.log('👤 Technician updated:', {
            userId: technician.userId,
            isOnline: technician.isOnline,
            hasLocation: !!(technician.currentLocation?.lat && technician.currentLocation?.lng)
        });

        res.json({
            success: true,
            isOnline: technician.isOnline
        });
    } catch (error) {
        console.error('Online status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all online technicians (for customer map)
router.get('/online', async (req, res) => {
    try {
        const technicians = await Technician.find({
            isOnline: true,
            'currentLocation.lat': { $exists: true, $ne: null },
            'currentLocation.lng': { $exists: true, $ne: null }
        })
            .select('userId profile currentLocation')
            .lean();

        console.log(`🔍 Found ${technicians.length} online technicians with locations`);

        const formattedTechnicians = technicians.map(tech => ({
            id: tech.userId,
            name: tech.profile?.name || 'Technician',
            location: {
                lat: tech.currentLocation.lat,
                lng: tech.currentLocation.lng
            },
            address: tech.currentLocation.address || 'Current Location'
        }));

        res.json({
            success: true,
            technicians: formattedTechnicians
        });
    } catch (error) {
        console.error('Get online technicians error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Accept job
router.post('/jobs/accept', async (req, res) => {
    try {
        const { jobId, technicianId } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'pending') {
            return res.status(400).json({ error: 'Job already accepted' });
        }

        const technician = await Technician.getOrCreate(technicianId);

        // COD DISABLED - No limit check needed
        // if (job.paymentMethod === 'COD' && technician.wallet.commissionDue >= technician.wallet.codLimit) {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'COD_LIMIT_EXCEEDED',
        //         message: 'Please clear pending company dues to accept cash jobs.'
        //     });
        // }

        job.technician = technicianId;
        job.status = 'accepted';
        job.timeline.acceptedAt = new Date();
        job.generateOTP();
        await job.save();

        res.json({
            success: true,
            job: {
                id: job._id,
                serviceType: job.serviceType,
                location: job.location.address,
                distance: job.distance,
                duration: job.duration,
                eta: job.eta,
                customerPhone: job.customerPhone,
                earnings: job.pricing.technicianEarnings,
                otp: job.otp
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update job status
router.put('/jobs/:jobId/status', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, location } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        job.status = status;

        // Update timeline
        if (status === 'arrived') {
            job.timeline.arrivedAt = new Date();
        } else if (status === 'in_progress') {
            job.timeline.startedAt = new Date();
        } else if (status === 'completed') {
            job.timeline.completedAt = new Date();
        }

        await job.save();

        res.json({
            success: true,
            status: job.status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP and complete payment
router.post('/jobs/:jobId/verify-otp', async (req, res) => {
    try {
        const { jobId } = req.params;
        const { otp } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark payment as verified
        job.paymentStatus = 'verified';
        job.status = 'completed';
        job.timeline.completedAt = new Date();
        await job.save();

        // Update technician wallet and stats
        const technician = await Technician.findOne({ userId: job.technician });
        if (technician) {
            const earnings = job.pricing.technicianEarnings;
            const commission = job.pricing.commission;

            // ONLINE ONLY: Clean wallet credit
            // COD logic disabled
            // if (job.paymentMethod === 'COD') {
            //     technician.wallet.balance += earnings;
            //     technician.wallet.commissionDue += commission;
            // } else {
            // Online Payment: Simple credit
            technician.wallet.balance += earnings;
            console.log(`💰 Online Payment: Technician earned ₹${earnings}`);
            // }

            // Update stats
            technician.stats.todayEarnings += earnings;
            technician.stats.completedJobs += 1;
            technician.stats.totalJobs += 1;

            await technician.save();

            // Create credit transaction for earnings
            await Transaction.create({
                technician: job.technician,
                type: 'credit',
                amount: earnings,
                description: `Job #${job._id.toString().substring(0, 8)} (${job.paymentMethod})`,
                job: job._id,
                status: 'completed'
            });

            // Create debit transaction recording the commission tracking
            await Transaction.create({
                technician: job.technician,
                type: 'debit',
                amount: commission,
                description: `Company Commission #${job._id.toString().substring(0, 8)}`,
                job: job._id,
                status: 'completed' // All payments are online now
            });
        }

        res.json({
            success: true,
            earnings: job.pricing.technicianEarnings,
            commission: job.pricing.commission,
            total: job.pricing.total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get job history
router.get('/history', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const limit = parseInt(req.query.limit) || 20;

        const rides = await Ride.find({
            driverId: userId,
            status: 'COMPLETED'
        })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('serviceType pickup price status updatedAt');

        const formattedJobs = rides.map(ride => ({
            id: ride.rideId,
            serviceType: ride.serviceType,
            location: ride.pickup.address,
            status: ride.status,
            earnings: Math.round((ride.price || 1000) * 0.8),
            date: new Date(ride.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        }));

        res.json({
            success: true,
            jobs: formattedJobs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
