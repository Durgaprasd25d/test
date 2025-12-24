/**
 * Location Interpolation Utility
 * 
 * Smooth coordinate interpolation for marker animation
 */

/**
 * Interpolate between two coordinates over time
 * @param {object} start - { latitude, longitude }
 * @param {object} end - { latitude, longitude }
 * @param {number} progress - Progress value 0-1
 * @returns {object} Interpolated coordinate
 */
export function interpolateCoordinate(start, end, progress) {
    // Clamp progress between 0 and 1
    const t = Math.max(0, Math.min(1, progress));

    return {
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
    };
}

/**
 * Create interpolation function for smooth animation
 * @param {object} start - Starting coordinate
 * @param {object} end - Ending coordinate
 * @param {number} duration - Animation duration in ms
 * @returns {function} Function that takes elapsed time and returns interpolated coordinate
 */
export function createInterpolator(start, end, duration) {
    return (elapsedTime) => {
        const progress = Math.min(elapsedTime / duration, 1);
        return interpolateCoordinate(start, end, easeInOutQuad(progress));
    };
}

/**
 * Interpolate bearing (rotation) with shortest path
 * @param {number} start - Starting bearing in degrees
 * @param {number} end - Ending bearing in degrees
 * @param {number} progress - Progress value 0-1
 * @returns {number} Interpolated bearing
 */
export function interpolateBearing(start, end, progress) {
    // Normalize angles to 0-360
    let startAngle = start % 360;
    let endAngle = end % 360;

    if (startAngle < 0) startAngle += 360;
    if (endAngle < 0) endAngle += 360;

    // Find shortest rotation direction
    let diff = endAngle - startAngle;

    if (diff > 180) {
        diff -= 360;
    } else if (diff < -180) {
        diff += 360;
    }

    const result = startAngle + diff * progress;
    return (result + 360) % 360;
}

/**
 * Easing function for smooth animation (ease-in-out)
 * @param {number} t - Progress 0-1
 * @returns {number} Eased progress 0-1
 */
function easeInOutQuad(t) {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Linear easing (no easing)
 * @param {number} t - Progress 0-1
 * @returns {number} Same progress 0-1
 */
export function easeLinear(t) {
    return t;
}

/**
 * Ease out cubic for camera movement
 * @param {number} t - Progress 0-1
 * @returns {number} Eased progress 0-1
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
