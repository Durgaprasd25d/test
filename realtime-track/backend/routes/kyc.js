const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');

// Get current KYC status and documents
router.get('/status', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        res.json({
            success: true,
            kycStatus: technician.verification.kycStatus,
            documents: technician.verification.documents,
            rejectionReason: technician.verification.rejectionReason,
            submittedAt: technician.verification.submittedAt,
            kycVerified: technician.verification.kycVerified
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit KYC for verification
router.post('/submit', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        const { documents, bankDetails } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const technician = await Technician.findOne({ userId });
        if (!technician) {
            return res.status(404).json({ success: false, error: 'Technician not found' });
        }

        // Check if already verified or pending
        if (technician.verification.kycStatus === 'VERIFIED') {
            return res.status(400).json({ success: false, error: 'KYC already verified' });
        }

        // Update documents and status
        technician.verification.documents = {
            ...technician.verification.documents,
            ...documents
        };

        if (bankDetails) {
            technician.verification.bankDetails = {
                ...technician.verification.bankDetails,
                ...bankDetails
            };
        }

        technician.verification.kycStatus = 'PENDING';
        technician.verification.submittedAt = new Date();
        technician.verification.rejectionReason = null; // Clear old reason if any

        await technician.save();

        res.json({
            success: true,
            message: 'KYC submitted successfully. Our team will verify it within 24-48 hours.',
            kycStatus: 'PENDING'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
