const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');

// Request a ride
router.post('/request', async (req, res) => {
    try {
        const { pickup, destination } = req.body;
        const rideId = `ride_${Date.now()}`;

        const ride = new Ride({
            rideId,
            pickup,
            destination,
            status: 'REQUESTED'
        });

        await ride.save();

        const io = req.app.get('io');
        // Broadcast to all potential drivers (joining no specific room yet)
        io.emit('ride:requested', { rideId, pickup, destination });

        res.json({ success: true, data: ride });
    } catch (error) {
        console.error('Ride request error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get pending rides (for drivers)
router.get('/pending', async (req, res) => {
    try {
        const rides = await Ride.find({ status: 'REQUESTED' }).sort({ timestamp: -1 });
        res.json({ success: true, data: rides });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Accept a ride
router.post('/accept', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride || ride.status !== 'REQUESTED') {
            return res.status(404).json({ success: false, error: 'Ride no longer available' });
        }

        ride.status = 'ACCEPTED';
        ride.driverId = driverId;
        await ride.save();

        const io = req.app.get('io');
        // Notify the specific customer room
        // Rooms use ride:rideId format now
        io.to(`ride:${rideId}`).emit('ride:accepted', { rideId, driverId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the ride
router.post('/start', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId, driverId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found or unauthorized' });
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

// Complete the ride
router.post('/complete', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId, driverId });
        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found or unauthorized' });
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

module.exports = router;
