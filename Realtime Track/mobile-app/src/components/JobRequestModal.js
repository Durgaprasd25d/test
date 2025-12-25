import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function JobRequestModal({ visible, jobData, onAccept, onReject }) {
    if (!jobData) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onReject}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="notifications" size={32} color={COLORS.white} />
                        </View>
                        <Text style={styles.headerTitle}>New Job Request!</Text>
                        <Text style={styles.headerSubtitle}>A customer needs your service</Text>
                    </View>

                    {/* Job Details */}
                    <View style={styles.content}>
                        <View style={styles.detailRow}>
                            <Ionicons name="construct" size={20} color={COLORS.technicianPrimary} />
                            <View style={styles.detailText}>
                                <Text style={styles.detailLabel}>Service Type</Text>
                                <Text style={styles.detailValue}>{jobData.serviceType || 'General Service'}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Ionicons name="location" size={20} color={COLORS.technicianPrimary} />
                            <View style={styles.detailText}>
                                <Text style={styles.detailLabel}>Customer Location</Text>
                                <Text style={styles.detailValue} numberOfLines={2}>
                                    {jobData.pickup?.address || 'Location not available'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Ionicons name="card" size={20} color={COLORS.technicianPrimary} />
                            <View style={styles.detailText}>
                                <Text style={styles.detailLabel}>Job ID</Text>
                                <Text style={styles.detailValue}>{jobData.rideId || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={onReject}
                        >
                            <Ionicons name="close-circle" size={20} color={COLORS.error} />
                            <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={onAccept}
                        >
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                            <Text style={styles.acceptText}>Accept Job</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingBottom: SPACING.xxl,
        maxHeight: '70%',
    },
    header: {
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: COLORS.technicianPrimary,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    content: {
        padding: SPACING.xl,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: SPACING.md,
    },
    detailText: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.grey,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.greyLight,
        marginVertical: SPACING.sm,
    },
    actions: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    rejectButton: {
        backgroundColor: COLORS.greyLight,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    acceptButton: {
        backgroundColor: COLORS.technicianPrimary,
        ...SHADOWS.medium,
    },
    rejectText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.error,
    },
    acceptText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
});
