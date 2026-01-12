import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

const { width } = Dimensions.get('window');

export default function JobRequestScreen({ route, navigation }) {
    const { job } = route?.params || {};
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Auto-reject after timeout
                    navigation.goBack();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleAccept = async () => {
        setAccepting(true);
        const result = await technicianService.acceptJob(job.id);
        if (result.success) {
            navigation.replace('JobDetails', { job: result.job, accepted: true });
        } else {
            Alert.alert('Error', result.error || 'Failed to accept job');
            setAccepting(false);
        }
    };

    const handleReject = () => {
        // TODO: Call backend API to reject job if needed
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>New Job Request</Text>
                <View style={styles.timerBadge}>
                    <Ionicons name="time-outline" size={16} color={COLORS.white} />
                    <Text style={styles.timerText}>{timeRemaining}s</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.serviceCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="build-outline" size={32} color={COLORS.technicianPrimary} />
                    </View>
                    <Text style={styles.serviceType}>{job?.serviceType || 'AC Repair (Gold)'}</Text>
                    <Text style={styles.location}>{job?.location || 'AS Ragal Jaldi, New Delhi'}</Text>
                </View>

                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color={COLORS.grey} />
                        <Text style={styles.detailLabel}>Distance</Text>
                        <Text style={styles.detailValue}>{job?.distance || '4.5 km'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                        <Text style={styles.detailLabel}>Est. Duration</Text>
                        <Text style={styles.detailValue}>{job?.duration || '1.5 hrs'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="cash-outline" size={20} color={COLORS.earningsGreen} />
                        <Text style={styles.detailLabel}>Earnings</Text>
                        <Text style={[styles.detailValue, { color: COLORS.earningsGreen, fontWeight: 'bold' }]}>₹{job?.earnings || '1200'}</Text>
                    </View>
                </View>

                <View style={styles.customerCard}>
                    <Text style={styles.customerLabel}>CUSTOMER PHONE</Text>
                    <View style={styles.phoneRow}>
                        <Ionicons name="call-outline" size={18} color={COLORS.technicianPrimary} />
                        <Text style={styles.phoneText}>{job?.customerPhone || '+91 XXXXXXXXXX'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    timerText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    content: { flex: 1, padding: SPACING.xl },
    serviceCard: { backgroundColor: COLORS.technicianLight, borderRadius: 25, padding: SPACING.xxl, alignItems: 'center', marginBottom: SPACING.xl, ...SHADOWS.light },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    serviceType: { fontSize: 22, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.sm, textAlign: 'center' },
    location: { fontSize: 14, color: COLORS.grey, textAlign: 'center' },
    detailsCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.greyLight, marginBottom: SPACING.lg, gap: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    detailLabel: { flex: 1, fontSize: 14, color: COLORS.grey },
    detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    customerCard: { backgroundColor: COLORS.technicianBg, borderRadius: 15, padding: SPACING.md },
    customerLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.grey, marginBottom: 8, letterSpacing: 1 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    phoneText: { fontSize: 16, fontWeight: '600', color: COLORS.technicianDark },
    footer: { flexDirection: 'row', padding: SPACING.lg, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    rejectBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.error, justifyContent: 'center', alignItems: 'center' },
    rejectBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.error },
    acceptBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: COLORS.technicianPrimary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
    acceptBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
