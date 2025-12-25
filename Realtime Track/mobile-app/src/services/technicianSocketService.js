/**
 * Technician Socket Service
 * 
 * WebSocket client for technician to receive job notifications and updates
 */

import io from 'socket.io-client';
import config from '../constants/config';
import { Alert } from 'react-native';

class TechnicianSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.onJobRequest = null;
        this.onConnectionChange = null;
    }

    /**
     * Connect to WebSocket server
     * @param {function} onJobRequest - Callback when new job is requested
     * @param {function} onConnectionChange - Callback for connection status
     */
    connect(onJobRequest, onConnectionChange) {
        if (this.socket) {
            this.disconnect();
        }

        this.onJobRequest = onJobRequest;
        this.onConnectionChange = onConnectionChange;

        console.log('Technician connecting to socket:', config.SOCKET_URL);

        this.socket = io(config.SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 10000,
        });

        this.setupEventListeners();
        return this.socket;
    }

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Technician socket connected');
            this.isConnected = true;
            if (this.onConnectionChange) {
                this.onConnectionChange('connected');
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Technician socket disconnected');
            this.isConnected = false;
            if (this.onConnectionChange) {
                this.onConnectionChange('disconnected');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Technician socket connection error:', error);
            if (this.onConnectionChange) {
                this.onConnectionChange('error');
            }
        });

        // Listen for new job requests
        this.socket.on('ride:requested', (data) => {
            console.log('🔔 New job request received:', data);
            if (this.onJobRequest) {
                this.onJobRequest(data);
            }
        });

        // Listen for job cancellations
        this.socket.on('ride:cancelled', (data) => {
            console.log('❌ Job cancelled:', data);
        });
    }

    /**
     * Emit technician location update
     */
    sendLocation(rideId, location) {
        if (this.socket && this.isConnected) {
            this.socket.emit('driver:location', {
                rideId,
                ...location
            });
        }
    }

    /**
     * Get socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            console.log('Disconnecting technician socket');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}

export default new TechnicianSocketService();
