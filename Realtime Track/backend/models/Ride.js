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
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    driverId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED'],
        default: 'REQUESTED'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', RideSchema);
