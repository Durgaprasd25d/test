/**
 * Location Store - Zustand State Management
 * 
 * Manages driver location, connection status, and tracking state
 */

import { create } from 'zustand';

const useLocationStore = create((set, get) => ({
    // Driver location data
    currentLocation: null,
    previousLocation: null,

    // Connection status
    isConnected: false,
    connectionStatus: 'disconnected', // disconnected, connecting, connected, reconnecting

    // Tracking state
    isTracking: false,
    lastUpdateTimestamp: null,

    // Camera state
    isCameraFollowing: true,

    // Ride info
    rideId: null,
    role: null, // 'driver' or 'customer'

    // Actions
    setLocation: (location) => {
        const current = get().currentLocation;
        set({
            previousLocation: current,
            currentLocation: location,
            lastUpdateTimestamp: Date.now(),
        });
    },

    setConnectionStatus: (status) => {
        set({
            connectionStatus: status,
            isConnected: status === 'connected',
        });
    },

    setTracking: (isTracking) => {
        set({ isTracking });
    },

    setCameraFollowing: (following) => {
        set({ isCameraFollowing: following });
    },

    setRideInfo: (rideId, role) => {
        set({ rideId, role });
    },

    reset: () => {
        set({
            currentLocation: null,
            previousLocation: null,
            isConnected: false,
            connectionStatus: 'disconnected',
            isTracking: false,
            lastUpdateTimestamp: null,
            rideId: null,
            role: null,
        });
    },

    // Computed values
    isLocationStale: () => {
        const { lastUpdateTimestamp } = get();
        if (!lastUpdateTimestamp) return true;
        return Date.now() - lastUpdateTimestamp > 30000; // 30 seconds
    },
}));

export default useLocationStore;
