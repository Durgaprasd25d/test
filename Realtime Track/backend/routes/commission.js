const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');

// Get pending commission breakdown
router.get('/pending', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        // Get pending commission transactions
        const pendingTransactions = await Transaction.find({
            technician: userId,
            type: 'debit',
            status: 'pending',
            description: { $regex: /Commission Pending/ }
        }).populate('job', 'pricing timeline');

        const jobs = pendingTransactions.map(t => ({
            id: `JR-${t.job._id.toString().substring(0, 6)}`,
            amount: t.amount,
            date: t.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            serviceTotal: t.job.pricing.total
        }));

        res.json({
            success: true,
            total: technician.wallet.commissionDue,
            jobs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pay commission
router.post('/pay', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { amount, paymentMethod } = req.body;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        if (technician.wallet.commissionDue < amount) {
            return res.status(400).json({ error: 'Invalid commission amount' });
        }

        // Deduct pending commission
        technician.wallet.commissionDue -= amount;
        await technician.save();

        // Mark pending transactions as completed
        await Transaction.updateMany(
            {
                technician: userId,
                type: 'debit',
                status: 'pending',
                description: { $regex: /Commission Pending/ }
            },
            {
                status: 'completed',
                description: 'Commission Paid',
                'metadata.paymentMethod': paymentMethod
            }
        );

        res.json({
            success: true,
            remainingCommission: technician.wallet.commissionDue,
            balance: technician.wallet.balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
