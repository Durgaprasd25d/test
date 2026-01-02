const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');

// Get wallet details
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        // Get recent transactions
        const transactions = await Transaction.find({ technician: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('job', 'serviceType');

        const formattedTransactions = transactions.map(t => ({
            id: t._id,
            type: t.type, // 'credit', 'debit', or 'settlement'
            amount: t.amount,
            description: t.description,
            date: t.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            status: t.status,
            paymentMethod: t.metadata?.paymentMethod || 'Razorpay'
        }));

        res.json({
            success: true,
            balance: technician.wallet.balance,
            commissionDue: technician.wallet.commissionDue,
            codLimit: technician.wallet.codLimit,
            transactions: formattedTransactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const transactions = await Transaction.find({ technician: userId })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add money to wallet
router.post('/add-money', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { amount, paymentMethod, transactionId } = req.body;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        // Add to wallet
        technician.wallet.balance += amount;
        await technician.save();

        // Create transaction
        await Transaction.create({
            technician: userId,
            type: 'credit',
            amount,
            description: 'Money added to wallet',
            status: 'completed',
            metadata: { paymentMethod, transactionId }
        });

        res.json({
            success: true,
            balance: technician.wallet.balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const WithdrawalRequest = require('../models/WithdrawalRequest');

// Get wallet details
// ... (lines 6-98)

// Withdraw from wallet (Request Flow)
router.post('/withdraw', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { amount, payoutMethod, bankDetails, upiId } = req.body;

        if (!amount || amount < 100) {
            return res.status(400).json({ success: false, error: 'Minimum withdrawal is ₹100' });
        }

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        // 1. Check for pending company dues
        if (technician.wallet.commissionDue > 0) {
            return res.status(400).json({
                success: false,
                error: 'DUES_PENDING',
                message: 'Please clear pending company dues (₹' + technician.wallet.commissionDue + ') before withdrawing.'
            });
        }

        // 2. Check for KYC verification (DISABLED to allow Admin Verification)
        // if (!technician.documents?.kycVerified) {
        //     return res.status(400).json({
        //         success: false,
        //         error: 'KYC_NOT_VERIFIED',
        //         message: 'Your account must be KYC verified to withdraw funds.'
        //     });
        // }

        // 3. Check for sufficient balance (considering other pending requests)
        const pendingRequests = await WithdrawalRequest.find({
            technician: userId,
            status: { $in: ['pending', 'approved'] }
        });

        const pendingTotal = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

        if (technician.wallet.balance < (pendingTotal + amount)) {
            return res.status(400).json({
                success: false,
                error: 'INSUFFICIENT_FUNDS',
                message: 'Insufficient balance. You have ₹' + (technician.wallet.balance - pendingTotal) + ' available for withdrawal.'
            });
        }

        // 4. Create Withdrawal Request
        const requestData = {
            technician: userId,
            amount,
            payoutMethod: payoutMethod || 'bank',
            status: 'pending'
        };

        if (payoutMethod === 'upi') {
            if (!upiId) return res.status(400).json({ success: false, error: 'UPI ID is required' });
            requestData.upiId = upiId;
        } else {
            if (!bankDetails?.accountNumber || !bankDetails?.ifscCode) {
                return res.status(400).json({ success: false, error: 'Complete bank details are required' });
            }
            requestData.bankDetails = bankDetails;
        }

        const withdrawal = await WithdrawalRequest.create(requestData);

        res.json({
            success: true,
            balance: technician.wallet.balance,
            availableBalance: technician.wallet.balance - pendingTotal - amount,
            withdrawalId: withdrawal._id,
            message: 'Withdrawal request submitted for admin verification.'
        });
    } catch (error) {
        console.error('Withdrawal Request Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get withdrawal requests for technician
router.get('/withdrawals', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const withdrawals = await WithdrawalRequest.find({ technician: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            withdrawals
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
