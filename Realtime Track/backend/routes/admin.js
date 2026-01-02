const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

/**
 * ADMIN: Dashboard Statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalTechnicians = await User.countDocuments({ role: 'technician' });
        const totalJobs = await Ride.countDocuments();
        const completedJobs = await Ride.countDocuments({ status: 'COMPLETED' });

        // Revenue calculations
        const rides = await Ride.find({ status: 'COMPLETED' });
        const totalRevenue = rides.reduce((sum, job) => sum + (job.price || 0), 0);
        const totalCommission = rides.reduce((sum, job) => sum + (Math.round((job.price || 0) * 0.2)), 0);

        // Wallet stats
        const techs = await Technician.find({});
        const totalWalletBalance = techs.reduce((sum, t) => sum + (t.wallet?.balance || 0), 0);
        const totalCommissionsDue = techs.reduce((sum, t) => sum + (t.wallet?.commissionDue || 0), 0);

        res.json({
            success: true,
            stats: {
                users: totalUsers,
                technicians: totalTechnicians,
                jobs: totalJobs,
                completedJobs,
                revenue: totalRevenue,
                commission: totalCommission,
                wallets: totalWalletBalance,
                dues: totalCommissionsDue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: List all technicians with details
 */
router.get('/technicians', async (req, res) => {
    try {
        const technicians = await Technician.find({})
            .populate('userId', 'name mobile role isActive');

        res.json({
            success: true,
            technicians
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Verify/unverify technician documents
 */
router.post('/technicians/:userId/verify-kyc', async (req, res) => {
    try {
        const { verified } = req.body;
        const { userId } = req.params;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        technician.documents.kycVerified = verified;
        await technician.save();

        res.json({
            success: true,
            message: `Technician KYC ${verified ? 'verified' : 'unverified'} successfully.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: List all withdrawal requests
 */
router.get('/withdrawals', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const withdrawals = await WithdrawalRequest.find(query)
            .populate('technician', 'name mobile')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            withdrawals
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Update withdrawal status (Approve/Reject)
 */
router.post('/withdrawals/:id/status', async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const withdrawalId = req.params.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const withdrawal = await WithdrawalRequest.findById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Request already processed' });
        }

        withdrawal.status = status;
        withdrawal.adminNote = adminNote || '';
        await withdrawal.save();

        res.json({
            success: true,
            withdrawal,
            message: `Withdrawal request ${status} successfully.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Mark withdrawal as PAID
 * This is where the actual balance deduction happens.
 */
router.post('/withdrawals/:id/mark-paid', async (req, res) => {
    try {
        const { transactionId, adminNote } = req.body;
        const withdrawalId = req.params.id;

        const withdrawal = await WithdrawalRequest.findById(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        if (withdrawal.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Already marked as paid' });
        }

        if (withdrawal.status === 'rejected') {
            return res.status(400).json({ success: false, error: 'Cannot pay a rejected request' });
        }

        const technician = await Technician.findOne({ userId: withdrawal.technician });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician profile not found' });
        }

        if (technician.wallet.balance < withdrawal.amount) {
            return res.status(400).json({
                success: false,
                error: 'INSUFFICIENT_BALANCE',
                message: 'Technician balance is now lower than requested amount.'
            });
        }

        // 1. Deduct from wallet
        technician.wallet.balance -= withdrawal.amount;
        await technician.save();

        // 2. Update Withdrawal Request
        withdrawal.status = 'completed';
        withdrawal.transactionId = transactionId || '';
        withdrawal.adminNote = adminNote || withdrawal.adminNote;
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // 3. Create Transaction Record
        await Transaction.create({
            technician: withdrawal.technician,
            type: 'debit',
            amount: withdrawal.amount,
            description: `Wallet Withdrawal (${withdrawal.payoutMethod === 'upi' ? 'UPI' : 'Bank'})`,
            status: 'completed',
            metadata: {
                withdrawalId: withdrawal._id,
                transactionId: withdrawal.transactionId,
                bankDetails: withdrawal.bankDetails,
                upiId: withdrawal.upiId,
                payoutMethod: withdrawal.payoutMethod
            }
        });

        res.json({
            success: true,
            message: 'Payout processed and wallet balance updated.',
            balance: technician.wallet.balance
        });
    } catch (error) {
        console.error('Payout Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
