import axios from 'axios';
import config from '../constants/config';

const API_URL = `${config.BACKEND_URL}/api/technician`;

const technicianMapService = {
    /**
     * Get all online technicians for map display
     */
    getOnlineTechnicians: async () => {
        try {
            const response = await axios.get(`${API_URL}/online`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch online technicians:', error);
            return { success: false, technicians: [] };
        }
    },
};

export default technicianMapService;
