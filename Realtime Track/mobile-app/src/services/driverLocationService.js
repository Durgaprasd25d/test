/**
 * Driver Location Service
 * 
 * Manages location tracking for drivers with high accuracy,
 * background updates, and distance-based throttling
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { calculateBearing } from '../utils/mapUtils';
import config from '../constants/config';

const BACKGROUND_TASK = config.BACKGROUND_TASK_NAME;

class DriverLocationService {
    constructor() {
        this.isTracking = false;
        this.locationSubscription = null;
        this.lastLocation = null;
        this.onLocationUpdate = null;
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
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: config.DRIVER_LOCATION_INTERVAL,
                    distanceInterval: config.DRIVER_DISTANCE_FILTER,
                    mayShowUserSettingsDialog: true,
                },
                (location) => {
                    this.handleLocationUpdate(location);
                }
            );

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
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Location permission not granted');
            }

            // Start background location task
            await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: config.DRIVER_LOCATION_INTERVAL,
                distanceInterval: config.DRIVER_DISTANCE_FILTER,
                foregroundService: {
                    notificationTitle: 'Driver Tracking Active',
                    notificationBody: 'Sharing your location with customers',
                    notificationColor: '#4CAF50',
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: true,
            });

            console.log('Background location tracking started');
            return true;
        } catch (error) {
            console.error('Error starting background tracking:', error);
            throw error;
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

            // Stop background tracking
            const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
            if (isTaskRegistered) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
            }

            this.isTracking = false;
            this.lastLocation = null;
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

        if (this.onLocationUpdate) {
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

// Define background task (must be defined at top level)
TaskManager.defineTask(BACKGROUND_TASK, ({ data, error }) => {
    if (error) {
        console.error('Background location error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        if (locations && locations.length > 0) {
            const location = locations[0];
            console.log('Background location update:', location.coords);

            // Emit to socket or store locally
            // This will be connected to socket service in the component
        }
    }
});

export default new DriverLocationService();
