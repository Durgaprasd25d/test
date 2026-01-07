/**
 * Customer Socket Service
 * 
 * WebSocket client for customer to receive driver location updates
 */

import io from 'socket.io-client';
import config from '../constants/config';

class CustomerSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.rideId = null;
        this.userId = null;
        this.onLocationUpdate = null;
        this.onConnectionChange = null;
        this.onRideCompleted = null;
        this.onRideCancelled = null;
    }

    /**
     * Connect to WebSocket server
     * @param {string} rideId - Ride identifier (optional)
     * @param {function} onLocationUpdate - Callback for location updates
     * @param {function} onConnectionChange - Callback for connection status
     * @param {string} userId - User identifier for private room (optional)
     */
    connect(rideId, onLocationUpdate, onConnectionChange, userId) {
        if (this.socket) {
            // If already connected with same IDs, don't reconnect
            if (this.rideId === rideId && this.userId === userId && this.socket.connected) {
                return this.socket;
            }
            this.disconnect();
        }

        this.rideId = rideId;
        this.userId = userId;
        this.onLocationUpdate = onLocationUpdate;
        this.onConnectionChange = onConnectionChange;

        console.log('Customer connecting to socket:', config.SOCKET_URL);

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
            console.log('Customer socket connected');
            this.isConnected = true;
            this.joinRide();
            this.identifyUser();
            this.notifyConnectionChange('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Customer socket disconnected:', reason);
            this.isConnected = false;
            this.notifyConnectionChange('disconnected');

            // Uber-level UX: Force immediate manual reconnection if it wasn't a clean close
            if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                console.log('🔌 Attempting aggressive manual reconnect...');
                this.socket.connect();
            }
        });

        this.socket.on('reconnecting', (attemptNumber) => {
            console.log('Reconnecting attempt:', attemptNumber);
            this.notifyConnectionChange('reconnecting');
        });

        this.socket.on('reconnect', () => {
            console.log('Customer socket reconnected');
            this.isConnected = true;
            this.joinRide();
            this.notifyConnectionChange('connected');
        });

        // Customer-specific events
        this.socket.on('customer:joined', (data) => {
            console.log('Customer joined ride:', data);

            // If there's already a location available, notify
            if (data.location) {
                this.handleLocationUpdate(data);
            }
        });

        this.socket.on('customer:location:update', (data) => {
            this.handleLocationUpdate(data);
        });

        this.socket.on('ride:completed', (data) => {
            console.log('🏁 Ride completed event received:', data);
            if (this.onRideCompleted) this.onRideCompleted(data);
        });

        this.socket.on('ride:cancelled', (data) => {
            console.log('🚫 Ride cancelled event received:', data);
            if (this.onRideCancelled) this.onRideCancelled(data);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
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

        this.socket.emit('customer:join', { rideId: this.rideId });
        console.log('Customer joining ride:', this.rideId);
    }

    /**
     * Identify user to join private room
     */
    identifyUser() {
        if (!this.socket || !this.userId) return;
        this.socket.emit('identify', { userId: this.userId });
        console.log('Customer identified:', this.userId);
    }

    /**
     * Register global event handlers
     */
    registerHandlers(onRideCompleted, onRideCancelled) {
        this.onRideCompleted = onRideCompleted;
        this.onRideCancelled = onRideCancelled;
    }

    /**
     * Handle location update from server
     */
    handleLocationUpdate(data) {
        if (data.location && this.onLocationUpdate) {
            this.onLocationUpdate(data.location);
        }
    }

    /**
     * Request latest location manually
     */
    requestLocation() {
        if (!this.socket || !this.isConnected || !this.rideId) {
            console.warn('Cannot request location: Not connected');
            return false;
        }

        this.socket.emit('customer:request:location', { rideId: this.rideId });
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
            console.log('Customer socket disconnected');
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

export default new CustomerSocketService();
