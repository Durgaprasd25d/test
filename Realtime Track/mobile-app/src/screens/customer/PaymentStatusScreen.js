import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function PaymentStatusScreen({ route, navigation }) {
    const { status, rideId, total, paymentMethod } = route?.params || {};
    const [step, setStep] = useState('processing'); // processing, success, confirmed

    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        console.log('Payment Status Screen - Ride ID:', rideId);

        // Step 1: Processing
        const timer1 = setTimeout(() => {
            setStep('success');
            animateSuccess();
        }, 1500);

        // Step 2: Confirmation
        const timer2 = setTimeout(() => {
            setStep('confirmed');
        }, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const animateSuccess = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ]).start();
    };

    const renderProcessing = () => (
        <View style={styles.center}>
            <Animated.View style={styles.spinner}>
                <Ionicons name="sync" size={80} color={COLORS.roseGold} />
            </Animated.View>
            <Text style={styles.statusTitle}>Processing Booking</Text>
            <Text style={styles.statusSubtitle}>Finding nearby technicians...</Text>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.center}>
            <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: COLORS.success }]}>
                <Ionicons name="checkmark" size={60} color={COLORS.white} />
            </Animated.View>
            <Text style={styles.statusTitle}>Booking Success</Text>
            <Text style={styles.statusSubtitle}>
                {paymentMethod === 'cod' ? 'Pay after service completion' : `Payment of ₹${total} received`}
            </Text>
        </View>
    );

    const renderConfirmed = () => (
        <View style={styles.center}>
            <Animated.View style={[styles.iconBox, { backgroundColor: COLORS.roseGold }]}>
                <Ionicons name="checkmark-done-circle" size={60} color={COLORS.white} />
            </Animated.View>
            <Text style={styles.statusTitle}>Booking Confirmed!</Text>
            <View style={styles.jobIdCard}>
                <Text style={styles.jobIdLabel}>Job ID</Text>
                <Text style={styles.jobIdValue}>{rideId || 'Loading...'}</Text>
            </View>

            <View style={styles.detailsCard}>
                <View style={styles.detailItem}>
                    <Ionicons name="person" size={20} color={COLORS.roseGold} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.detailLabel}>Technician</Text>
                        <Text style={styles.detailValue}>Searching nearby...</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                    <Ionicons name="time" size={20} color={COLORS.roseGold} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.detailLabel}>Estimated Arrival</Text>
                        <Text style={styles.detailValue}>Within 30 mins</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => {
                    console.log('Navigating to live tracking with rideId:', rideId);
                    navigation.replace('Customer', { rideId, serviceType: 'service' });
                }}
            >
                <Ionicons name="navigate" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.trackBtnText}>Start Live Tracking</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {step === 'processing' && renderProcessing()}
            {step === 'success' && renderSuccess()}
            {step === 'confirmed' && renderConfirmed()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white, justifyContent: 'center' },
    center: { alignItems: 'center', padding: SPACING.xxl },
    spinner: { marginBottom: SPACING.xl },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.medium
    },
    statusTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.sm },
    statusSubtitle: { fontSize: 16, color: COLORS.grey, textAlign: 'center' },
    jobIdCard: {
        backgroundColor: COLORS.primaryBg,
        borderRadius: 15,
        padding: SPACING.lg,
        marginTop: SPACING.xl,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.roseGold,
        width: '100%',
    },
    jobIdLabel: { fontSize: 12, color: COLORS.grey, marginBottom: 4 },
    jobIdValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, fontFamily: 'monospace' },
    detailsCard: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 20,
        padding: SPACING.xl,
        width: '100%',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl
    },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailLabel: { fontSize: 12, color: COLORS.grey, marginBottom: 4 },
    detailValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
    divider: { height: 1, backgroundColor: COLORS.greyMedium, marginVertical: 15 },
    trackBtn: {
        backgroundColor: COLORS.roseGold,
        height: 56,
        width: '100%',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium
    },
    trackBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
