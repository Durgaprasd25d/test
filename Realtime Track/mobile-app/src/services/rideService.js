import axios from 'axios';
import config from '../constants/config';

const API_URL = `${config.BACKEND_URL}/api/ride`;

const rideService = {
    /**
     * Request a ride
     */
    requestRide: async (pickup, destination) => {
        try {
            const response = await axios.post(`${API_URL}/request`, { pickup, destination });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to request ride'
            };
        }
    },

    /**
     * Get pending ride requests
     */
    getPendingRides: async () => {
        try {
            const response = await axios.get(`${API_URL}/pending`);
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch pending rides'
            };
        }
    },

    /**
     * Accept a ride request
     */
    acceptRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/accept`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to accept ride'
            };
        }
    },

    /**
     * Start the ride
     */
    startRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/start`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to start ride'
            };
        }
    },

    /**
     * Complete the ride
     */
    completeRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/complete`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to complete ride'
            };
        }
    }
};

export default rideService;
