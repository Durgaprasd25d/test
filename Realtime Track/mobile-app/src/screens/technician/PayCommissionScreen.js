import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

const PAYMENT_METHODS = [
    { id: 'upi', name: 'UPI Payment', icon: 'phone-portrait-outline', desc: 'Pay via UPI apps' },
    { id: 'qr', name: 'QR Code', icon: 'qr-code-outline', desc: 'Scan & pay' },
    { id: 'razorpay', name: 'Razorpay', icon: 'card-outline', desc: 'Cards, Netbanking' },
];

export default function PayCommissionScreen({ route, navigation }) {
    const { amount } = route?.params || {};
    const [selectedMethod, setSelectedMethod] = useState('razorpay');
    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        setProcessing(true);
        const result = await technicianService.payCommission(amount, selectedMethod);

        if (result.success) {
            navigation.navigate('CommissionPaid', {
                amount,
                balance: result.balance
            });
        } else {
            Alert.alert('Error', result.error || 'Payment failed');
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PAY COMMISSION</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Commission Amount</Text>
                    <Text style={styles.amountValue}>₹{amount || 480}</Text>
                </View>

                <Text style={styles.sectionTitle}>Select Payment Method</Text>
                {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                        key={method.id}
                        style={[styles.methodCard, selectedMethod === method.id && styles.activeMethod]}
                        onPress={() => setSelectedMethod(method.id)}
                    >
                        <View style={styles.methodIcon}>
                            <Ionicons
                                name={method.icon}
                                size={24}
                                color={selectedMethod === method.id ? COLORS.white : COLORS.technicianPrimary}
                            />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodName, selectedMethod === method.id && styles.activeText]}>{method.name}</Text>
                            <Text style={[styles.methodDesc, selectedMethod === method.id && styles.activeDescText]}>{method.desc}</Text>
                        </View>
                        <View style={styles.radio}>
                            {selectedMethod === method.id && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>
                ))}

                {selectedMethod === 'qr' && (
                    <View style={styles.qrCard}>
                        <View style={styles.qrPlaceholder}>
                            <Ionicons name="qr-code" size={120} color={COLORS.technicianPrimary} />
                        </View>
                        <Text style={styles.qrText}>Scan this QR code to pay</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.payBtnText}>Confirm Payment</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.lg },
    amountCard: {
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 25,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.medium,
    },
    amountLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginBottom: 8 },
    amountValue: { fontSize: 40, fontWeight: '900', color: COLORS.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.md },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
        backgroundColor: COLORS.white,
        marginBottom: SPACING.md,
    },
    activeMethod: {
        borderColor: COLORS.technicianPrimary,
        backgroundColor: COLORS.technicianPrimary,
    },
    methodIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.technicianLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    methodInfo: { flex: 1 },
    methodName: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    methodDesc: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    activeText: { color: COLORS.white },
    activeDescText: { color: COLORS.white, opacity: 0.8 },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.white },
    qrCard: {
        alignItems: 'center',
        backgroundColor: COLORS.technicianLight,
        borderRadius: 20,
        padding: SPACING.xl,
        marginTop: SPACING.md,
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    qrText: { fontSize: 14, color: COLORS.grey },
    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    payBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        ...SHADOWS.medium,
    },
    payBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
