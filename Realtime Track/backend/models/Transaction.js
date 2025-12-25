const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'completed'
    },
    metadata: {
        paymentMethod: String,
        transactionId: String
    }
}, {
    timestamps: true
});

// Index for performance
transactionSchema.index({ technician: 1, createdAt: -1 });
transactionSchema.index({ job: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
