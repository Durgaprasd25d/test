/**
 * Application Configuration
 * 
 * Centralized config for backend URLs, intervals, and thresholds
 */

// Load from .env file (create .env from .env.example)
// In Expo SDK 49+, use EXPO_PUBLIC_ prefix for automatic environment variable injection
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.241.66.236:4000';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBnA5Sw2GQC-Jt0rjH40qaGOx3vkALKWKA';
if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API Key is missing! Places suggestions will not work.');
}
const RAZORPAY_KEYID = process.env.EXPO_PUBLIC_RAZORPAY_KEYID || 'rzp_test_RxiuviHEGyiaLv';

export default {
    // Backend
    BACKEND_URL,
    SOCKET_URL: BACKEND_URL,

    // Google Maps
    GOOGLE_MAPS_API_KEY,
    RAZORPAY_KEYID,

    // Driver Location Updates
    DRIVER_LOCATION_INTERVAL: 2000, // 2 seconds (Uber-level response)
    DRIVER_DISTANCE_FILTER: 1, // 1 meter (Catch small movements)
    DRIVER_LOCATION_ACCURACY: 'highest', // Match user recommendation

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
