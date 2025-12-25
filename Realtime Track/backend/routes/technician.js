const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const Job = require('../models/Job');
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

        // Get active job
        const activeJob = await Job.findOne({
            technician: userId,
            status: { $in: ['accepted', 'arrived', 'in_progress'] }
        }).populate('customer', 'name mobile');

        res.json({
            success: true,
            data: {
                todayEarnings: technician.stats.todayEarnings,
                completedJobs: technician.stats.completedJobs,
                targetJobs: 10,
                activeJob: activeJob ? {
                    id: activeJob._id,
                    serviceType: activeJob.serviceType,
                    location: activeJob.location.address,
                    duration: activeJob.duration,
                    status: activeJob.status,
                    earnings: activeJob.pricing.technicianEarnings
                } : null,
                isOnline: technician.isOnline
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
            // Add earnings to wallet
            technician.wallet.balance += job.pricing.technicianEarnings;

            // Add commission to pending
            technician.wallet.pendingCommission += job.pricing.commission;

            // Update stats
            technician.stats.todayEarnings += job.pricing.technicianEarnings;
            technician.stats.completedJobs += 1;
            technician.stats.totalJobs += 1;

            await technician.save();

            // Create credit transaction
            await Transaction.create({
                technician: job.technician,
                type: 'credit',
                amount: job.pricing.technicianEarnings,
                description: `Job #${job._id.toString().substring(0, 8)} earnings`,
                job: job._id,
                status: 'completed'
            });

            // Create pending commission transaction
            await Transaction.create({
                technician: job.technician,
                type: 'debit',
                amount: job.pricing.commission,
                description: `Commission Pending #${job._id.toString().substring(0, 8)}`,
                job: job._id,
                status: 'pending'
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

        const jobs = await Job.find({
            technician: userId,
            status: 'completed'
        })
            .sort({ 'timeline.completedAt': -1 })
            .limit(limit)
            .select('serviceType location pricing status timeline');

        const formattedJobs = jobs.map(job => ({
            id: job._id,
            serviceType: job.serviceType,
            location: job.location.address,
            status: job.status,
            earnings: job.pricing.technicianEarnings,
            date: job.timeline.completedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
