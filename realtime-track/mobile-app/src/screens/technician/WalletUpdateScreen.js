import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function WalletUpdateScreen({ route, navigation }) {
    const { amount, earnings, commission } = route?.params || {};
    const displayAmount = amount || 1200;
    const displayCommission = commission || (displayAmount * 0.20).toFixed(0);
    const netEarnings = earnings || (displayAmount - displayCommission).toFixed(0);

    const scaleAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <Ionicons name="checkmark-circle" size={80} color={COLORS.earningsGreen} />
                </Animated.View>

                <Text style={styles.title}>Wallet Update Success!</Text>
                <Text style={styles.subtitle}>Your payment has been confirmed</Text>

                <View style={styles.earningsCard}>
                    <Text style={styles.earningsLabel}>Net Earnings Credited</Text>
                    <Text style={styles.earningsAmount}>₹{netEarnings}</Text>

                    <View style={styles.divider} />

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Total Collection</Text>
                        <Text style={styles.breakdownValue}>₹{amount}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Commission (Pending)</Text>
                        <Text style={[styles.breakdownValue, { color: COLORS.warningAmber }]}>-₹{commission}</Text>
                    </View>
                </View>

                <View style={styles.warningCard}>
                    <Ionicons name="alert-circle-outline" size={20} color={COLORS.warningAmber} />
                    <Text style={styles.warningText}>Commission pending: ₹{commission}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.walletBtn}
                    onPress={() => navigation.navigate('TechnicianWallet')}
                >
                    <Text style={styles.walletBtnText}>Go to Wallet</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.heavy,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.sm },
    subtitle: { fontSize: 15, color: COLORS.grey, marginBottom: SPACING.xxl },
    earningsCard: {
        width: '100%',
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 25,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.medium,
    },
    earningsLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginBottom: 8 },
    earningsAmount: { fontSize: 40, fontWeight: '900', color: COLORS.white, marginBottom: SPACING.lg },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: SPACING.md },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    breakdownLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
    breakdownValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.warningAmber + '15',
        padding: SPACING.md,
        borderRadius: 12,
        width: '100%',
    },
    warningText: { fontSize: 14, fontWeight: '600', color: COLORS.warningAmber },
    footer: { padding: SPACING.xl, width: '100%' },
    walletBtn: {
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    walletBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
