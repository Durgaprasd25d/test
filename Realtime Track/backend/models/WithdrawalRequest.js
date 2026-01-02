const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [100, 'Minimum withdrawal amount is ₹100']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    payoutMethod: {
        type: String,
        enum: ['bank', 'upi'],
        default: 'bank'
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        bankName: String,
        branchName: String
    },
    upiId: {
        type: String,
        default: ''
    },
    adminNote: {
        type: String,
        default: ''
    },
    transactionId: {
        type: String, // Manual or Razorpay Payout ID
        default: ''
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for search/admin view
withdrawalRequestSchema.index({ technician: 1, status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
