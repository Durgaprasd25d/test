const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Send a push notification to specific Expo Push Tokens
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendPushNotification = async (tokens, payload) => {
    try {
        const messageTokens = Array.isArray(tokens) ? tokens : [tokens];
        const messages = [];

        for (let pushToken of messageTokens) {
            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            // Construct a message
            messages.push({
                to: pushToken,
                sound: 'default',
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                channelId: 'default',
            });
        }

        // The Expo push notification service accepts batches of notifications
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('🚀 Expo Notification Chunk Sent:', ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('❌ Expo Notification Chunk Error:', error);
            }
        }

        return tickets;
    } catch (error) {
        console.error('❌ Expo Notification Error:', error);
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

        if (!user || !user.fcmToken) { // Still using fcmToken field for compatibility
            console.warn(`⚠️ User ${userId} has no Push token. Skipping notification.`);
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
