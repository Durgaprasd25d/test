import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../constants/theme';
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
            <body style="background-color: #f8fafc; margin: 0; padding: 0;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px;">
                    <div style="width: 60px; height: 60px; border: 4px solid ${COLORS.indigo}20; border-top: 4px solid ${COLORS.indigo}; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 24px;"></div>
                    <h3 style="color: ${COLORS.slate}; margin: 0 0 12px 0; font-weight: 800;">Securing Transaction...</h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Please wait while we redirect you to our secure payment gateway.</p>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
                <script>
                    const options = {
                        "key": "${config.RAZORPAY_KEYID}",
                        "amount": "${orderDetails.amount}",
                        "currency": "INR",
                        "name": "Zyro Premium",
                        "description": "${paymentTiming === 'PREPAID' ? 'Priority Booking' : 'Service Settlement'}",
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
                            "color": "${COLORS.indigo}"
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
                const verifyResult = await rideService.verifyRazorpayPayment(rideId, {
                    ...data.data,
                    amount: amount
                });

                if (verifyResult.success) {
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[COLORS.slate, COLORS.slateLight]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Secure Payment</Text>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading || !orderDetails ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.indigo} />
                    <Text style={styles.loadingText}>Initializing secure channel...</Text>
                </View>
            ) : (
                <WebView
                    originWhitelist={['*']}
                    source={{ html: razorpayHtml }}
                    onMessage={handleMessage}
                    style={{ flex: 1 }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.webLoading}>
                            <ActivityIndicator size="small" color={COLORS.indigo} />
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.premiumBg
    },
    header: {
        paddingBottom: 15,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.medium,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 20,
        fontSize: 15,
        color: COLORS.textMuted,
        fontWeight: '600'
    },
    webLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
});

