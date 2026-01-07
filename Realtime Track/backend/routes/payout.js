const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET,
});

// Create RazorpayX Contact
async function createContact(technician) {
    try {
        const response = await fetch('https://api.razorpay.com/v1/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEYID + ':' + process.env.RAZORPAY_KEYSECRET).toString('base64')
            },
            body: JSON.stringify({
                name: technician.verification?.bankDetails?.accountHolderName || "Technician",
                email: `tech_${technician.userId._id || technician.userId}@service.com`,
                contact: technician.userId.mobile || technician.mobile || "9999999999",
                type: "employee",
                reference_id: (technician.userId._id || technician.userId).toString()
            })
        });
        const data = await response.json();
        console.log(`📦 Contact Creation Response (${response.status}):`, JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ RazorpayX Contact Error:', data.error);
            const errDetail = data.error?.description || data.error?.code || 'Unknown';
            throw new Error(`Razorpay Contact Error [${response.status}]: ${errDetail}`);
        }
        return data.id;
    } catch (error) {
        console.error('RazorpayX Contact Creation Exception:', error);
        throw error;
    }
}

// Create RazorpayX Fund Account
async function createFundAccount(contactId, bankDetails) {
    try {
        const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEYID + ':' + process.env.RAZORPAY_KEYSECRET).toString('base64')
            },
            body: JSON.stringify({
                contact_id: contactId,
                account_type: "bank_account",
                bank_account: {
                    name: bankDetails.accountHolderName,
                    ifsc: bankDetails.ifscCode,
                    account_number: bankDetails.accountNumber
                }
            })
        });
        const data = await response.json();
        console.log(`📦 Fund Account Response (${response.status}):`, JSON.stringify(data, null, 2));

        if (!response.ok) {
            const errDetail = data.error?.description || data.error?.code || data.error || 'Unknown Fund Account Error';
            throw new Error(`Razorpay Fund Account Error [${response.status}]: ${errDetail}`);
        }
        return data.id;
    } catch (error) {
        console.error('RazorpayX Fund Account Creation Exception:', error);
        throw error;
    }
}

// Initiate Payout
router.post('/process-payout', async (req, res) => {
    try {
        const { withdrawalId } = req.body;
        const withdrawal = await WithdrawalRequest.findById(withdrawalId);

        if (!withdrawal || (withdrawal.status !== 'pending' && withdrawal.status !== 'approved')) {
            return res.status(400).json({ success: false, error: 'Invalid or already processed withdrawal' });
        }

        const technician = await Technician.findById(withdrawal.technician).populate('userId');

        // 1. Get or Create Contact
        let contactId = await createContact(technician);

        // 2. Create Fund Account
        let fundAccountId = await createFundAccount(contactId, withdrawal.bankDetails);

        // Pre-flight check: Source account
        if (!process.env.RAZORPAYX_ACCOUNT_NUMBER) {
            throw new Error("RAZORPAYX_ACCOUNT_NUMBER is missing in backend .env file. Payouts cannot proceed without a source account.");
        }

        // Pre-flight check: Technician bank details
        if (withdrawal.payoutMethod === 'bank' && !withdrawal.bankDetails?.accountNumber) {
            throw new Error("Technician bank account number is missing in the request.");
        }

        // 3. Create Payout
        console.log(`📡 Initiating RazorpayX Payout for ${withdrawalId}...`);
        const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEYID + ':' + process.env.RAZORPAY_KEYSECRET).toString('base64')
            },
            body: JSON.stringify({
                account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
                fund_account_id: fundAccountId,
                amount: withdrawal.amount * 100, // paise
                currency: "INR",
                mode: "IMPS",
                purpose: "payout",
                queue_if_low_balance: true,
                reference_id: withdrawal._id.toString()
            })
        });

        const payoutData = await payoutResponse.json();
        console.log(`📦 Payout Request Response (${payoutResponse.status}):`, JSON.stringify(payoutData, null, 2));

        if (!payoutResponse.ok) {
            console.error('❌ RazorpayX Payout API Error:', payoutData.error);
            const errDetail = payoutData.error?.description || payoutData.error?.code || payoutData.error || 'NA';
            throw new Error(`Razorpay Payout API Error [${payoutResponse.status}]: ${errDetail}`);
        }

        withdrawal.status = 'approved';
        withdrawal.transactionId = payoutData.id;
        withdrawal.processedAt = new Date(); // Set processing date
        await withdrawal.save();

        res.json({ success: true, payoutId: payoutData.id });

    } catch (error) {
        console.error('🛑 Payout Processing Exception:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unknown Server Error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// RazorpayX Webhook Handler
router.post('/webhook', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.WEBHOOK_SECRET;

    // Verify signature logic...

    const event = req.body.event;
    const payload = req.body.payload.payout.entity;
    const withdrawalId = payload.reference_id;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) return res.send();

    const technician = await Technician.findById(withdrawal.technician);

    if (event === 'payout.processed') {
        // SUCCESS (Phase 6, Step 13A)
        technician.wallet.lockedAmount -= withdrawal.amount;
        await technician.save();

        withdrawal.status = 'approved'; // Already set, but good for finality
        withdrawal.processedAt = new Date();
        await withdrawal.save();

        // Finalize transaction
        await Transaction.findOneAndUpdate(
            { 'metadata.withdrawalId': withdrawalId },
            { status: 'completed' }
        );
    }
    else if (event === 'payout.failed' || event === 'payout.rejected') {
        // FAILED (Phase 6, Step 13B) - ROLLBACK
        technician.wallet.lockedAmount -= withdrawal.amount;
        technician.wallet.balance += withdrawal.amount;
        await technician.save();

        withdrawal.status = 'rejected';
        withdrawal.adminNote = 'RazorpayX Payout Failed: ' + (payload.failure_reason || 'Unknown error');
        await withdrawal.save();

        // Update transaction status
        await Transaction.findOneAndUpdate(
            { 'metadata.withdrawalId': withdrawalId },
            { status: 'failed', description: 'Withdrawal Failed - Balance Restored' }
        );
    }

    res.send({ status: 'ok' });
});

module.exports = router;
