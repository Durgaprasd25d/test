/**
 * Socket.IO Location Event Handlers
 * 
 * Manages real-time WebSocket communication for driver location updates
 * and customer tracking subscriptions
 */

const locationStore = require('../services/locationStore');

/**
 * Initialize Socket.IO event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function initializeLocationSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        /**
         * User identifies themselves to join a private room
         * Event: 'identify'
         * Payload: { userId: string }
         */
        socket.on('identify', (data) => {
            const { userId, role } = data;
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`User ${userId} identified and joined room user:${userId}`);
            }
            if (role === 'admin') {
                socket.join('admin:live_tracking');
                console.log(`Admin ${socket.id} joined global tracking room`);
            }
        });

        /**
         * Driver joins a ride room
         * Event: 'driver:join'
         * Payload: { rideId: string }
         */
        socket.on('driver:join', (data) => {
            const { rideId } = data;

            if (!rideId) {
                socket.emit('error', { message: 'Missing rideId' });
                return;
            }

            socket.join(`ride:${rideId}`);
            socket.rideId = rideId;
            socket.role = 'driver';

            console.log(`Driver ${socket.id} joined ride ${rideId}`);

            socket.emit('driver:joined', {
                success: true,
                rideId,
                message: 'Successfully joined ride',
            });
        });

        /**
         * Driver sends location update
         * Event: 'driver:location:update'
         * Payload: { rideId: string, lat: number, lng: number, bearing: number, speed: number, timestamp: number }
         */
        socket.on('driver:location:update', async (data) => {
            try {
                const { rideId, lat, lng, bearing, speed, timestamp } = data;

                // Validate data
                if (!rideId || lat === undefined || lng === undefined) {
                    socket.emit('error', { message: 'Invalid location data' });
                    return;
                }

                // Validate coordinates
                if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    socket.emit('error', { message: 'Invalid coordinates' });
                    return;
                }

                const locationData = {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    bearing: bearing !== undefined ? parseFloat(bearing) : 0,
                    speed: speed !== undefined ? parseFloat(speed) : 0,
                    timestamp: timestamp || Date.now(),
                };

                // Stale check log
                if (timestamp && (Date.now() - timestamp) > 30000) {
                    console.log(`⚠️ STALE rejected: ${rideId}, age: ${Date.now() - timestamp}ms`);
                }

                // Store location
                const success = await locationStore.setLocation(rideId, locationData);

                if (!success) {
                    socket.emit('warning', { message: 'Stale location rejected' });
                    return;
                }

                console.log(`📤 BROADCASTING to ride:${rideId}:`, locationData.lat, locationData.lng);

                // Broadcast to all customers in this ride room
                io.to(`ride:${rideId}`).emit('customer:location:update', {
                    rideId,
                    location: locationData,
                });

                // ALSO: Broadcast to Admin Global Tracking Room
                io.to('admin:live_tracking').emit('admin:location:update', {
                    rideId,
                    location: locationData,
                });

                // Optional: Send acknowledgment to driver
                socket.emit('driver:location:ack', {
                    success: true,
                    timestamp: Date.now(),
                });

            } catch (error) {
                console.error('Error processing location update:', error);
                socket.emit('error', { message: 'Failed to process location' });
            }
        });

        /**
         * Customer joins a ride room to track driver
         * Event: 'customer:join'
         * Payload: { rideId: string }
         */
        socket.on('customer:join', async (data) => {
            const { rideId } = data;

            if (!rideId) {
                socket.emit('error', { message: 'Missing rideId' });
                return;
            }

            socket.join(`ride:${rideId}`);
            socket.rideId = rideId;
            socket.role = 'customer';

            console.log(`Customer ${socket.id} joined ride ${rideId}`);

            // Send latest location immediately if available
            const location = await locationStore.getLocation(rideId);

            socket.emit('customer:joined', {
                success: true,
                rideId,
                location: location || null,
                message: location ? 'Tracking driver' : 'Waiting for driver location',
            });
        });

        /**
         * Customer requests latest location (manual refresh)
         * Event: 'customer:request:location'
         * Payload: { rideId: string }
         */
        socket.on('customer:request:location', async (data) => {
            const { rideId } = data;

            if (!rideId) {
                socket.emit('error', { message: 'Missing rideId' });
                return;
            }

            const location = await locationStore.getLocation(rideId);

            socket.emit('customer:location:update', {
                rideId,
                location: location || null,
            });
        });

        /**
         * Driver or customer leaves ride
         * Event: 'leave:ride'
         */
        socket.on('leave:ride', () => {
            if (socket.rideId) {
                socket.leave(`ride:${socket.rideId}`);
                console.log(`${socket.role} ${socket.id} left ride ${socket.rideId}`);
                socket.rideId = null;
                socket.role = null;
            }
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Auto-cleanup ride rooms on disconnect
            if (socket.rideId) {
                socket.leave(`ride:${socket.rideId}`);
            }
        });

        /**
         * Handle connection errors
         */
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    console.log('Socket.IO location handlers initialized');
}

module.exports = initializeLocationSocket;
