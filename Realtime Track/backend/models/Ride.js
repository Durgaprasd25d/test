const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
    rideId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    pickup: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    destination: {
        address: { type: String }, // Optional for AC service
        lat: { type: Number },
        lng: { type: Number }
    },
    serviceType: {
        type: String,
        enum: ['repair', 'service', 'install', 'emergency'],
        default: 'service'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'REQUESTED'
    },
    arrivalOtp: {
        type: String,
        default: null
    },
    completionOtp: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'VERIFIED'],
        default: 'PENDING'
    },
    price: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', RideSchema);
