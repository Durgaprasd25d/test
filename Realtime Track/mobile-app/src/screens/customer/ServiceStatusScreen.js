import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import customerSocketService from '../../services/customerSocketService';

const { width } = Dimensions.get('window');

export default function ServiceStatusScreen({ route, navigation }) {
    const { rideId, otp, initialStep = 'in_progress', total, paymentTiming } = route?.params || {};
    const [step, setStep] = useState(initialStep); // in_progress, service_ended, completed, rating
    const [showPayButton, setShowPayButton] = useState(false);
    const [serviceAmount, setServiceAmount] = useState(total || 0);

    useEffect(() => {
        const socket = customerSocketService.getSocket();
        if (socket) {
            // Listen for service ended event
            socket.on('ride:service_ended', (data) => {
                console.log('🔔 Service ended event received:', data);
                if (data.price) {
                    setServiceAmount(data.price); // Update amount from backend
                }
                if (data.paymentTiming === 'POSTPAID' && data.paymentMethod === 'ONLINE') {
                    // Show payment button for postpaid bookings
                    setStep('service_ended');
                    setShowPayButton(true);
                } else if (data.paymentTiming === 'PREPAID') {
                    // For prepaid, service is complete, no payment needed
                    setStep('completed');
                }
            });

            // Listen for payment success
            socket.on('payment:success', () => {
                console.log('💰 Payment successful');
                setShowPayButton(false);
                setStep('completed');
            });

            socket.on('ride:completed', () => {
                setStep('completed');
            });
        }

        return () => {
            if (socket) {
                socket.off('ride:service_ended');
                socket.off('payment:success');
                socket.off('ride:completed');
            }
        };
    }, []);

    const renderInProgress = () => (
        <View style={styles.center}>
            <View style={styles.otpCard}>
                <Text style={styles.otpLabel}>SHARE OTP WITH TECHNICIAN</Text>
                <Text style={styles.otpCode}>{otp}</Text>
                <Text style={styles.otpDesc}>This ensures that the service is being performed by the right person.</Text>
            </View>

            <View style={styles.statusBox}>
                <View style={styles.loadingRing}>
                    <Ionicons name="cog" size={50} color={COLORS.roseGold} />
                </View>
                <Text style={styles.statusTitle}>Service in Progress</Text>
                <Text style={styles.statusSubtitle}>Your AC unit is being serviced by our expert.</Text>
            </View>
        </View>
    );

    const renderServiceEnded = () => (
        <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.gold }]}>
                <Ionicons name="checkmark-done" size={80} color={COLORS.white} />
            </View>
            <Text style={styles.statusTitle}>Service Completed!</Text>
            <Text style={styles.statusSubtitle}>The technician has finished the service. Please complete the payment to proceed.</Text>

            <View style={styles.paymentCard}>
                <Text style={styles.paymentLabel}>Amount to Pay</Text>
                <Text style={styles.paymentAmount}>₹{serviceAmount}</Text>
            </View>

            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.roseGold, flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => {
                    navigation.navigate('CustomerRazorpayCheckout', {
                        rideId: rideId,
                        amount: serviceAmount,
                        paymentTiming: 'POSTPAID'
                    });
                }}
            >
                <Ionicons name="card" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Pay Now</Text>
            </TouchableOpacity>

            <Text style={styles.secureText}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.grey} /> Secure payment via Razorpay
            </Text>
        </View>
    );

    const renderCompleted = () => (
        <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.success }]}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.white} />
            </View>
            <Text style={styles.statusTitle}>Service Completed!</Text>
            <Text style={styles.statusSubtitle}>Thank you for choosing Zyro AC. We hope you are satisfied with the result.</Text>

            <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setStep('rating')}
            >
                <Text style={styles.actionBtnText}>Rate Service</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRating = () => (
        <View style={styles.center}>
            <Text style={styles.statusTitle}>Rate your experience</Text>
            <Text style={styles.statusSubtitle}>How was the technician's performance?</Text>

            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name="star" size={40} color={COLORS.gold} />
                ))}
            </View>

            <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.replace('Home')}
            >
                <Text style={styles.actionBtnText}>Submit & Exit</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>SERVICE STATUS</Text>
            </View>

            <View style={styles.content}>
                {step === 'in_progress' && renderInProgress()}
                {step === 'service_ended' && renderServiceEnded()}
                {step === 'completed' && renderCompleted()}
                {step === 'rating' && renderRating()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { padding: SPACING.lg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    content: { flex: 1, justifyContent: 'center', padding: SPACING.xxl },
    center: { alignItems: 'center' },
    otpCard: { backgroundColor: COLORS.primaryBg, padding: SPACING.xl, borderRadius: 25, width: '100%', alignItems: 'center', marginBottom: 50, borderWidth: 1, borderColor: COLORS.roseGoldMuted },
    otpLabel: { fontSize: 12, fontWeight: '800', color: COLORS.roseGold, marginBottom: 15, letterSpacing: 1 },
    otpCode: { fontSize: 56, fontWeight: '900', color: COLORS.black, letterSpacing: 10 },
    otpDesc: { fontSize: 13, color: COLORS.grey, textAlign: 'center', marginTop: 15, lineHeight: 18 },
    statusBox: { alignItems: 'center' },
    loadingRing: { width: 100, height: 100, borderRadius: 50, borderWeight: 2, borderColor: COLORS.roseGold, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
    statusTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.sm, textAlign: 'center' },
    statusSubtitle: { fontSize: 16, color: COLORS.grey, textAlign: 'center', lineHeight: 22 },
    iconCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
    actionBtn: { backgroundColor: COLORS.roseGold, height: 56, width: '100%', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 40, ...SHADOWS.medium },
    actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    starsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.xl },
    paymentCard: { backgroundColor: COLORS.primaryBg, padding: SPACING.xl, borderRadius: 20, width: '100%', alignItems: 'center', marginTop: 30, borderWidth: 2, borderColor: COLORS.roseGoldMuted },
    paymentLabel: { fontSize: 14, color: COLORS.grey, marginBottom: 8, fontWeight: '600' },
    paymentAmount: { fontSize: 42, fontWeight: '900', color: COLORS.roseGold },
    secureText: { fontSize: 12, color: COLORS.grey, marginTop: 15, textAlign: 'center' },
});
