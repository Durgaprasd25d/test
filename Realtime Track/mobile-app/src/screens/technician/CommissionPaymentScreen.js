import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

const PENDING_JOBS = [
    { id: 'JR-271254', amount: 240, date: '25 Dec', total: 1200 },
    { id: 'JR-271253', amount: 240, date: '24 Dec', total: 1200 },
];

export default function CommissionPaymentScreen({ route, navigation }) {
    const { pending } = route?.params || {};
    const [totalCommission, setTotalCommission] = useState(pending || 0);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingCommission();
    }, []);

    const loadPendingCommission = async () => {
        const result = await technicianService.getPendingCommission();
        if (result.success) {
            setTotalCommission(result.total);
            setJobs(result.jobs || PENDING_JOBS);
        }
        setLoading(false);
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PENDING COMMISSION</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.totalCard}>
                    <Ionicons name="alert-circle" size={40} color={COLORS.warningAmber} />
                    <Text style={styles.totalLabel}>Total Pending Commission</Text>
                    <Text style={styles.totalAmount}>₹{totalCommission}</Text>
                </View>

                <Text style={styles.sectionTitle}>Job Breakdown</Text>
                {jobs.map(job => (
                    <View key={job.id} style={styles.jobCard}>
                        <View style={styles.jobHeader}>
                            <Text style={styles.jobId}>JOB #{job.id}</Text>
                            <Text style={styles.jobDate}>{job.date}</Text>
                        </View>
                        <View style={styles.jobRow}>
                            <Text style={styles.jobLabel}>Service Total</Text>
                            <Text style={styles.jobValue}>₹{job.total}</Text>
                        </View>
                        <View style={styles.jobRow}>
                            <Text style={styles.jobLabel}>Commission (20%)</Text>
                            <Text style={[styles.jobValue, { color: COLORS.warningAmber, fontWeight: 'bold' }]}>₹{job.amount}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.footerLabel}>Total to Pay</Text>
                    <Text style={styles.footerAmount}>₹{totalCommission}</Text>
                </View>
                <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => navigation.navigate('PayCommission', { amount: totalCommission })}
                >
                    <Text style={styles.payBtnText}>Pay Commission</Text>
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
    totalCard: {
        backgroundColor: COLORS.warningAmber + '15',
        borderRadius: 25,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 2,
        borderColor: COLORS.warningAmber,
    },
    totalLabel: { fontSize: 14, color: COLORS.grey, marginTop: SPACING.md, marginBottom: 8 },
    totalAmount: { fontSize: 36, fontWeight: '900', color: COLORS.warningAmber },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.md },
    jobCard: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 15,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    jobId: { fontSize: 13, fontWeight: 'bold', color: COLORS.technicianDark },
    jobDate: { fontSize: 12, color: COLORS.grey },
    jobRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    jobLabel: { fontSize: 13, color: COLORS.grey },
    jobValue: { fontSize: 13, fontWeight: '600', color: COLORS.black },
    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    footerLabel: { fontSize: 16, fontWeight: '600', color: COLORS.black },
    footerAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.technicianDark },
    payBtn: {
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    payBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
