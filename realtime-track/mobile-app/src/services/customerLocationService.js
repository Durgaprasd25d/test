/**
 * Customer Location Service
 * 
 * Receives real-time technician location updates via WebSocket,
 * buffers them, and provides interpolation for smooth 60fps rendering
 */

class CustomerLocationService {
    constructor() {
        this.locationBuffer = []; // Last 3 location points for interpolation
        this.currentLocation = null;
        this.onLocationUpdate = null;
        this.socket = null;
        this.rideId = null;
    }

    /**
     * Initialize WebSocket connection and start receiving location updates
     * @param {object} socket - Socket.IO client instance
     * @param {string} rideId - Current ride ID
     * @param {function} callback - Called with location updates
     */
    startTracking(socket, rideId, callback) {
        this.socket = socket;
        this.rideId = rideId;
        this.onLocationUpdate = callback;

        // Listen for location updates from backend
        this.socket.on('customer:location:update', (data) => {
            if (data.rideId === this.rideId && data.location) {
                this.handleLocationUpdate(data.location);
            }
        });

        // Join the ride room
        this.socket.emit('customer:join', { rideId });

        console.log(`🎯 Customer started tracking ride: ${rideId}`);
    }

    /**
     * Stop tracking and cleanup
     */
    stopTracking() {
        if (this.socket) {
            this.socket.off('customer:location:update');
            if (this.rideId) {
                this.socket.emit('leave:ride', { rideId: this.rideId });
            }
        }

        this.locationBuffer = [];
        this.currentLocation = null;
        this.onLocationUpdate = null;
        this.socket = null;
        this.rideId = null;

        console.log('🛑 Customer stopped tracking');
    }

    /**
     * Handle incoming location update
     * @param {object} location - {lat, lng, bearing, speed, timestamp}
     */
    handleLocationUpdate(location) {
        // Add to buffer
        this.locationBuffer.push({
            ...location,
            receivedAt: Date.now(), // When we received it
        });

        // Sort by timestamp (handle out-of-order)
        this.locationBuffer.sort((a, b) => a.timestamp - b.timestamp);

        // Keep only last 3 points
        if (this.locationBuffer.length > 3) {
            this.locationBuffer.shift();
        }

        // Update current location
        this.currentLocation = location;

        // Notify callback with the latest location
        if (this.onLocationUpdate) {
            this.onLocationUpdate({
                lat: location.lat,
                lng: location.lng,
                bearing: location.bearing || 0,
                speed: location.speed || 0,
                timestamp: location.timestamp,
            });
        }

        console.log(`📍 Customer received location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
    }

    /**
     * Get interpolated position between two points
     * @param {number} progress - 0 to 1 (animation progress)
     * @param {object} pointA - Start point {lat, lng}
     * @param {object} pointB - End point {lat, lng}
     * @returns {object} Interpolated {lat, lng}
     */
    interpolate(progress, pointA, pointB) {
        if (!pointA || !pointB) return pointA || pointB || { lat: 0, lng: 0 };

        const t = Math.max(0, Math.min(1, progress)); // Clamp 0-1

        return {
            lat: pointA.lat + (pointB.lat - pointA.lat) * t,
            lng: pointA.lng + (pointB.lng - pointA.lng) * t,
        };
    }

    /**
     * Get buffer points for manual interpolation
     * @returns {array} Location buffer
     */
    getBuffer() {
        return this.locationBuffer;
    }

    /**
     * Get current technician location
     * @returns {object|null} Latest location
     */
    getCurrentLocation() {
        return this.currentLocation;
    }

    /**
     * Request latest location (manual refresh)
     */
    requestLocation() {
        if (this.socket && this.rideId) {
            this.socket.emit('customer:request:location', { rideId: this.rideId });
        }
    }
}

// Export singleton instance
const customerLocationService = new CustomerLocationService();
export default customerLocationService;
