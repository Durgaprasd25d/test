import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:4000';

// Get user ID from storage
const getUserId = async () => {
    try {
        const user = await AsyncStorage.getItem('userData');
        if (!user) return null;
        const userData = JSON.parse(user);
        return userData.id || userData._id || null;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
};

// Dashboard
export const getTechnicianDashboard = async () => {
    try {
        const userId = await getUserId();
        const response = await axios.get(`${API_URL}/api/technician/dashboard`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Dashboard error:', error);
        return { success: false, error: error.message };
    }
};

// Update online/offline status
export const updateOnlineStatus = async (isOnline) => {
    try {
        const userId = await getUserId();
        if (!userId) throw new Error('User ID not found');

        let location = null;

        // Get current location when going online
        if (isOnline) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                location = {
                    lat: currentLocation.coords.latitude,
                    lng: currentLocation.coords.longitude,
                    address: 'Current Location'
                };
                console.log('Sending location with online status:', location);
            }
        }

        const response = await axios.put(`${API_URL}/api/technician/online-status?userId=${userId}`, {
            isOnline,
            location
        });
        return response.data;
    } catch (error) {
        console.error('Online status error:', error);
        return { success: false, error: error.message };
    }
};


// Job Management
export const acceptJob = async (jobId) => {
    try {
        const technicianId = await getUserId();
        const response = await axios.post(`${API_URL}/api/technician/jobs/accept`, {
            jobId,
            technicianId
        });
        return response.data;
    } catch (error) {
        console.error('Accept job error:', error);
        return { success: false, error: error.message };
    }
};

export const updateJobStatus = async (jobId, status, location = null) => {
    try {
        const response = await axios.put(`${API_URL}/api/technician/jobs/${jobId}/status`, {
            status,
            location
        });
        return response.data;
    } catch (error) {
        console.error('Update job status error:', error);
        return { success: false, error: error.message };
    }
};

export const verifyOTP = async (jobId, otp) => {
    try {
        const response = await axios.post(`${API_URL}/api/technician/jobs/${jobId}/verify-otp`, {
            otp
        });
        return response.data;
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { success: false, error: error.message };
    }
};

export const getJobHistory = async (filters = {}) => {
    try {
        const userId = await getUserId();
        const response = await axios.get(`${API_URL}/api/technician/history`, {
            params: { userId, ...filters }
        });
        return response.data;
    } catch (error) {
        console.error('Job history error:', error);
        return { success: false, error: error.message, jobs: [] };
    }
};

// Wallet Operations
export const getWallet = async () => {
    try {
        const userId = await getUserId();
        const response = await axios.get(`${API_URL}/api/wallet`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Get wallet error:', error);
        return { success: false, error: error.message };
    }
};

export const getTransactions = async (limit = 50, offset = 0) => {
    try {
        const userId = await getUserId();
        const response = await axios.get(`${API_URL}/api/wallet/transactions`, {
            params: { userId, limit, offset }
        });
        return response.data;
    } catch (error) {
        console.error('Get transactions error:', error);
        return { success: false, error: error.message };
    }
};

export const addMoney = async (amount, paymentMethod, transactionId) => {
    try {
        const userId = await getUserId();
        const response = await axios.post(`${API_URL}/api/wallet/add-money`, {
            amount,
            paymentMethod,
            transactionId
        }, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Add money error:', error);
        return { success: false, error: error.message };
    }
};

export const withdrawMoney = async (amount, bankDetails) => {
    try {
        const userId = await getUserId();
        const response = await axios.post(`${API_URL}/api/wallet/withdraw`, {
            amount,
            bankDetails
        }, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Withdraw error:', error);
        return { success: false, error: error.message };
    }
};

// Commission Management
export const getPendingCommission = async () => {
    try {
        const userId = await getUserId();
        const response = await axios.get(`${API_URL}/api/commission/pending`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Get commission error:', error);
        return { success: false, error: error.message };
    }
};

export const payCommission = async (amount, paymentMethod) => {
    try {
        const userId = await getUserId();
        const response = await axios.post(`${API_URL}/api/commission/pay`, {
            amount,
            paymentMethod
        }, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.error('Pay commission error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getTechnicianDashboard,
    updateOnlineStatus,
    acceptJob,
    updateJobStatus,
    verifyOTP,
    getJobHistory,
    getWallet,
    getTransactions,
    addMoney,
    withdrawMoney,
    getPendingCommission,
    payCommission,
};
