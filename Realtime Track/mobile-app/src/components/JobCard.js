import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function JobCard({ job, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="build-outline" size={20} color={COLORS.technicianPrimary} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.serviceType}>{job.serviceType || 'AC Service'}</Text>
                    <Text style={styles.jobId}>#{job.id?.substring(0, 8) || 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, job.status === 'completed' && styles.completedBadge]}>
                    <Text style={styles.statusText}>{job.status || 'PENDING'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.grey} />
                    <Text style={styles.detailText} numberOfLines={1}>{job.location || 'Location'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.grey} />
                    <Text style={styles.detailText}>{job.duration || '1 hr'}</Text>
                </View>
                {job.earnings && (
                    <View style={styles.earningsRow}>
                        <Ionicons name="cash-outline" size={16} color={COLORS.earningsGreen} />
                        <Text style={styles.earningsText}>₹{job.earnings}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.md,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.technicianLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    headerInfo: { flex: 1 },
    serviceType: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    jobId: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
    statusBadge: {
        backgroundColor: COLORS.warningAmber,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedBadge: { backgroundColor: COLORS.earningsGreen },
    statusText: { fontSize: 10, fontWeight: '800', color: COLORS.white, textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: COLORS.greyLight, marginVertical: SPACING.sm },
    details: { gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13, color: COLORS.grey, flex: 1 },
    earningsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    earningsText: { fontSize: 14, fontWeight: 'bold', color: COLORS.earningsGreen },
});
