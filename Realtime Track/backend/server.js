/**
 * Uber-Like Driver Tracking Backend Server
 * 
 * Real-time location tracking with Socket.IO and REST API fallback
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const mongoose = require('mongoose');

// Import routes and socket handlers
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

const locationRoutes = require('./routes/location');
const rideRoutes = require('./routes/ride');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const technicianRoutes = require('./routes/technician');
const walletRoutes = require('./routes/wallet');
const commissionRoutes = require('./routes/commission');
const initializeLocationSocket = require('./sockets/locationSocket');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: '*', // In production, specify your mobile app's origin
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'], // Support both for reliability
});

// Store io in app for access in routes
app.set('io', io);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uber_tracking';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/api', locationRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/commission', commissionRoutes);

// Initialize Socket.IO handlers
initializeLocationSocket(io);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Uber-Like Driver Tracking API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            location: {
                post: '/api/driver/location',
                get: '/api/driver/location/:rideId',
                delete: '/api/driver/location/:rideId',
            },
            ride: {
                post_request: '/api/ride/request',
                get_pending: '/api/ride/pending',
                post_accept: '/api/ride/accept',
                post_start: '/api/ride/start',
                post_complete: '/api/ride/complete',
            },
            websocket: {
                events: [
                    'driver:join',
                    'driver:location:update',
                    'customer:join',
                    'customer:location:update',
                    'ride:accepted',
                    'ride:started',
                    'ride:completed',
                ],
            },
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚗 Uber-Like Tracking Server`);
    console.log('='.repeat(50));
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Server running on port ${PORT}`);
    console.log(`HTTP: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
