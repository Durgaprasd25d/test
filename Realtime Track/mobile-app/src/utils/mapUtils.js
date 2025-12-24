/**
 * Map Utility Functions
 * 
 * Calculations for bearing, distance, camera positioning, and GPS filtering
 */

/**
 * Calculate bearing (direction) between two coordinates
 * @param {object} start - { latitude, longitude }
 * @param {object} end - { latitude, longitude }
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(start, end) {
    const startLat = toRadians(start.latitude);
    const startLng = toRadians(start.longitude);
    const endLat = toRadians(end.latitude);
    const endLng = toRadians(end.longitude);

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    const bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {object} start - { latitude, longitude }
 * @param {object} end - { latitude, longitude }
 * @returns {number} Distance in meters
 */
export function calculateDistance(start, end) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRadians(start.latitude);
    const φ2 = toRadians(end.latitude);
    const Δφ = toRadians(end.latitude - start.latitude);
    const Δλ = toRadians(end.longitude - start.longitude);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Check if location update should be filtered as GPS noise
 * @param {object} oldLocation - Previous location
 * @param {object} newLocation - New location
 * @param {number} threshold - Minimum distance in meters
 * @returns {boolean} True if should filter out
 */
export function isGPSNoise(oldLocation, newLocation, threshold = 5) {
    if (!oldLocation || !newLocation) return false;

    const distance = calculateDistance(oldLocation, newLocation);
    return distance < threshold;
}

/**
 * Validate location update (check for unrealistic speeds)
 * @param {object} oldLocation - { latitude, longitude, timestamp }
 * @param {object} newLocation - { latitude, longitude, timestamp }
 * @param {number} maxSpeed - Maximum realistic speed in km/h
 * @returns {boolean} True if valid
 */
export function isValidLocationUpdate(oldLocation, newLocation, maxSpeed = 200) {
    if (!oldLocation || !newLocation) return true;

    const distance = calculateDistance(oldLocation, newLocation);
    const timeDiff = (newLocation.timestamp - oldLocation.timestamp) / 1000; // seconds

    if (timeDiff <= 0) return false;

    const speedKmh = (distance / timeDiff) * 3.6; // convert m/s to km/h

    return speedKmh <= maxSpeed;
}

/**
 * Get camera region for map view
 * @param {object} location - { latitude, longitude }
 * @param {number} zoomLevel - Zoom level (higher = more zoomed in)
 * @returns {object} Region with latitudeDelta and longitudeDelta
 */
export function getCameraRegion(location, zoomLevel = 16) {
    const delta = 0.01 * Math.pow(2, 16 - zoomLevel);

    return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
    };
}

/**
 * Calculate dynamic zoom based on speed
 * @param {number} speed - Speed in m/s
 * @returns {number} Zoom level
 */
export function calculateDynamicZoom(speed) {
    // Higher speed = zoom out more
    if (speed < 5) return 17; // Walking/stopped
    if (speed < 15) return 16; // City driving
    if (speed < 25) return 15; // Highway
    return 14; // Fast highway
}

/**
 * Format speed for display
 * @param {number} speed - Speed in m/s
 * @returns {string} Formatted speed with unit
 */
export function formatSpeed(speed) {
    if (!speed || speed < 0) return '0 km/h';
    const kmh = speed * 3.6;
    return `${kmh.toFixed(1)} km/h`;
}

/**
 * Format distance for display
 * @param {number} distance - Distance in meters
 * @returns {string} Formatted distance with unit
 */
export function formatDistance(distance) {
    if (!distance || distance < 0) return '0 m';
    if (distance < 1000) {
        return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
}

// Helper functions
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}
