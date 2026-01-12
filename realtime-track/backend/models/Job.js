const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    location: {
        address: {
            type: String,
            required: true
        },
        coordinates: {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            }
        }
    },
    pricing: {
        baseAmount: {
            type: Number,
            required: true
        },
        gst: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        commission: {
            type: Number,
            default: 0
        },
        technicianEarnings: {
            type: Number,
            default: 0
        }
    },
    timeline: {
        requestedAt: {
            type: Date,
            default: Date.now
        },
        acceptedAt: Date,
        arrivedAt: Date,
        startedAt: Date,
        completedAt: Date,
        cancelledAt: Date
    },
    otp: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'collected', 'verified'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD'
    },
    customerPhone: String,
    distance: String,
    duration: String,
    eta: String
}, {
    timestamps: true
});

// Calculate commission and technician earnings
jobSchema.pre('save', function (next) {
    if (this.isModified('pricing.total')) {
        const COMMISSION_RATE = 0.20; // 20%
        this.pricing.commission = Math.round(this.pricing.total * COMMISSION_RATE);
        this.pricing.technicianEarnings = this.pricing.total - this.pricing.commission;
    }
    next();
});

// Generate OTP when job is accepted
jobSchema.methods.generateOTP = function () {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
    return this.otp;
};

// Indexes for performance
jobSchema.index({ technician: 1, status: 1 });
jobSchema.index({ customer: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
