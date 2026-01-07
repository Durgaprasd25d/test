import axios from 'axios';
import config from '../constants/config';
import authService from './authService';

const API_URL = `${config.BACKEND_URL}/api/ride`;

const rideService = {
    /**
     * Request an AC service job
     */
    requestRide: async (pickup, destination, serviceType = 'service', paymentMethod = 'ONLINE', paymentTiming = 'PREPAID') => {
        try {
            const user = await authService.getUser();
            const customerId = user?.id || user?.mobile || 'demo_user';

            const response = await axios.post(`${API_URL}/request`, {
                pickup,
                destination,
                serviceType,
                customerId,
                paymentMethod,
                paymentTiming // PREPAID or POSTPAID
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
     * Verify Arrival (Entrance)
     */
    verifyArrival: async (rideId, otp) => {
        try {
            const response = await axios.post(`${API_URL}/verify-arrival`, { rideId, otp });
            return response.data;
        } catch (error) {
            return { success: false, error: 'Entrance verification failed' };
        }
    },

    /**
     * Start the service job
     */
    startService: async (rideId) => {
        try {
            const response = await axios.post(`${API_URL}/start-service`, { rideId });
            return response.data;
        } catch (error) {
            return { success: false, error: 'Failed to start service' };
        }
    },

    /**
     * End the service (Generate Completion OTP)
     */
    endService: async (rideId) => {
        try {
            const response = await axios.post(`${API_URL}/end-service`, { rideId });
            return response.data;
        } catch (error) {
            return { success: false, error: 'Failed to end service' };
        }
    },

    /**
     * Complete the service job (Verify Final OTP)
     */
    completeRide: async (rideId, otp) => {
        try {
            const response = await axios.post(`${API_URL}/complete`, { rideId, otp });
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
    },

    /**
     * Create Razorpay order for payment (PREPAID or POSTPAID)
     */
    createRazorpayOrder: async (rideId, amount) => {
        try {
            const response = await axios.post(`${config.BACKEND_URL}/api/payment/create-order`, {
                rideId,
                amount
            });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create payment order'
            };
        }
    },

    /**
     * Verify Razorpay payment
     */
    verifyRazorpayPayment: async (rideId, paymentData) => {
        try {
            const response = await axios.post(`${config.BACKEND_URL}/api/payment/verify-payment`, {
                rideId,
                ...paymentData
            });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Payment verification failed'
            };
        }
    },
    /**
     * Get the current active ride for a customer
     */
    getCurrentRide: async (customerId) => {
        try {
            let finalId = customerId;
            if (!finalId) {
                const user = await authService.getUser();
                finalId = user?.id || user?._id || user?.mobile;
            }
            if (!finalId) return { success: true, data: null };

            const response = await axios.get(`${API_URL}/current/${finalId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching current ride:', error);
            return { success: false, error: 'Failed to fetch current ride' };
        }
    }
};

export default rideService;
