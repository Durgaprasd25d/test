/**
 * Location REST API Routes
 * 
 * Provides HTTP endpoints for location updates and retrieval
 * Used as fallback when WebSocket is unavailable
 */

const express = require('express');
const router = express.Router();
const locationStore = require('../services/locationStore');

/**
 * POST /api/driver/location
 * Driver sends location update via REST API
 */
router.post('/driver/location', async (req, res) => {
    try {
        const { rideId, lat, lng, bearing, speed, timestamp } = req.body;

        // Validate required fields
        if (!rideId || lat === undefined || lng === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: rideId, lat, lng',
            });
        }

        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates',
            });
        }

        const locationData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            bearing: bearing !== undefined ? parseFloat(bearing) : 0,
            speed: speed !== undefined ? parseFloat(speed) : 0,
            timestamp: timestamp || Date.now(),
        };

        const success = await locationStore.setLocation(rideId, locationData);

        if (success) {
            res.json({
                success: true,
                message: 'Location updated successfully',
                data: locationData,
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Failed to update location (may be stale)',
            });
        }
    } catch (error) {
        console.error('Error in POST /driver/location:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

/**
 * GET /api/driver/location/:rideId
 * Customer polls for latest driver location
 */
router.get('/driver/location/:rideId', async (req, res) => {
    try {
        const { rideId } = req.params;

        if (!rideId) {
            return res.status(400).json({
                success: false,
                error: 'Missing rideId parameter',
            });
        }

        const location = await locationStore.getLocation(rideId);

        if (location) {
            res.json({
                success: true,
                data: location,
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No location data available',
                message: 'Driver location not found or stale',
            });
        }
    } catch (error) {
        console.error('Error in GET /driver/location:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

/**
 * DELETE /api/driver/location/:rideId
 * Clean up location data when ride ends
 */
router.delete('/driver/location/:rideId', async (req, res) => {
    try {
        const { rideId } = req.params;

        if (!rideId) {
            return res.status(400).json({
                success: false,
                error: 'Missing rideId parameter',
            });
        }

        await locationStore.removeLocation(rideId);

        res.json({
            success: true,
            message: 'Location data removed',
        });
    } catch (error) {
        console.error('Error in DELETE /driver/location:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

module.exports = router;
