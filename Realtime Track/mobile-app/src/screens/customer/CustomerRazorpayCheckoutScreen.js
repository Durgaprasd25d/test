import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import config from '../../constants/config';
import rideService from '../../services/rideService';

export default function CustomerRazorpayCheckoutScreen({ route, navigation }) {
    const { rideId, amount, paymentTiming } = route.params;
    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState(null);

    React.useEffect(() => {
        createOrder();
    }, []);

    const createOrder = async () => {
        setLoading(true);
        const result = await rideService.createRazorpayOrder(rideId, amount);
        if (result.success) {
            setOrderDetails(result.order);
            setLoading(false);
        } else {
            setLoading(false);
            alert('Failed to create payment order: ' + result.error);
            navigation.goBack();
        }
    };

    const razorpayHtml = orderDetails ? `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body style="background-color: #f8f9fa;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                    <h3 style="color: ${COLORS.roseGold};">Redirecting to Secure Payment...</h3>
                    <p>Please do not close this window.</p>
                </div>
                <script>
                    const options = {
                        "key": "${config.RAZORPAY_KEYID}",
                        "amount": "${orderDetails.amount}",
                        "currency": "INR",
                        "name": "Zyro AC",
                        "description": "${paymentTiming === 'PREPAID' ? 'Booking Payment' : 'Service Payment'}",
                        "order_id": "${orderDetails.id}",
                        "handler": function (response) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                event: 'success',
                                data: response
                            }));
                        },
                        "modal": {
                            "ondismiss": function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    event: 'dismiss'
                                }));
                            }
                        },
                        "theme": {
                            "color": "${COLORS.roseGold}"
                        }
                    };
                    const rzp = new Razorpay(options);
                    rzp.open();
                </script>
            </body>
        </html>
    ` : '';

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.event === 'success') {
                // Verify payment with backend
                const verifyResult = await rideService.verifyRazorpayPayment(rideId, {
                    ...data.data,
                    amount: amount
                });

                if (verifyResult.success) {
                    // Navigate to success screen
                    navigation.replace('PaymentStatus', {
                        status: 'success',
                        rideId: rideId,
                        total: amount,
                        paymentMethod: 'online',
                        paymentTiming: paymentTiming
                    });
                } else {
                    alert('Payment verification failed: ' + verifyResult.error);
                    navigation.goBack();
                }
            } else if (data.event === 'dismiss') {
                navigation.goBack();
            }
        } catch (err) {
            console.error('WebView message error:', err);
        }
    };

    if (loading || !orderDetails) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.roseGold} />
                    <Text style={styles.loadingText}>Creating payment order...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SECURE CHECKOUT</Text>
                <View style={{ width: 24 }} />
            </View>
            <WebView
                originWhitelist={['*']}
                source={{ html: razorpayHtml }}
                onMessage={handleMessage}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 20, fontSize: 16, color: COLORS.grey },
});
