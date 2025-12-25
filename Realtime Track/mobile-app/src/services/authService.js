import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../constants/config';

const API_URL = `${config.BACKEND_URL}/api/auth`;

const authService = {
    register: async (data) => {
        try {
            const response = await axios.post(`${API_URL}/register`, data);
            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    },

    login: async (mobile, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { mobile, password });
            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
    },

    isLoggedIn: async () => {
        const token = await AsyncStorage.getItem('userToken');
        return !!token;
    },

    getUser: async () => {
        const user = await AsyncStorage.getItem('userData');
        return user ? JSON.parse(user) : null;
    }
};

export default authService;
