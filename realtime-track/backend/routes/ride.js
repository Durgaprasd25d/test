const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Technician = require('../models/Technician');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendToUser, sendPushNotification } = require('../services/notificationService');


// Request a ride (Job)
router.post('/request', async (req, res) => {
    try {
        const { pickup, destination, serviceType, customerId, paymentMethod, paymentTiming } = req.body;
        const rideId = `job_${Date.now()}`;

        const ride = new Ride({
            rideId,
            pickup,
            destination: destination || { address: 'TBD', lat: 0, lng: 0 },
            serviceType: serviceType || 'service',
            customerId,
            status: 'REQUESTED',
            paymentMethod: paymentMethod || 'ONLINE', // COD disabled - Online only
            paymentTiming: paymentTiming || 'PREPAID' // Default to prepaid
        });

        await ride.save();

        const io = req.app.get('io');

        // Broadcast to all potential technicians ONLY IF it's POSTPAID
        // PREPAID jobs are broadcasted after payment success
        if (ride.paymentTiming === 'POSTPAID') {
            io.emit('ride:requested', {
                rideId,
                pickup,
                destination,
                serviceType: ride.serviceType,
                paymentMethod: ride.paymentMethod,
                paymentTiming: ride.paymentTiming
            });

            // Push Notification to all Technicians
            const technicians = await User.find({ role: 'technician', fcmToken: { $ne: null } }).select('fcmToken');
            const tokens = technicians.map(t => t.fcmToken);
            if (tokens.length > 0) {
                await sendPushNotification(tokens, {
                    title: 'New Job Request 🛠️',
                    body: `A new ${ride.serviceType} job is available nearby.`,
                    data: { rideId, type: 'NEW_JOB' }
                });
            }
        }

        res.json({ success: true, data: ride });
    } catch (error) {
        console.error('Job request error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get a single ride by rideId
router.get('/:rideId', async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await Ride.findOne({ rideId }).populate('driverId');

        if (!ride) {
            return res.status(404).json({ success: false, error: 'Ride not found' });
        }

        // Fetch technician profile if assigned
        let technicianData = null;
        if (ride.driverId) {
            const technician = await Technician.findOne({ userId: ride.driverId._id });
            technicianData = {
                id: ride.driverId._id,
                name: ride.driverId.name,
                phone: ride.driverId.mobile,
                rating: technician?.stats?.rating || 4.5,
                location: technician?.currentLocation ? {
                    lat: technician.currentLocation.lat,
                    lng: technician.currentLocation.lng
                } : null
            };
        }

        res.json({
            success: true,
            data: {
                ...ride.toObject(),
                technician: technicianData
            }
        });
    } catch (error) {
        console.error('Fetch ride error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get pending jobs (for technicians)
router.get('/pending', async (req, res) => {
    try {
        // Only show jobs that are either POSTPAID or PREPAID-AND-PAID
        const rides = await Ride.find({
            status: 'REQUESTED',
            $or: [
                { paymentTiming: 'POSTPAID' },
                { paymentTiming: 'PREPAID', paymentStatus: 'PAID' }
            ]
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: rides });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all jobs grouped by status (for technician services list)
router.get('/all-jobs', async (req, res) => {
    try {
        const { technicianId } = req.query;

        // Get all jobs categorized by status
        // PENDING jobs must be validated (Paid if Prepaid)
        const pending = await Ride.find({
            status: 'REQUESTED',
            driverId: null, // Not assigned yet
            $or: [
                { paymentTiming: 'POSTPAID' },
                { paymentTiming: 'PREPAID', paymentStatus: 'PAID' }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        const accepted = await Ride.find({
            status: 'ACCEPTED',
            driverId: technicianId
        }).sort({ createdAt: -1 }).limit(10);

        const inProgress = await Ride.find({
            status: { $in: ['ARRIVED', 'IN_PROGRESS'] },
            driverId: technicianId
        }).sort({ createdAt: -1 }).limit(10);

        const completed = await Ride.find({
            status: 'COMPLETED',
            driverId: technicianId
        }).sort({ createdAt: -1 }).limit(20);

        res.json({
            success: true,
            data: {
                pending: pending.map(r => ({
                    rideId: r.rideId,
                    serviceType: r.serviceType,
                    pickup: r.pickup,
                    price: r.price || 1000,
                    paymentMethod: r.paymentMethod,
                    paymentTiming: r.paymentTiming,
                    createdAt: r.createdAt
                })),
                accepted: accepted.map(r => ({
                    rideId: r.rideId,
                    serviceType: r.serviceType,
                    pickup: r.pickup,
                    price: r.price || 1000,
                    status: r.status,
                    createdAt: r.createdAt
                })),
                inProgress: inProgress.map(r => ({
                    rideId: r.rideId,
                    serviceType: r.serviceType,
                    pickup: r.pickup,
                    price: r.price || 1000,
                    status: r.status,
                    createdAt: r.createdAt
                })),
                completed: completed.map(r => ({
                    rideId: r.rideId,
                    serviceType: r.serviceType,
                    pickup: r.pickup,
                    price: r.price || 1000,
                    completedAt: r.timestamp,
                    createdAt: r.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get all jobs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Accept a job
router.post('/accept', async (req, res) => {
    try {
        const { rideId, driverId } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride || (ride.status !== 'REQUESTED' && ride.status !== 'ACCEPTED')) {
            return res.status(404).json({ success: false, error: 'Job no longer available' });
        }

        const technician = await Technician.getOrCreate(driverId);

        // COD DISABLED - No need to check COD limits anymore
        // if (ride.paymentMethod === 'COD' && technician.wallet.commissionDue >= technician.wallet.codLimit) {
        //     return res.status(403).json({
        //         success: false,
        //         error: 'COD_LIMIT_EXCEEDED',
        //         message: 'Please clear pending company dues to accept cash jobs.'
        //     });
        // }

        // Generate 4-digit Entrance OTP
        const arrivalOtp = Math.floor(1000 + Math.random() * 9000).toString();

        ride.status = 'ACCEPTED';
        ride.driverId = driverId;
        ride.arrivalOtp = arrivalOtp;
        await ride.save();

        // Use population to get technician user details
        const populatedRide = await Ride.findOne({ rideId }).populate('driverId');

        // Fetch technician-specific profile info (already fetched on line 100)

        const technicianData = {
            id: driverId,
            name: populatedRide.driverId?.name || 'Professional Technician',
            phone: populatedRide.driverId?.mobile || null,
            rating: technician?.stats?.rating || 4.5,
            location: technician?.currentLocation ? {
                lat: technician.currentLocation.lat,
                lng: technician.currentLocation.lng
            } : null
        };

        console.log('✅ Technician accepted job:', rideId, '| Entrance OTP:', arrivalOtp);

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:accepted', {
            rideId,
            driverId,
            technician: technicianData,
            arrivalOtp // Send OTP to customer
        });

        // Push Notification to Customer
        await sendToUser(ride.customerId, {
            title: 'Technician Assigned! 🚕',
            body: `${technicianData.name} has accepted your ${ride.serviceType} request.`,
            data: { rideId, type: 'JOB_ACCEPTED' }
        });

        res.json({ success: true, data: { ...ride.toObject(), technician: technicianData } });
    } catch (error) {
        console.error('❌ Accept job error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Verify Arrival OTP (Entrance)
router.post('/verify-arrival', async (req, res) => {
    try {
        const { rideId, otp } = req.body;
        const ride = await Ride.findOne({ rideId });

        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        if (ride.arrivalOtp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid Entrance OTP' });
        }

        ride.status = 'ARRIVED';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:arrived', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the service
router.post('/start-service', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.status = 'IN_PROGRESS';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:in_progress', { rideId });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update payment method
router.post('/update-payment-method', async (req, res) => {
    try {
        const { rideId, paymentMethod } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.paymentMethod = paymentMethod;
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('payment:method_updated', { rideId, paymentMethod });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// End the service (Complete)
router.post('/end-service', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        // Generate 5-digit Main OTP for completion
        const completionOtp = Math.floor(10000 + Math.random() * 90000).toString();
        ride.completionOtp = completionOtp;

        // ONLINE ONLY: OTP remains hidden until payment is verified
        await ride.save();

        const io = req.app.get('io');
        // BROADCAST to the room BUT DO NOT include the completionOtp here
        // The technician only needs to know the service ended.
        io.to(`ride:${rideId}`).emit('ride:service_ended', {
            rideId,
            paymentMethod: ride.paymentMethod,
            paymentTiming: ride.paymentTiming,
            price: ride.price || 1000
            // completionOtp: ride.completionOtp // REMOVED FOR SECURITY
        });

        // ALSO: Send the OTP specifically to the CUSTOMER if already paid (unlikely here)
        // or just rely on the payment-success triggers.

        // Prepare response - hide OTP from technician
        const rideData = ride.toObject();
        delete rideData.completionOtp;

        res.json({ success: true, data: rideData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Mock Payment Success (For Online Payment)
router.post('/payment-success', async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

        ride.paymentStatus = 'PAID';
        await ride.save();

        const io = req.app.get('io');

        // IMPORTANT: Broadcast the job to technicians now that it's PAID
        if (ride.paymentTiming === 'PREPAID') {
            io.emit('ride:requested', {
                rideId: ride.rideId,
                pickup: ride.pickup,
                destination: ride.destination,
                serviceType: ride.serviceType,
                paymentMethod: ride.paymentMethod,
                paymentTiming: ride.paymentTiming
            });
        }

        // Sending OTP now that payment is successful
        // ONLY to the customer's private room
        io.to(`user:${ride.customerId}`).emit('payment:success', {
            rideId,
            completionOtp: ride.completionOtp
        });

        // Notify the ride room that payment is done (without OTP)
        io.to(`ride:${rideId}`).emit('payment:verified', { rideId });

        // Push Notification to Technician
        if (ride.driverId) {
            await sendToUser(ride.driverId, {
                title: 'Payment Verified! ✅',
                body: `The customer has paid for job #${ride.rideId}. You can now see the completion OTP.`,
                data: { rideId, type: 'PAYMENT_SUCCESS' }
            });
        } else if (ride.paymentTiming === 'PREPAID') {
            // New paid job: Notify all technicians
            const technicians = await User.find({ role: 'technician', fcmToken: { $ne: null } }).select('fcmToken');
            const tokens = technicians.map(t => t.fcmToken);
            if (tokens.length > 0) {
                await sendPushNotification(tokens, {
                    title: 'New Prepaid Job! 💰',
                    body: `A new prepaid ${ride.serviceType} job is available.`,
                    data: { rideId, type: 'NEW_JOB' }
                });
            }
        }

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Complete the job (Verify Final OTP)
router.post('/complete', async (req, res) => {
    try {
        const { rideId, otp } = req.body;

        const ride = await Ride.findOne({ rideId });
        if (!ride) return res.status(404).json({ success: false, error: 'Job not found' });

        // Payment Check
        if (ride.paymentStatus !== 'PAID') {
            return res.status(402).json({
                success: false,
                error: 'PAYMENT_REQUIRED',
                message: 'Please wait for the customer to complete the payment.'
            });
        }

        if (ride.completionOtp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid Completion OTP' });
        }

        ride.status = 'COMPLETED';
        ride.paymentStatus = 'VERIFIED';
        await ride.save();

        // Updated Uber-style Financial Logic for Ride Completion
        const technician = await Technician.findOne({ userId: ride.driverId });
        if (technician) {
            // ONLY credit wallet if payment wasn't already handled (e.g. for Online, it's handled in payment.js)
            if (ride.paymentStatus !== 'PAID') {
                const price = ride.price || 1000;
                const COMMISSION_RATE = 0.20;
                const commission = Math.round(price * COMMISSION_RATE);
                const earnings = price - commission;

                // Credit for Cash/Manual or other types not handled by payment.js split
                technician.wallet.balance += earnings;
                technician.stats.todayEarnings += earnings;

                await Transaction.create({
                    technician: ride.driverId,
                    type: 'credit',
                    amount: earnings,
                    description: `Earnings for ${ride.paymentMethod || 'manual'} job #${ride.rideId}`,
                    job: ride._id,
                    status: 'completed'
                });
                console.log(`💰 Manual/Cash Credit: Technician earned ₹${earnings}`);
            } else {
                console.log(`ℹ️ Skipping credit in /complete for ${rideId}: Already credited via Online Payment Split.`);
            }

            // Always update generic stats
            technician.stats.completedJobs += 1;
            technician.stats.totalJobs += 1;
            await technician.save();
        }

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:completed', { rideId });
        io.to(`user:${ride.customerId}`).emit('ride:completed', { rideId });
        if (ride.driverId) {
            io.to(`user:${ride.driverId}`).emit('ride:completed', { rideId });
        }

        // Push Notification to Customer
        await sendToUser(ride.customerId, {
            title: 'Service Completed! ⭐',
            body: `Your ${ride.serviceType} job is completed. Please rate the technician.`,
            data: { rideId, type: 'JOB_COMPLETED' }
        });

        res.json({ success: true, data: ride });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


// Get job history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query;

        let query = { status: 'COMPLETED' };
        if (role === 'driver') {
            query.driverId = userId;
        } else {
            query.customerId = userId;
        }

        const history = await Ride.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get current active ride for a customer
router.get('/current/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const ride = await Ride.findOne({
            customerId,
            status: { $in: ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] }
        }).populate('driverId');

        if (!ride) {
            return res.json({ success: true, data: null });
        }

        // Fetch technician profile if assigned
        let technicianData = null;
        if (ride.driverId) {
            const technician = await Technician.findOne({ userId: ride.driverId._id });
            technicianData = {
                id: ride.driverId._id,
                name: ride.driverId.name,
                phone: ride.driverId.mobile,
                rating: technician?.stats?.rating || 4.5,
                location: technician?.currentLocation ? {
                    lat: technician.currentLocation.lat,
                    lng: technician.currentLocation.lng
                } : null
            };
        }

        res.json({
            success: true,
            data: {
                ...ride.toObject(),
                technician: technicianData
            }
        });
    } catch (error) {
        console.error('Fetch current ride error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get Receipt/Bill for a completed ride
router.get('/receipt/:rideId', async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await Ride.findOne({ rideId })
            .populate('customerId', 'name mobile email')
            .populate('driverId', 'name mobile');

        if (!ride) {
            return res.status(404).json({ success: false, error: 'Receipt not found' });
        }

        // Calculate billing breakdown
        const serviceCharge = ride.price || 0;
        const platformFee = Math.round(serviceCharge * 0.05); // 5% platform fee
        const gst = Math.round((serviceCharge + platformFee) * 0.18); // 18% GST
        const totalAmount = serviceCharge + platformFee + gst;

        // Fetch technician details if available
        let technicianInfo = null;
        if (ride.driverId) {
            technicianInfo = {
                name: ride.driverId.name,
                phone: ride.driverId.mobile
            };
        }

        // Structure receipt data
        const receiptData = {
            // Booking Info
            bookingId: ride.rideId,
            serviceType: ride.serviceType,
            bookingDate: ride.createdAt,
            location: ride.pickup?.address,
            status: ride.status,

            // Customer Info
            customer: {
                name: ride.customerId?.name,
                phone: ride.customerId?.mobile,
                email: ride.customerId?.email
            },

            // Technician Info
            technician: technicianInfo,

            // Billing Breakdown
            billing: {
                serviceCharge,
                platformFee,
                gst,
                gstPercentage: 18,
                totalAmount
            },

            // Payment Info
            payment: {
                method: ride.paymentMethod,
                status: ride.paymentStatus,
                timing: ride.paymentTiming,
                transactionId: ride.razorpayDetails?.paymentId,
                paidAt: ride.razorpayDetails?.paidAt
            },

            // Company Info
            company: {
                name: 'Zyro AC',
                website: 'https://www.zyroac.com/',
                email: 'support@zyroac.com',
                phone: '+91 98765 43210'
            }
        };

        res.json({ success: true, data: receiptData });
    } catch (error) {
        console.error('Fetch receipt error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate receipt' });
    }
});

// Cancel by Technician (with re-assignment)
router.post('/cancel-by-technician', async (req, res) => {
    try {
        const { rideId, technicianId, reason } = req.body;

        if (!rideId || !technicianId) {
            return res.status(400).json({ success: false, error: 'rideId and technicianId are required' });
        }

        const ride = await Ride.findOne({ rideId });

        if (!ride) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Verify technician is assigned to this job
        if (ride.driverId?.toString() !== technicianId) {
            return res.status(403).json({ success: false, error: 'You are not assigned to this job' });
        }

        // Only allow cancellation if not already completed or cancelled
        if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
            return res.status(400).json({ success: false, error: `Job already ${ride.status.toLowerCase()}` });
        }

        const previousStatus = ride.status;
        const cancelledReason = reason || 'Technician cancelled';

        // Reset job to REQUESTED for re-assignment
        ride.status = 'REQUESTED';
        ride.driverId = null;
        ride.cancellationReason = cancelledReason;
        ride.cancelledBy = 'technician';
        await ride.save();

        const io = req.app.get('io');

        // Notify customer about cancellation
        io.to(`user:${ride.customerId}`).emit('technician:cancelled', {
            rideId,
            reason: cancelledReason,
            message: 'Your assigned technician had to cancel. Finding you a replacement...'
        });

        // Re-broadcast job to all available technicians (if payment is completed)
        if (ride.paymentStatus === 'PAID' || ride.paymentTiming === 'POSTPAID') {
            console.log(`🔄 Re-broadcasting job ${rideId} after technician cancellation`);

            io.emit('ride:requested', {
                rideId,
                pickup: ride.pickup,
                destination: ride.destination,
                serviceType: ride.serviceType,
                paymentMethod: ride.paymentMethod,
                paymentTiming: ride.paymentTiming
            });

            // Send push notifications to technicians
            const Technician = require('../models/Technician');
            const User = require('../models/User');
            const { sendPushNotification } = require('../services/notificationService');

            const technicians = await User.find({
                role: 'technician',
                fcmToken: { $ne: null },
                _id: { $ne: technicianId } // Exclude the cancelling technician
            }).select('fcmToken');

            const tokens = technicians.map(t => t.fcmToken);
            if (tokens.length > 0) {
                await sendPushNotification(tokens, {
                    title: 'Urgent Job Available 🛠️',
                    body: `A ${ride.serviceType} service needs immediate attention!`,
                    data: { rideId, type: 'JOB_REASSIGNED' }
                });
            }
        }

        res.json({
            success: true,
            message: 'Job cancelled and re-assigned successfully',
            rebroadcasted: ride.paymentStatus === 'PAID' || ride.paymentTiming === 'POSTPAID'
        });
    } catch (error) {
        console.error('Technician cancel job error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Cancel a ride (Job)
router.post('/cancel', async (req, res) => {
    try {
        const { rideId, reason } = req.body;
        const ride = await Ride.findOne({ rideId });

        if (!ride) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        // Only allow cancellation if not already completed or cancelled
        if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
            return res.status(400).json({ success: false, error: `Job already ${ride.status.toLowerCase()}` });
        }

        ride.status = 'CANCELLED';
        ride.cancellationReason = reason || 'User cancelled';
        await ride.save();

        const io = req.app.get('io');
        io.to(`ride:${rideId}`).emit('ride:cancelled', { rideId, reason: ride.cancellationReason });
        io.to(`user:${ride.customerId}`).emit('ride:cancelled', { rideId, reason: ride.cancellationReason });

        // Notify technician if assigned
        if (ride.driverId) {
            io.to(`user:${ride.driverId}`).emit('job:cancelled', { rideId, reason: ride.cancellationReason });
            io.to(`user:${ride.driverId}`).emit('ride:cancelled', { rideId, reason: ride.cancellationReason });
        }

        res.json({ success: true, message: 'Job cancelled successfully' });
    } catch (error) {
        console.error('Cancel job error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
