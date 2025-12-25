import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function CommissionPaidScreen({ route, navigation }) {
    const { amount } = route?.params || {};
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

                <Text style={styles.title}>Commission Paid Successfully!</Text>
                <Text style={styles.subtitle}>Payment confirmed</Text>

                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Paid</Text>
                        <Text style={styles.detailValue}>₹{amount || 480}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Updated Balance</Text>
                        <Text style={[styles.detailValue, { color: COLORS.earningsGreen }]}>₹2,160</Text>
                    </View>
                </View>

                <View style={styles.successNote}>
                    <Ionicons name="checkmark-done-circle" size={20} color={COLORS.earningsGreen} />
                    <Text style={styles.noteText}>Your commission has been cleared. Continue accepting jobs!</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.walletBtn}
                    onPress={() => navigation.navigate('TechnicianWallet')}
                >
                    <Text style={styles.walletBtnText}>Back to Wallet</Text>
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
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.sm, textAlign: 'center' },
    subtitle: { fontSize: 15, color: COLORS.grey, marginBottom: SPACING.xxl },
    detailsCard: {
        width: '100%',
        backgroundColor: COLORS.greyLight,
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: 15, color: COLORS.grey },
    detailValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    divider: { height: 1, backgroundColor: COLORS.greyMedium, marginVertical: 15 },
    successNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.earningsGreen + '15',
        padding: SPACING.md,
        borderRadius: 12,
        width: '100%',
    },
    noteText: { flex: 1, fontSize: 13, color: COLORS.earningsGreen, fontWeight: '500' },
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
