import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

export default function TechnicianOTPScreen({ route, navigation }) {
    const { job, amount } = route?.params || {};
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async () => {
        if (otp.length !== 4) return;

        setVerifying(true);
        const result = await technicianService.verifyOTP(job.id, otp);

        if (result.success) {
            navigation.navigate('WalletUpdate', {
                job,
                amount: result.total,
                earnings: result.earnings,
                commission: result.commission
            });
        } else {
            Alert.alert('Error', result.error || 'Invalid OTP');
            setVerifying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CUSTOMER OTP VERIFICATION</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="shield-checkmark" size={60} color={COLORS.technicianPrimary} />
                </View>

                <Text style={styles.title}>Enter Customer OTP</Text>
                <Text style={styles.subtitle}>Ask the customer to provide the 4-digit OTP</Text>

                <View style={styles.otpContainer}>
                    <TextInput
                        style={styles.otpInput}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor={COLORS.greyMedium}
                    />
                </View>

                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Payment Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Pending</Text>
                        </View>
                    </View>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Amount</Text>
                        <Text style={styles.amountValue}>₹{amount || 1200}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.verifyBtn, otp.length !== 4 && styles.disabledBtn]}
                    onPress={handleVerify}
                    disabled={otp.length !== 4}
                >
                    <Text style={styles.verifyBtnText}>Verify OTP</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    content: { flex: 1, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.technicianLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.sm },
    subtitle: { fontSize: 14, color: COLORS.grey, textAlign: 'center', marginBottom: SPACING.xxl },
    otpContainer: { width: '80%', marginBottom: SPACING.xl },
    otpInput: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 20,
        backgroundColor: COLORS.greyLight,
        borderRadius: 20,
        padding: SPACING.lg,
        color: COLORS.technicianDark,
    },
    statusCard: {
        width: '100%',
        backgroundColor: COLORS.technicianBg,
        borderRadius: 15,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.technicianAccent,
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusLabel: { fontSize: 14, color: COLORS.grey },
    statusBadge: { backgroundColor: COLORS.warningAmber, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', color: COLORS.white },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: 14, color: COLORS.grey },
    amountValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.technicianDark },
    footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    verifyBtn: {
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    disabledBtn: { backgroundColor: COLORS.greyMedium },
    verifyBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
