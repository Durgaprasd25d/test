import React, { useState, useEffect } from 'react';
import * as Updates from 'expo-updates';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthScreen from './src/screens/AuthScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Customer Screens
import HomeScreen from './src/screens/customer/HomeScreen';
import ServiceListScreen from './src/screens/customer/ServiceListScreen';
import ServiceDetailScreen from './src/screens/customer/ServiceDetailScreen';
import ScheduleScreen from './src/screens/customer/ScheduleScreen';
import BookingSummaryScreen from './src/screens/customer/BookingSummaryScreen';
import PaymentMethodScreen from './src/screens/customer/PaymentMethodScreen';
import PaymentStatusScreen from './src/screens/customer/PaymentStatusScreen';
import CustomerScreen from './src/screens/customer/CustomerScreen';
import ServiceStatusScreen from './src/screens/customer/ServiceStatusScreen';
import HistoryScreen from './src/screens/customer/HistoryScreen';
import ProfileScreen from './src/screens/customer/ProfileScreen';
import CustomerRazorpayCheckoutScreen from './src/screens/customer/CustomerRazorpayCheckoutScreen';
import ReceiptScreen from './src/screens/customer/ReceiptScreen';

// Technician Screens
import TechnicianDashboardScreen from './src/screens/technician/TechnicianDashboardScreen';
import JobRequestScreen from './src/screens/technician/JobRequestScreen';
import JobDetailsScreen from './src/screens/technician/JobDetailsScreen';
import ArrivalScreen from './src/screens/technician/ArrivalScreen';
import ServiceProgressScreen from './src/screens/technician/ServiceProgressScreen';
import CODCollectionScreen from './src/screens/technician/CODCollectionScreen';
import TechnicianOTPScreen from './src/screens/technician/TechnicianOTPScreen';
import WalletUpdateScreen from './src/screens/technician/WalletUpdateScreen';
import TechnicianWalletScreen from './src/screens/technician/TechnicianWalletScreen';
import CommissionPaymentScreen from './src/screens/technician/CommissionPaymentScreen';
import PayCommissionScreen from './src/screens/technician/PayCommissionScreen';
import CommissionPaidScreen from './src/screens/technician/CommissionPaidScreen';
import TechnicianHistoryScreen from './src/screens/technician/TechnicianHistoryScreen';
import TechnicianProfileScreen from './src/screens/technician/TechnicianProfileScreen';
import TechnicianNavigationScreen from './src/screens/technician/TechnicianNavigationScreen';
import WithdrawalRequestScreen from './src/screens/technician/WithdrawalRequestScreen';
import DriverScreen from './src/screens/technician/DriverScreen'; // Legacy - keep for existing tracking
import RazorpayCheckoutScreen from './src/screens/technician/RazorpayCheckoutScreen';
import KYCScreen from './src/screens/technician/KYCScreen';
import VerificationPendingScreen from './src/screens/technician/VerificationPendingScreen';

import authService from './src/services/authService';
import technicianService from './src/services/technicianService';
// import { fcmService } from './src/services/fcmService';
import { expoNotificationService } from './src/services/expoNotificationService';
import { COLORS } from './src/constants/theme';

const Stack = createStackNavigator();

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [kycStatus, setKycStatus] = useState(null);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        // Silent OTA Update Check
        async function onFetchUpdateAsync() {
            try {
                if (__DEV__) return; // Skip in development
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    // Alert the user only if you want them to restart now
                    // Otherwise it will apply on next launch silently
                    Alert.alert(
                        'Update Available',
                        'A new version of Zyro AC is ready. Restart now to apply?',
                        [
                            { text: 'Later', style: 'cancel' },
                            { text: 'Restart', onPress: () => Updates.reloadAsync() }
                        ]
                    );
                }
            } catch (error) {
                console.log('Error fetching OTA update:', error);
            }
        }

        onFetchUpdateAsync();

        const bootstrapAsync = async () => {
            let token;
            let role = null;
            try {
                // FOR TESTING: Clear onboarding status to see it again
                await AsyncStorage.removeItem('hasSeenOnboarding');

                token = await authService.isLoggedIn();
                const seenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                console.log('Onboarding Seen Status:', seenOnboarding);
                setHasSeenOnboarding(seenOnboarding === 'true');

                if (token) {
                    const user = await authService.getUser();
                    role = user?.role || 'customer';

                    if (role === 'technician') {
                        const kycRes = await technicianService.getKYCStatus();
                        if (kycRes.success) {
                            setKycStatus(kycRes.kycStatus);
                        }
                    }


                    // Register Expo Push Notifications for logged in user
                    expoNotificationService.register(user.id || user._id);
                    // fcmService.register(user.id || user._id);
                }
            } catch (e) {
                console.error('Check login error:', e);
            }
            setUserToken(token);
            setUserRole(role);
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.roseGold} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName={
                            !userToken ? (hasSeenOnboarding ? "Auth" : "Splash") :
                                userRole === 'technician' ? "TechnicianDashboard" : "Home"
                        }
                        screenOptions={{
                            headerStyle: {
                                backgroundColor: COLORS.white,
                                elevation: 0,
                                shadowOpacity: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.greyLight,
                            },
                            headerTintColor: COLORS.black,
                            headerTitleStyle: {
                                fontWeight: 'bold',
                                fontSize: 16,
                                letterSpacing: 1,
                            },
                            headerBackTitleVisible: false,
                            headerTitleAlign: 'center',
                        }}
                    >
                        <Stack.Screen
                            name="Splash"
                            component={SplashScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Onboarding"
                            component={OnboardingScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Auth"
                            component={AuthScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="Customer"
                            component={CustomerScreen}
                            options={{
                                title: 'SERVICE TRACKING',
                                headerStyle: { backgroundColor: COLORS.white },
                                headerTintColor: COLORS.black,
                            }}
                        />
                        <Stack.Screen
                            name="History"
                            component={HistoryScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="ServiceList"
                            component={ServiceListScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ServiceDetail"
                            component={ServiceDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Schedule"
                            component={ScheduleScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="BookingSummary"
                            component={BookingSummaryScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PaymentMethod"
                            component={PaymentMethodScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PaymentStatus"
                            component={PaymentStatusScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ServiceStatus"
                            component={ServiceStatusScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CustomerRazorpayCheckout"
                            component={CustomerRazorpayCheckoutScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Receipt"
                            component={ReceiptScreen}
                            options={{ headerShown: false }}
                        />

                        {/* Technician Screens */}
                        <Stack.Screen
                            name="TechnicianDashboard"
                            component={TechnicianDashboardScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="JobRequest"
                            component={JobRequestScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="JobDetails"
                            component={JobDetailsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Arrival"
                            component={ArrivalScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ServiceProgress"
                            component={ServiceProgressScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CODCollection"
                            component={CODCollectionScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TechnicianOTP"
                            component={TechnicianOTPScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="WalletUpdate"
                            component={WalletUpdateScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TechnicianWallet"
                            component={TechnicianWalletScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CommissionPayment"
                            component={CommissionPaymentScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PayCommission"
                            component={PayCommissionScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CommissionPaid"
                            component={CommissionPaidScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TechnicianHistory"
                            component={TechnicianHistoryScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="WithdrawalRequest"
                            component={WithdrawalRequestScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TechnicianProfile"
                            component={TechnicianProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TechnicianNavigation"
                            component={TechnicianNavigationScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Driver"
                            component={DriverScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="RazorpayCheckout"
                            component={RazorpayCheckoutScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="KYC"
                            component={KYCScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="VerificationPending"
                            component={VerificationPendingScreen}
                            options={{ headerShown: false }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
