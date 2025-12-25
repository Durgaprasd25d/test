const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Technician = require('../models/Technician');


// Request a ride (Job)
router.post('/request', async (req, res) => {
    try {
        const { pickup, destination, serviceType, customerId } = req.body;
        const rideId = `job_${Date.now()}`;

        const ride = new Ride({
            rideId,
            pickup,
            destination: destination || { address: 'TBD', lat: 0, lng: 0 },
            serviceType: serviceType || 'service',
            customerId,
            status: 'REQUESTED'
        });

        await ride.save();

        const io = req.app.get('io');
        // Broadcast to all potential technicians
        io.emit('ride:requested', {
            rideId,
            pickup,
            destination,
            serviceType: ride.serviceType
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
        if (!ride || ride.status !== 'REQUESTED') {
            return res.status(404).json({ success: false, error: 'Job no longer available' });
        }

        ride.status = 'ACCEPTED';
        ride.driverId = driverId;
        await ride.save();

        // Use population to get technician user details
        const populatedRide = await Ride.findOne({ rideId }).populate('driverId');

        console.log('📝 Updated Ride Record in DB:', JSON.stringify(ride, null, 2));

        // Fetch technician-specific profile info
        const technician = await Technician.findOne({ userId: driverId });

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

        console.log('✅ Technician accepted job:', rideId);
        console.log('📤 Sending technician data:', technicianData);

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:accepted', {
            rideId,
            driverId,
            technician: technicianData // Send full technician data
        });

        res.json({ success: true, data: ride });
    } catch (error) {
        console.error('❌ Accept job error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the job
router.post('/start', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId, driverId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Job not found or unauthorized' });
        }

        ride.status = 'STARTED';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:started', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Complete the job
router.post('/complete', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId, driverId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Job not found or unauthorized' });
        }

        ride.status = 'COMPLETED';
        await ride.save();

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
