import { Platform, Alert } from 'react-native';
import axios from 'axios';
import config from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = config.BACKEND_URL + '/api/auth';

/**
 * Hyper-Resilient FCM Service
 * Designed to prevent crashes in Expo Go or unlinked native environments
 */
class FCMService {
    constructor() {
        this.messaging = null;
        this.initialized = false;
        this.isExpoGo = Constants.appOwnership === 'expo';
    }

    // Safely get the messaging instance
    getMessaging() {
        if (this.messaging) return this.messaging;
        if (this.isExpoGo) return null;

        try {
            // Only require if NOT in Expo Go
            const messagingModule = require('@react-native-firebase/messaging').default;
            if (messagingModule) {
                this.messaging = messagingModule;
                return this.messaging;
            }
        } catch (e) {
            console.log('📢 FCM Native Module not found/linked. Notifications disabled.');
        }
        return null;
    }

    async register(userId) {
        try {
            const msg = this.getMessaging();
            if (!msg) {
                console.log('📢 FCM: Registration skipped (Native module not available in this environment)');
                return;
            }

            await this.checkPermission(userId);
            this.createNotificationListeners();
            this.initialized = true;
        } catch (error) {
            console.log('⚠️ FCM Registration Warning:', error.message);
        }
    }

    async checkPermission(userId) {
        try {
            const msg = this.getMessaging();
            if (!msg) return;

            const authStatus = await msg().requestPermission();
            const enabled =
                authStatus === 1 || // AUTHORIZED
                authStatus === 2;   // PROVISIONAL

            if (enabled) {
                console.log('✅ FCM Authorized');
                this.getToken(userId);
            }
        } catch (error) {
            console.log('⚠️ FCM Permission Error:', error.message);
        }
    }

    async getToken(userId) {
        try {
            const msg = this.getMessaging();
            if (!msg) return;

            const fcmToken = await msg().getToken();
            if (fcmToken) {
                console.log('🚀 FCM Token:', fcmToken);
                await this.updateTokenOnServer(userId, fcmToken);
            }
        } catch (error) {
            console.log('❌ Error fetching FCM token:', error.message);
        }
    }

    async updateTokenOnServer(userId, fcmToken) {
        try {
            const response = await axios.post(`${API_URL}/fcm-token`, {
                userId,
                fcmToken
            });
            if (response.data.success) {
                console.log('✅ FCM Token synced');
                await AsyncStorage.setItem('fcmToken', fcmToken);
            }
        } catch (error) {
            console.log('❌ Failed to sync FCM token');
        }
    }

    createNotificationListeners() {
        const msg = this.getMessaging();
        if (!msg) return;

        // 1. Foreground
        this.messageListener = msg().onMessage(async remoteMessage => {
            console.log('📩 Foreground Notification:', remoteMessage.notification?.title);
            Alert.alert(
                remoteMessage.notification?.title || 'Notification',
                remoteMessage.notification?.body || ''
            );
        });

        // 2. Background/Quit state notification opened
        msg().onNotificationOpenedApp(remoteMessage => {
            console.log('📂 Opened from background:', remoteMessage.notification?.title);
            // Handle navigation here if needed
        });

        // 3. App opened from quit state
        msg().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('📂 Opened from quit state:', remoteMessage.notification?.title);
            }
        });

        // 4. Token Refresh
        this.onTokenRefreshListener = msg().onTokenRefresh(async fcmToken => {
            console.log('🔄 Token Refreshed');
            const userId = await AsyncStorage.getItem('userId');
            if (userId) await this.updateTokenOnServer(userId, fcmToken);
        });

        // 5. Register Background Handler (Android specific, must be non-blocking)
        try {
            msg().setBackgroundMessageHandler(async remoteMessage => {
                console.log('🌙 Message handled in the background!', remoteMessage.notification?.title);
                // Do not use Alert here, it will crash in the background
            });
        } catch (e) {
            console.log('⚠️ Background handler registration failed or not supported');
        }
    }

    unregister() {
        if (this.messageListener) this.messageListener();
        if (this.onTokenRefreshListener) this.onTokenRefreshListener();
    }
}

export const fcmService = new FCMService();
