/**
 * Application Configuration
 * 
 * Centralized config for backend URLs, intervals, and thresholds
 */

// Load from .env file (create .env from .env.example)
// In Expo SDK 49+, use EXPO_PUBLIC_ prefix for automatic environment variable injection
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.241.66.236:4000';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default {
    // Backend
    BACKEND_URL,
    SOCKET_URL: BACKEND_URL,

    // Google Maps
    GOOGLE_MAPS_API_KEY,

    // Driver Location Updates
    DRIVER_LOCATION_INTERVAL: 1000, // 1 second (was 2)
    DRIVER_DISTANCE_FILTER: 2, // 2 meters (was 10)
    DRIVER_LOCATION_ACCURACY: 'high', // high, balanced, low

    // Customer Polling Fallback
    POLLING_INTERVAL: 3000, // 3 seconds (was 5)

    // Animation
    MARKER_ANIMATION_DURATION: 1100, // Slightly longer than interval to ensure continuity
    CAMERA_ANIMATION_DURATION: 800, // Smoother camera follow

    // Stale Detection
    LOCATION_STALE_THRESHOLD: 15000, // 15 seconds (was 30)

    // GPS Noise Filtering
    GPS_NOISE_THRESHOLD: 1, // 1 meter (was 5) - more sensitive for smooth movement
    MAX_SPEED_THRESHOLD: 250, // km/h

    // Map Settings
    DEFAULT_ZOOM_LEVEL: 16,
    MIN_ZOOM_LEVEL: 10,
    MAX_ZOOM_LEVEL: 20,

    // Background Task
    BACKGROUND_TASK_NAME: 'DRIVER_LOCATION_TRACKING',
};
