const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

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
 * ADMIN: Get technicians by KYC status
 */
router.get('/technicians/verification-list', async (req, res) => {
    try {
        const { status } = req.query; // PENDING, VERIFIED, etc
        const query = status ? { 'verification.kycStatus': status } : {};

        const technicians = await Technician.find(query)
            .populate('userId', 'name mobile');

        res.json({
            success: true,
            technicians
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Verify KYC documents
 */
router.post('/technicians/:userId/verify-kyc', async (req, res) => {
    try {
        const { status, reason } = req.body; // 'VERIFIED' or 'REJECTED'
        const { userId } = req.params;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        technician.verification.kycStatus = status;
        if (status === 'VERIFIED') {
            technician.verification.kycVerified = true;
            technician.verification.rejectionReason = null;
        } else {
            technician.verification.kycVerified = false;
            technician.verification.rejectionReason = reason;
        }

        technician.verification.reviewedAt = new Date();
        await technician.save();

        res.json({ success: true, message: `KYC ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Verify for Payouts (explicitly)
 */
router.post('/technicians/:userId/verify-payout', async (req, res) => {
    try {
        const { isVerified } = req.body; // true or false
        const { userId } = req.params;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        technician.verification.adminVerified = isVerified;
        await technician.save();

        res.json({ success: true, message: `Payout verification set to ${isVerified}.` });
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
            .populate({
                path: 'technician',
                select: 'userId verification stats',
                populate: { path: 'userId', select: 'name mobile' }
            })
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

        // 1. If REJECTED, move money back from lockedAmount to balance
        if (status === 'rejected') {
            const technician = await Technician.findOne({ userId: withdrawal.technician });
            if (technician) {
                technician.wallet.lockedAmount -= withdrawal.amount;
                technician.wallet.balance += withdrawal.amount;
                await technician.save();

                // Record reversal transaction
                await Transaction.create({
                    technician: withdrawal.technician,
                    type: 'credit',
                    amount: withdrawal.amount,
                    description: `Withdrawal Request Rejected - Funds Restored`,
                    status: 'completed',
                    metadata: { withdrawalId: withdrawal._id }
                });
            }
        }

        res.json({
            success: true,
            withdrawal,
            message: `Withdrawal request ${status} successfully. Funds ${status === 'rejected' ? 'restored' : 'approved for payout'}.`
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

        // 1. Deduct from lockedAmount (Phase 4 Pipeline Fix)
        if (technician.wallet.lockedAmount < withdrawal.amount) {
            // Fallback for older entries or inconsistencies
            technician.wallet.balance -= withdrawal.amount;
        } else {
            technician.wallet.lockedAmount -= withdrawal.amount;
        }
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

/**
 * ADMIN: Get all active jobs (for Live Map)
 */
router.get('/active-jobs', async (req, res) => {
    try {
        const activeJobs = await Ride.find({
            status: { $in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] }
        })
            .populate('driverId', 'name mobile')
            .populate('customerId', 'name mobile')
            .sort({ updatedAt: -1 });

        // Merge with current technician location from store
        const locationStore = require('../services/locationStore');
        const enrichedJobs = await Promise.all(activeJobs.map(async (job) => {
            const location = await locationStore.getLocation(job.rideId);
            return {
                ...job.toObject(),
                currentLocation: location
            };
        }));

        res.json({
            success: true,
            jobs: enrichedJobs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: List all transactions with advanced filtering
 */
router.get('/transactions', async (req, res) => {
    try {
        const {
            type,
            status,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            search
        } = req.query;

        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search logic (ID or Description)
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { 'metadata.transactionId': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .populate({
                path: 'technician',
                select: 'name mobile',
                model: 'User'
            })
            .populate('job', 'rideId price serviceType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Get Live Payments from Razorpay directly
 */
router.get('/razorpay/payments', async (req, res) => {
    try {
        const { count = 20, skip = 0 } = req.query;
        const payments = await razorpay.payments.all({
            count: parseInt(count),
            skip: parseInt(skip)
        });
        res.json({ success: true, payments: payments.items, total: payments.count });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ADMIN: Get Live Payouts from RazorpayX (using fetch as per payout.js pattern)
 */
router.get('/razorpay/payouts', async (req, res) => {
    try {
        const { count = 20 } = req.query;
        const response = await fetch(`https://api.razorpay.com/v1/payouts?account_number=${process.env.RAZORPAYX_ACCOUNT_NUMBER}&count=${count}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEYID + ':' + process.env.RAZORPAY_KEYSECRET).toString('base64')
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.description || 'Failed to fetch payouts');
        res.json({ success: true, payouts: data.items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
