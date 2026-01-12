import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function JobDetailsScreen({ route, navigation }) {
    const { job } = route?.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>JOB ACCEPTED</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={60} color={COLORS.earningsGreen} />
                    <Text style={styles.successText}>Job Accepted Successfully!</Text>
                </View>

                <View style={styles.jobCard}>
                    <Text style={styles.cardLabel}>SERVICE TYPE</Text>
                    <Text style={styles.serviceType}>{job?.serviceType || 'AC Service'}</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Job ID</Text>
                        <Text style={styles.infoValue}>#{job?.id?.substring(0, 8) || '20194'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duration</Text>
                        <Text style={styles.infoValue}>{job?.duration || '1.5 Hrs'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{job?.distance || '4.5 km away'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Est. Time</Text>
                        <Text style={styles.infoValue}>{job?.eta || '20 mins'}</Text>
                    </View>
                </View>

                <View style={styles.customerCard}>
                    <Text style={styles.cardLabel}>CUSTOMER PHONE</Text>
                    <TouchableOpacity style={styles.phoneRow}>
                        <Ionicons name="call" size={20} color={COLORS.technicianPrimary} />
                        <Text style={styles.phoneText}>{job?.customerPhone || '+91 XXXXXXXXXX'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => navigation.navigate('TechnicianNavigation', { job })}
                >
                    <Ionicons name="navigate" size={20} color={COLORS.white} />
                    <Text style={styles.navBtnText}>Start Navigation</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.xl },
    successBanner: { alignItems: 'center', marginBottom: SPACING.xxl },
    successText: { fontSize: 18, fontWeight: 'bold', color: COLORS.earningsGreen, marginTop: SPACING.md },
    jobCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.greyLight, marginBottom: SPACING.lg },
    cardLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.grey, letterSpacing: 1, marginBottom: SPACING.sm },
    serviceType: { fontSize: 20, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.md },
    divider: { height: 1, backgroundColor: COLORS.greyLight, marginVertical: SPACING.md },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    infoLabel: { fontSize: 14, color: COLORS.grey },
    infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    customerCard: { backgroundColor: COLORS.technicianBg, borderRadius: 15, padding: SPACING.md },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    phoneText: { fontSize: 16, fontWeight: '600', color: COLORS.technicianDark },
    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.technicianPrimary, height: 56, borderRadius: 16, ...SHADOWS.medium },
    navBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
