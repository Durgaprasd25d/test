import axios from 'axios';
import config from '../constants/config';
import authService from './authService';

const API_URL = `${config.BACKEND_URL}/api/ride`;

const rideService = {
    /**
     * Request an AC service job
     */
    requestRide: async (pickup, destination, serviceType = 'service') => {
        try {
            const user = await authService.getUser();
            const customerId = user?.id || user?.mobile || 'demo_user';

            const response = await axios.post(`${API_URL}/request`, {
                pickup,
                destination,
                serviceType,
                customerId
            });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to book service'
            };
        }
    },

    /**
     * Get pending job requests (technician view)
     */
    getPendingRides: async () => {
        try {
            const response = await axios.get(`${API_URL}/pending`);
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch available jobs'
            };
        }
    },

    /**
     * Accept a service job
     */
    acceptRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/accept`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to accept job'
            };
        }
    },

    /**
     * Start the service job
     */
    startRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/start`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to start job'
            };
        }
    },

    /**
     * Complete the service job
     */
    completeRide: async (rideId, driverId) => {
        try {
            const response = await axios.post(`${API_URL}/complete`, { rideId, driverId });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to complete job'
            };
        }
    },

    /**
     * Get Job History for a user
     */
    getJobHistory: async (userId, role = 'customer') => {
        try {
            // If userId is not provided, try to get from current session
            let finalUserId = userId;
            if (!finalUserId) {
                const user = await authService.getUser();
                finalUserId = user?.id || user?.mobile || 'demo_user';
            }

            const response = await axios.get(`${API_URL}/history/${finalUserId}?role=${role}`);
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch job history'
            };
        }
    }
};

export default rideService;
