import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import config from '../constants/config';

const { height } = Dimensions.get('window');

export default function ServicesListSheet({ visible, onClose, technicianId, onAcceptJob }) {
    const [activeTab, setActiveTab] = useState('pending');
    const [jobs, setJobs] = useState({
        pending: [],
        accepted: [],
        inProgress: [],
        completed: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchJobs();
        }
    }, [visible, technicianId]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/ride/all-jobs?technicianId=${technicianId}`
            );
            const result = await response.json();
            if (result.success) {
                setJobs(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return COLORS.gold;
            case 'accepted':
                return COLORS.technicianPrimary;
            case 'inProgress':
                return COLORS.roseGold;
            case 'completed':
                return COLORS.success;
            default:
                return COLORS.grey;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return 'time-outline';
            case 'accepted':
                return 'checkmark-circle-outline';
            case 'inProgress':
                return 'cog-outline';
            case 'completed':
                return 'checkmark-done-circle';
            default:
                return 'ellipse-outline';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderJobItem = ({ item }) => {
        const isPending = activeTab === 'pending';

        return (
            <TouchableOpacity
                style={styles.jobItem}
                onPress={() => {
                    if (isPending && onAcceptJob) {
                        onAcceptJob(item);
                    }
                }}
            >
                <View style={styles.jobHeader}>
                    <View style={styles.jobTypeContainer}>
                        <Ionicons name="construct" size={18} color={COLORS.roseGold} />
                        <Text style={styles.jobType}>{item.serviceType.toUpperCase()}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>₹{item.price}</Text>
                    </View>
                </View>

                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={COLORS.grey} />
                    <Text style={styles.location} numberOfLines={2}>
                        {item.pickup?.address || 'Location not available'}
                    </Text>
                </View>

                <View style={styles.jobFooter}>
                    <View style={styles.paymentBadge}>
                        <Ionicons
                            name={item.paymentTiming === 'PREPAID' ? 'card' : 'time'}
                            size={12}
                            color={COLORS.technicianPrimary}
                        />
                        <Text style={styles.paymentText}>
                            {item.paymentTiming === 'PREPAID' ? 'Prepaid' : 'Postpaid'}
                        </Text>
                    </View>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>

                {isPending && (
                    <View style={styles.acceptButton}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                        <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const tabs = [
        { key: 'pending', label: 'Pending', count: jobs.pending.length },
        { key: 'accepted', label: 'Accepted', count: jobs.accepted.length },
        { key: 'inProgress', label: 'In Progress', count: jobs.inProgress.length },
        { key: 'completed', label: 'Completed', count: jobs.completed.length }
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.headerTitle}>Services</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsContainer}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tab,
                                    activeTab === tab.key && styles.activeTab
                                ]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Ionicons
                                    name={getStatusIcon(tab.key)}
                                    size={20}
                                    color={activeTab === tab.key ? COLORS.white : getStatusColor(tab.key)}
                                />
                                <Text style={[
                                    styles.tabText,
                                    activeTab === tab.key && styles.activeTabText
                                ]}>
                                    {tab.label}
                                </Text>
                                {tab.count > 0 && (
                                    <View style={[
                                        styles.badge,
                                        activeTab === tab.key && styles.activeBadge
                                    ]}>
                                        <Text style={[
                                            styles.badgeText,
                                            activeTab === tab.key && styles.activeBadgeText
                                        ]}>
                                            {tab.count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Jobs List */}
                    <ScrollView
                        style={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {jobs[activeTab] && jobs[activeTab].length > 0 ? (
                            jobs[activeTab].map((item, index) => (
                                <React.Fragment key={item._id || item.id || item.rideId || index.toString()}>
                                    {renderJobItem({ item })}
                                </React.Fragment>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="briefcase-outline" size={60} color={COLORS.greyLight} />
                                <Text style={styles.emptyText}>No {activeTab} jobs</Text>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: height * 0.85,
        ...SHADOWS.heavy,
    },
    header: {
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.greyMedium,
        borderRadius: 2,
        marginBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    closeButton: {
        position: 'absolute',
        right: SPACING.lg,
        top: SPACING.lg,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
    },
    tabsContent: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 20,
        marginRight: SPACING.sm,
        backgroundColor: COLORS.greyLight,
        gap: 6,
    },
    activeTab: {
        backgroundColor: COLORS.technicianPrimary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.grey,
    },
    activeTabText: {
        color: COLORS.white,
    },
    badge: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    activeBadge: {
        backgroundColor: COLORS.technicianLight,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.technicianPrimary,
    },
    activeBadgeText: {
        color: COLORS.technicianPrimary,
    },
    listContent: {
        padding: SPACING.md,
    },
    jobItem: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
        ...SHADOWS.light,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    jobTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    jobType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    priceContainer: {
        backgroundColor: COLORS.technicianLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.technicianPrimary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
        gap: 6,
    },
    location: {
        flex: 1,
        fontSize: 13,
        color: COLORS.grey,
        lineHeight: 18,
    },
    jobFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primaryBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    paymentText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.technicianPrimary,
    },
    time: {
        fontSize: 12,
        color: COLORS.grey,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.technicianPrimary,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: SPACING.sm,
        gap: 6,
    },
    acceptButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.grey,
        marginTop: SPACING.md,
    },
});
