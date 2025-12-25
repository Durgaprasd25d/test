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
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            status: t.status
        }));

        res.json({
            success: true,
            balance: technician.wallet.balance,
            pendingCommission: technician.wallet.pendingCommission,
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

// Withdraw from wallet
router.post('/withdraw', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { amount, bankDetails } = req.body;

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ error: 'Technician not found' });
        }

        if (technician.wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct from wallet
        technician.wallet.balance -= amount;
        await technician.save();

        // Create transaction
        await Transaction.create({
            technician: userId,
            type: 'debit',
            amount,
            description: 'Withdrawal',
            status: 'completed',
            metadata: { bankDetails }
        });

        res.json({
            success: true,
            balance: technician.wallet.balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
