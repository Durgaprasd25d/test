/**
 * Location Storage Service
 * 
 * Manages driver location data with in-memory storage (default)
 * Redis support available for production (uncomment sections below)
 */

// Uncomment for Redis support:
// const Redis = require('ioredis');
// const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

class LocationStore {
    constructor() {
        // In-memory storage: Map<rideId, locationData>
        this.locations = new Map();
        this.staleTimeout = parseInt(process.env.LOCATION_STALE_TIMEOUT) || 30000; // 30 seconds default
    }

    /**
     * Store driver location for a ride
     * @param {string} rideId - Unique ride identifier
     * @param {object} locationData - Location data with lat, lng, bearing, speed, timestamp
     * @returns {Promise<boolean>} Success status
     */
    async setLocation(rideId, locationData) {
        try {
            const now = Date.now();

            // Validate timestamp (reject stale updates)
            if (locationData.timestamp && (now - locationData.timestamp) > this.staleTimeout) {
                console.warn(`Stale location rejected for ride ${rideId}. Age: ${now - locationData.timestamp}ms`);
                return false;
            }

            const data = {
                ...locationData,
                serverTimestamp: now,
            };

            // In-memory storage
            this.locations.set(rideId, data);

            // Redis storage (uncomment if using Redis)
            // if (redis) {
            //   await redis.setex(
            //     `location:${rideId}`,
            //     60, // TTL: 60 seconds
            //     JSON.stringify(data)
            //   );
            // }

            return true;
        } catch (error) {
            console.error('Error storing location:', error);
            return false;
        }
    }

    /**
     * Get latest location for a ride
     * @param {string} rideId - Unique ride identifier
     * @returns {Promise<object|null>} Location data or null
     */
    async getLocation(rideId) {
        try {
            // Try Redis first (if available)
            // if (redis) {
            //   const redisData = await redis.get(`location:${rideId}`);
            //   if (redisData) {
            //     return JSON.parse(redisData);
            //   }
            // }

            // Fallback to in-memory
            const location = this.locations.get(rideId);

            if (!location) {
                return null;
            }

            // Check if location is stale
            const age = Date.now() - location.serverTimestamp;
            if (age > this.staleTimeout) {
                console.warn(`Stale location detected for ride ${rideId}. Age: ${age}ms`);
                this.locations.delete(rideId); // Clean up stale data
                return null;
            }

            return location;
        } catch (error) {
            console.error('Error retrieving location:', error);
            return null;
        }
    }

    /**
     * Remove location data for a ride
     * @param {string} rideId - Unique ride identifier
     */
    async removeLocation(rideId) {
        try {
            this.locations.delete(rideId);

            // if (redis) {
            //   await redis.del(`location:${rideId}`);
            // }
        } catch (error) {
            console.error('Error removing location:', error);
        }
    }

    /**
     * Clean up stale locations (run periodically)
     */
    cleanupStaleLocations() {
        const now = Date.now();
        const staleRides = [];

        for (const [rideId, location] of this.locations.entries()) {
            if (now - location.serverTimestamp > this.staleTimeout) {
                staleRides.push(rideId);
            }
        }

        staleRides.forEach(rideId => {
            this.locations.delete(rideId);
            console.log(`Cleaned up stale location for ride ${rideId}`);
        });

        return staleRides.length;
    }
}

// Singleton instance
const locationStore = new LocationStore();

// Run cleanup every 60 seconds
setInterval(() => {
    const cleaned = locationStore.cleanupStaleLocations();
    if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} stale locations`);
    }
}, 60000);

module.exports = locationStore;
