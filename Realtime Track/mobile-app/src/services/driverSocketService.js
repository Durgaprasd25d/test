/**
 * Driver Socket Service
 * 
 * WebSocket client for driver to send location updates
 */

import io from 'socket.io-client';
import config from '../constants/config';

class DriverSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.rideId = null;
        this.onConnectionChange = null;
    }

    /**
     * Connect to WebSocket server
     * @param {string} rideId - Ride identifier
     * @param {function} onConnectionChange - Callback for connection status
     */
    connect(rideId, onConnectionChange) {
        if (this.socket) {
            this.disconnect();
        }

        this.rideId = rideId;
        this.onConnectionChange = onConnectionChange;

        console.log('Connecting to socket:', config.SOCKET_URL);

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

        // Connection events
        this.socket.on('connect', () => {
            console.log('Driver socket connected');
            this.isConnected = true;
            this.joinRide();
            this.notifyConnectionChange('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Driver socket disconnected:', reason);
            this.isConnected = false;
            this.notifyConnectionChange('disconnected');
        });

        this.socket.on('reconnecting', (attemptNumber) => {
            console.log('Reconnecting attempt:', attemptNumber);
            this.notifyConnectionChange('reconnecting');
        });

        this.socket.on('reconnect', () => {
            console.log('Driver socket reconnected');
            this.isConnected = true;
            this.joinRide();
            this.notifyConnectionChange('connected');
        });

        // Driver-specific events
        this.socket.on('driver:joined', (data) => {
            console.log('Driver joined ride:', data);
        });

        this.socket.on('driver:location:ack', (data) => {
            // Location update acknowledged by server
            // console.log('Location acknowledged:', data);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('warning', (warning) => {
            console.warn('Socket warning:', warning);
        });

        // Connection errors
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            this.notifyConnectionChange('error');
        });

        this.socket.on('connect_timeout', () => {
            console.error('Connection timeout');
            this.notifyConnectionChange('error');
        });
    }

    /**
     * Join ride room
     */
    joinRide() {
        if (!this.socket || !this.rideId) return;

        this.socket.emit('driver:join', { rideId: this.rideId });
        console.log('Driver joining ride:', this.rideId);
    }

    /**
     * Send location update to server
     * @param {object} locationData - { lat, lng, bearing, speed, timestamp }
     */
    sendLocation(locationData) {
        if (!this.socket || !this.isConnected || !this.rideId) {
            console.warn('Cannot send location: Not connected');
            return false;
        }

        this.socket.emit('driver:location:update', {
            rideId: this.rideId,
            ...locationData,
        });

        return true;
    }

    /**
     * Notify connection status change
     */
    notifyConnectionChange(status) {
        if (this.onConnectionChange) {
            this.onConnectionChange(status);
        }
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.emit('leave:ride');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.rideId = null;
            console.log('Driver socket disconnected');
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected ? 'connected' : 'disconnected';
    }
    /**
     * Get the underlying socket instance
     */
    getSocket() {
        return this.socket;
    }
}

export default new DriverSocketService();
