/**
 * Driver Location Service
 * 
 * Manages location tracking for drivers with high accuracy,
 * background updates, and distance-based throttling
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { calculateBearing, calculateDistance } from '../utils/mapUtils';
import config from '../constants/config';

const BACKGROUND_TASK = config.BACKGROUND_TASK_NAME;

class DriverLocationService {
    constructor() {
        this.isTracking = false;
        this.locationSubscription = null;
        this.lastLocation = null;
        this.onLocationUpdate = null;
        this.lastSentLocation = null;
    }

    /**
     * Request location permissions
     * @returns {Promise<boolean>} True if granted
     */
    async requestPermissions() {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                console.warn('Foreground location permission denied');
                return false;
            }

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (backgroundStatus !== 'granted') {
                console.warn('Background location permission denied');
                // Still return true as foreground is sufficient for basic tracking
            }

            return true;
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return false;
        }
    }

    /**
     * Check if location services are enabled
     * @returns {Promise<boolean>}
     */
    async isLocationEnabled() {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch (error) {
            console.error('Error checking location services:', error);
            return false;
        }
    }

    /**
     * Start tracking driver location (foreground)
     * @param {function} callback - Called with location updates
     */
    async startTracking(callback) {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            const isEnabled = await this.isLocationEnabled();
            if (!isEnabled) {
                throw new Error('Location services disabled');
            }

            this.onLocationUpdate = callback;

            // Configure high-accuracy tracking
            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest, // Increased to Highest
                    timeInterval: 1000,
                    distanceInterval: 0,
                    mayShowUserSettingsDialog: true,
                },
                (location) => {
                    console.log(`📡 GPS RAW: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)} | Acc: ${location.coords.accuracy} | Mocked: ${!!location.mocked}`);
                    this.handleLocationUpdate(location);
                }
            );

            // Manual heartbeat to "poke" GPS if watcher stalls (every 5s)
            this.heartbeatInterval = setInterval(async () => {
                if (this.isTracking) {
                    try {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                        console.log('💓 GPS HEARTBEAT:', loc.coords.latitude.toFixed(6), loc.coords.longitude.toFixed(6));
                        this.handleLocationUpdate(loc);
                    } catch (e) {
                        console.warn('GPS Heartbeat failed:', e.message);
                    }
                }
            }, 5000);

            this.isTracking = true;
            console.log('Driver location tracking started (foreground)');

            return true;
        } catch (error) {
            console.error('Error starting location tracking:', error);
            throw error;
        }
    }

    /**
     * Start background location tracking
     */
    async startBackgroundTracking() {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
            if (isRegistered) {
                console.log('Background task already registered');
                return true;
            }

            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            // Start background location task with optimized settings
            await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
                foregroundService: {
                    notificationTitle: 'Technician Online',
                    notificationBody: 'Your location is being tracked for active service.',
                    notificationColor: '#B76E79',
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
            });

            console.log('Background tracking started');
            return true;
        } catch (error) {
            console.warn('Background tracking start failed:', error.message);
            // Don't throw, let foreground tracking continue
            return false;
        }
    }

    /**
     * Stop tracking
     */
    async stopTracking() {
        try {
            if (this.locationSubscription) {
                this.locationSubscription.remove();
                this.locationSubscription = null;
            }

            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            // Stop background tracking
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
            if (isTaskRegistered) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
            }

            this.isTracking = false;
            this.lastLocation = null;
            this.lastSentLocation = null;
            this.onLocationUpdate = null;

            console.log('Location tracking stopped');
        } catch (error) {
            console.error('Error stopping location tracking:', error);
        }
    }

    /**
     * Handle location update
     * @param {object} location - Expo location object
     */
    handleLocationUpdate(location) {
        const { latitude, longitude, speed, heading } = location.coords;

        let bearing = heading;

        // If heading not available, calculate from movement
        if (bearing === -1 || bearing === null) {
            if (this.lastLocation) {
                bearing = calculateBearing(
                    { latitude: this.lastLocation.latitude, longitude: this.lastLocation.longitude },
                    { latitude, longitude }
                );
            } else {
                bearing = 0;
            }
        }

        const locationData = {
            lat: latitude,
            lng: longitude,
            bearing,
            speed: speed || 0,
            timestamp: Date.now(),
            accuracy: location.coords.accuracy,
        };

        this.lastLocation = { latitude, longitude };

        // Uber-level UX: We still recommend some filtering for the SERVER/CUSTOMER updates
        // to prevent "dancing" markers due to GPS noise.
        // However, we'll decrease the threshold to 0.5m for "Exact" feel.
        let shouldEmit = true;
        if (this.lastSentLocation) {
            const movedDistance = calculateDistance(this.lastSentLocation, { latitude, longitude });
            if (movedDistance < 0.5) { // Reduced from 2m to 0.5m for "Exact" requirement
                shouldEmit = false;
            }
        }

        if (shouldEmit && this.onLocationUpdate) {
            this.lastSentLocation = { latitude, longitude };
            this.onLocationUpdate(locationData);
        }
    }

    /**
     * Get current location (one-time)
     * @returns {Promise<object>} Location data
     */
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            return {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                bearing: location.coords.heading || 0,
                speed: location.coords.speed || 0,
                timestamp: Date.now(),
                accuracy: location.coords.accuracy,
            };
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }
}

// Define background task (must be defined at top level for Expo)
TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        if (locations && locations.length > 0) {
            const location = locations[0];
            const { latitude, longitude, heading, speed } = location.coords;

            console.log(`🌍 BACKGROUND GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

            // Use driverSocketService directly in background task
            // Note: Since this runs in a separate context, we must import it
            const driverSocketService = (await import('./driverSocketService')).default;

            if (driverSocketService.isConnected && driverSocketService.rideId) {
                driverSocketService.sendLocation({
                    lat: latitude,
                    lng: longitude,
                    bearing: heading || 0,
                    speed: speed || 0,
                    timestamp: Date.now(),
                    accuracy: location.coords.accuracy,
                });
            }
        }
    }
});

export default new DriverLocationService();
