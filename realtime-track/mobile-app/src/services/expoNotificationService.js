import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import config from '../constants/config';

const API_URL = config.BACKEND_URL + '/api/auth';

/**
 * Expo Push Notifications Service
 * Replaces FCM for standardized Expo ecosystem support
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Expo Push Notifications Service
 * Replaces FCM for standardized Expo ecosystem support
 */
class ExpoNotificationService {
    constructor() {
        this.initialized = false;

        if (isExpoGo) {
            console.log('ℹ️ Notification Service: Expo Go detected. Skipping notification handler setup.');
            return;
        }

        // Configure how notifications are handled when the app is open
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    }

    async register(userId) {
        if (isExpoGo) {
            console.log('ℹ️ Notification Service: Expo Go detected. Skipping registration.');
            return;
        }

        try {
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                console.log('🚀 Expo Push Token:', token);
                await this.updateTokenOnServer(userId, token);
                this.initialized = true;
                this.createNotificationListeners();
            }
        } catch (error) {
            console.log('⚠️ Expo Notification Registration Warning:', error.message);
        }
    }

    async registerForPushNotificationsAsync() {
        if (isExpoGo) return null;

        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#8D5159',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Failed to get push token for push notification!');
            return null;
        }

        // Project ID is required for Expo Push Notifications
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        return token;
    }

    async updateTokenOnServer(userId, expoToken) {
        try {
            const response = await axios.post(`${API_URL}/fcm-token`, {
                userId,
                fcmToken: expoToken // Reusing the same field name on backend for simplicity
            });
            if (response.data.success) {
                console.log('✅ Expo Token synced');
                await AsyncStorage.setItem('expoPushToken', expoToken);
            }
        } catch (error) {
            console.log('❌ Failed to sync Expo Token', error.message);
        }
    }

    createNotificationListeners() {
        if (isExpoGo) return;

        // This listener is fired whenever a notification is received while the app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('📩 Foreground Notification:', notification.request.content.title);
            // Optionally show a custom alert or perform an action
        });

        // This listener is fired whenever a user taps on or interacts with a notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('📂 Notification Tapped:', response.notification.request.content.title);
            const data = response.notification.request.content.data;
            // Handle navigation based on data
        });
    }

    unregister() {
        if (isExpoGo) return;

        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }
}

export const expoNotificationService = new ExpoNotificationService();
