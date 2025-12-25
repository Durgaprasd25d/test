/**
 * Polling Service (Fallback)
 * 
 * REST API polling when WebSocket is unavailable
 */

import config from '../constants/config';

class PollingService {
    constructor() {
        this.intervalId = null;
        this.isPolling = false;
        this.rideId = null;
        this.onLocationUpdate = null;
    }

    /**
     * Start polling for location updates
     * @param {string} rideId - Ride identifier
     * @param {function} onLocationUpdate - Callback for location updates
     */
    start(rideId, onLocationUpdate) {
        if (!rideId || !onLocationUpdate) {
            console.error('Cannot start polling: missing rideId or callback');
            return;
        }

        // Stop any existing polling
        this.stop();

        this.rideId = rideId;
        this.onLocationUpdate = onLocationUpdate; // Store callback
        this.isPolling = true;

        console.log(`Starting polling fallback for ride: ${rideId}`);

        // Start polling immediately, then every interval
        this.poll();
        this.intervalId = setInterval(() => this.poll(), config.POLLING_INTERVAL);
    }

    /**
     * Poll server for latest location
     */
    async poll() {
        const callback = this.onLocationUpdate;
        const currentRideId = this.rideId;

        if (!currentRideId || !callback) return;

        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/driver/location/${currentRideId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.data && this.isPolling) {
                    callback(result.data);
                }
            } else if (response.status === 404) {
                // No location data available yet
                console.log('No location data available');
            } else {
                console.warn('Polling failed:', response.status);
            }
        } catch (error) {
            console.error('Polling error:', error);
            // Continue polling despite errors
        }
    }

    /**
     * Stop polling
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isPolling = false;
        this.rideId = null;
        this.onLocationUpdate = null;

        console.log('Polling stopped');
    }

    /**
     * Check if currently polling
     */
    isPollm() {
        return this.isPolling;
    }
}

export default new PollingService();
