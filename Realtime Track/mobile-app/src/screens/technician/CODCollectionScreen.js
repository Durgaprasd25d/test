import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function CODCollectionScreen({ route, navigation }) {
    const { job } = route?.params || {};
    const amount = job?.amount || 1200;

    const handleProceed = () => {
        navigation.navigate('TechnicianOTP', { job, amount });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>COD COLLECTION</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.amountCard}>
                    <Ionicons name="cash" size={60} color={COLORS.white} />
                    <Text style={styles.amountLabel}>Total to Collect</Text>
                    <Text style={styles.amountValue}>₹{amount}</Text>
                    <Text style={styles.amountNote}>Please collect this amount from the customer</Text>
                </View>

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle-outline" size={24} color={COLORS.info} />
                    <Text style={styles.noteText}>After collecting payment, please verify the customer's OTP to complete the service.</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                    <Text style={styles.proceedBtnText}>Proceed to Payment Verification</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
    amountCard: {
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 30,
        padding: SPACING.xxl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.heavy,
    },
    amountLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: SPACING.lg },
    amountValue: { fontSize: 48, fontWeight: '900', color: COLORS.white, marginVertical: SPACING.sm },
    amountNote: { fontSize: 13, color: COLORS.white, opacity: 0.8, textAlign: 'center' },
    noteCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: COLORS.info + '15',
        padding: SPACING.lg,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
    },
    noteText: { flex: 1, fontSize: 14, color: COLORS.info, lineHeight: 20 },
    footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    proceedBtn: {
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    proceedBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
