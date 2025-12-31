import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './src/screens/AuthScreen';
import SplashScreen from './src/screens/SplashScreen';

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
import WalletScreen from './src/screens/customer/WalletScreen';
import HistoryScreen from './src/screens/customer/HistoryScreen';
import CustomerRazorpayCheckoutScreen from './src/screens/customer/CustomerRazorpayCheckoutScreen';

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
import DriverScreen from './src/screens/technician/DriverScreen'; // Legacy - keep for existing tracking
import RazorpayCheckoutScreen from './src/screens/technician/RazorpayCheckoutScreen';

import authService from './src/services/authService';
import { COLORS } from './src/constants/theme';

const Stack = createStackNavigator();

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token;
            let role = null;
            try {
                token = await authService.isLoggedIn();
                if (token) {
                    const user = await authService.getUser();
                    role = user?.role || 'customer';
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
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={
                    !userToken ? "Splash" :
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
                    name="Wallet"
                    component={WalletScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CustomerRazorpayCheckout"
                    component={CustomerRazorpayCheckoutScreen}
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}
