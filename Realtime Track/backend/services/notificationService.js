const { admin } = require('../config/firebase');

/**
 * Send a push notification to specific FCM tokens
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendPushNotification = async (tokens, payload) => {
    try {
        if (!admin || !admin.messaging()) {
            console.warn('⚠️ Firebase Messaging is not initialized. Skipping notification.');
            return;
        }

        const messageTokens = Array.isArray(tokens) ? tokens : [tokens];
        const filteredTokens = messageTokens.filter(t => t && t !== 'null' && t !== 'undefined');

        if (filteredTokens.length === 0) {
            console.warn('⚠️ No valid FCM tokens provided. Skipping notification.');
            return;
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                    icon: 'ic_launcher', // Standard android launcher icon
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
            tokens: filteredTokens,
        };

        const response = await admin.messaging().sendMulticast(message);

        console.log(`🚀 FCM Notification Sent: ${response.successCount} success, ${response.failureCount} failure`);

        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(filteredTokens[idx]);
                }
            });
            console.warn('⚠️ Failed tokens:', failedTokens);
        }

        return response;
    } catch (error) {
        console.error('❌ FCM Notification Error:', error);
    }
};

/**
 * Send a notification to a specific User ID
 * @param {string} userId - Native Mongoose ID of the user
 * @param {Object} payload - Notification payload
 */
const sendToUser = async (userId, payload) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (!user || !user.fcmToken) {
            console.warn(`⚠️ User ${userId} has no FCM token. Skipping notification.`);
            return;
        }

        return await sendPushNotification(user.fcmToken, payload);
    } catch (error) {
        console.error('❌ sendToUser Error:', error);
    }
};

module.exports = {
    sendPushNotification,
    sendToUser,
};
