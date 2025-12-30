import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import config from '../../constants/config';

export default function RazorpayCheckoutScreen({ route, navigation }) {
    const { order, amount, userId } = route.params;

    const razorpayHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body style="background-color: #f8f9fa;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                    <h3 style="color: ${COLORS.technicianPrimary};">Redirecting to Secure Payment...</h3>
                    <p>Please do not close this window.</p>
                </div>
                <script>
                    const options = {
                        "key": "${config.RAZORPAY_KEYID}",
                        "amount": "${order.amount}",
                        "currency": "INR",
                        "name": "Service Dues Payment",
                        "description": "Paying Company Commission",
                        "order_id": "${order.id}",
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
                            "color": "${COLORS.technicianPrimary}"
                        }
                    };
                    const rzp = new Razorpay(options);
                    rzp.open();
                </script>
            </body>
        </html>
    `;

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.event === 'success') {
                navigation.replace('CommissionPaid', {
                    paymentData: data.data,
                    amount: amount
                });
            } else if (data.event === 'dismiss') {
                navigation.goBack();
            }
        } catch (err) {
            console.error('WebView message error:', err);
        }
    };

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
});
