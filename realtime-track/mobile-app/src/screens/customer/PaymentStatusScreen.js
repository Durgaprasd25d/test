import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function PaymentStatusScreen({ route, navigation }) {
    const { status, rideId, total, paymentMethod } = route?.params || {};
    const [step, setStep] = useState('processing'); // processing, success, confirmed

    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setStep('success');
            animateSuccess();
        }, 1800);

        const timer2 = setTimeout(() => {
            setStep('confirmed');
        }, 3800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const animateSuccess = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();
    };

    const renderProcessing = () => (
        <View style={styles.center}>
            <View style={styles.spinnerContainer}>
                <LinearGradient
                    colors={['rgba(79, 70, 229, 0.1)', 'transparent']}
                    style={styles.spinnerBg}
                />
                <Ionicons name="shield-checkmark" size={60} color={COLORS.indigo} />
            </View>
            <Text style={styles.statusTitle}>Securing Booking</Text>
            <Text style={styles.statusSubtitle}>Verifying details and connecting with nearby verified professionals...</Text>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.center}>
            <Animated.View style={[
                styles.successIconBox,
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: '#22c55e' }
            ]}>
                <Ionicons name="checkmark" size={70} color="#fff" />
            </Animated.View>
            <Text style={styles.statusTitle}>Payment Verified</Text>
            <Text style={styles.statusSubtitle}>
                {paymentMethod === 'cod' ? 'Booking confirmed. Pay after service.' : `Amount of ₹${total} successfully secured.`}
            </Text>
        </View>
    );

    const renderConfirmed = () => (
        <View style={styles.center}>
            <View style={[styles.successIconBox, { backgroundColor: COLORS.indigo }]}>
                <Ionicons name="checkmark-done" size={70} color="#fff" />
            </View>
            <Text style={styles.statusTitle}>Confirmed!</Text>
            <Text style={styles.statusSubtitle}>Your cooling expert is being assigned. Live tracking will begin shortly.</Text>

            <View style={styles.jobInfoCard}>
                <View style={styles.jobIdContainer}>
                    <Text style={styles.jobIdLabel}>REFERENCE ID</Text>
                    <Text style={styles.jobIdValue}>{rideId?.toUpperCase() || 'ZYRO-BOOK-99'}</Text>
                </View>
                <TouchableOpacity style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={18} color={COLORS.indigo} />
                </TouchableOpacity>
            </View>

            <View style={styles.timelineCard}>
                <View style={styles.timelineItem}>
                    <View style={styles.timelinePointActive} />
                    <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>Booking Received</Text>
                        <Text style={styles.timelineDesc}>Verified & Secured • Just now</Text>
                    </View>
                </View>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                    <View style={styles.timelinePoint} />
                    <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>Technician Assignment</Text>
                        <Text style={styles.timelineDesc}>Finding best expert nearby...</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.trackBtn}
                activeOpacity={0.8}
                onPress={() => navigation.replace('Customer', { rideId, serviceType: 'service' })}
            >
                <LinearGradient
                    colors={[COLORS.indigo, '#3730a3']}
                    style={styles.trackBtnGradient}
                >
                    <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.trackBtnText}>Enter Live Tracking</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                {step === 'processing' && renderProcessing()}
                {step === 'success' && renderSuccess()}
                {step === 'confirmed' && renderConfirmed()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.premiumBg
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32
    },
    spinnerContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    spinnerBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 70,
    },
    successIconBox: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        ...SHADOWS.medium
    },
    statusTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.textMain,
        marginBottom: 12,
        textAlign: 'center'
    },
    statusSubtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },
    jobInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginTop: 40,
        width: '100%',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.light,
    },
    jobIdContainer: {
        flex: 1
    },
    jobIdLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6
    },
    jobIdValue: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textMain,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
    },
    copyBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.light,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelinePointActive: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.indigo,
        zIndex: 2,
    },
    timelinePoint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e2e8f0',
        zIndex: 2,
    },
    timelineLine: {
        width: 2,
        height: 30,
        backgroundColor: '#f1f5f9',
        marginLeft: 5,
        marginVertical: -2,
    },
    timelineContent: {
        marginLeft: 16,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    timelineDesc: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
        fontWeight: '500',
    },
    trackBtn: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        marginTop: 40,
        overflow: 'hidden',
        ...SHADOWS.medium
    },
    trackBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },
});

