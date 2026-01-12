const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: { type: String, default: '' },
        lastUpdated: { type: Date, default: null }
    },
    stats: {
        todayEarnings: {
            type: Number,
            default: 0
        },
        completedJobs: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 5.0
        },
        totalJobs: {
            type: Number,
            default: 0
        }
    },
    wallet: {
        balance: {
            type: Number,
            default: 0
        },
        lockedAmount: {
            type: Number,
            default: 0
        },
        commissionDue: {
            type: Number,
            default: 0
        },
        codLimit: {
            type: Number,
            default: 500
        }
    },
    verification: {
        kycVerified: {
            type: Boolean,
            default: false
        },
        adminVerified: {
            type: Boolean,
            default: false
        },
        kycStatus: {
            type: String,
            enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
            default: 'NOT_STARTED'
        },
        submittedAt: Date,
        reviewedAt: Date,
        rejectionReason: String,
        documents: {
            aadhaarFront: { url: String, publicId: String },
            aadhaarBack: { url: String, publicId: String },
            panCard: { url: String, publicId: String },
            bankProof: { url: String, publicId: String }, // Passbook or Cancelled Cheque
            selfie: { url: String, publicId: String }
        },
        bankDetails: {
            accountNumber: String,
            ifscCode: String,
            accountHolderName: String,
            bankName: String,
            branchName: String
        }
    }
}, {
    timestamps: true
});

// Static method to get or create technician profile
technicianSchema.statics.getOrCreate = async function (userId) {
    let technician = await this.findOne({ userId });
    if (!technician) {
        technician = await this.create({ userId });
    }
    return technician;
};

// Method to reset daily stats (can be called by a cron job)
technicianSchema.methods.resetDailyStats = function () {
    this.stats.todayEarnings = 0;
    this.stats.completedJobs = 0;
    return this.save();
};

module.exports = mongoose.model('Technician', technicianSchema);
