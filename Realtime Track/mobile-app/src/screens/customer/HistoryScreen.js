import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import rideService from '../../services/rideService';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const PREMIUM_COLORS = {
    slate: '#0f172a',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    background: '#f8fafc',
    white: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
};

const STATUS_CONFIG = {
    'REQUESTED': { label: 'Requested', color: '#3b82f6', bg: '#eff6ff', icon: 'time-outline' },
    'ACCEPTED': { label: 'Assigned', color: '#4f46e5', bg: '#eef2ff', icon: 'person-outline' },
    'ARRIVED': { label: 'Arrived', color: '#7c3aed', bg: '#f5f3ff', icon: 'location-outline' },
    'IN_PROGRESS': { label: 'In Progress', color: '#0ea5e9', bg: '#f0f9ff', icon: 'construct-outline' },
    'COMPLETED': { label: 'Completed', color: '#22c55e', bg: '#f0fdf4', icon: 'checkmark-circle-outline' },
    'CANCELLED': { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: 'close-circle-outline' },
};

export default function HistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        const result = await rideService.getJobHistory(null, 'customer');
        if (result.success) {
            setHistory(result.data);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        const result = await rideService.getJobHistory(null, 'customer');
        if (result.success) {
            setHistory(result.data);
        }
        setRefreshing(false);
    };

    const renderItem = ({ item }) => {
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG['REQUESTED'];
        const isNotCancelled = item.status !== 'CANCELLED';

        return (
            <TouchableOpacity
                style={styles.historyCard}
                activeOpacity={0.9}
                onPress={() => {
                    if (item.status !== 'COMPLETED' && item.status !== 'CANCELLED') {
                        navigation.navigate('Customer', { rideId: item.rideId });
                    } else if (item.status === 'COMPLETED') {
                        navigation.navigate('Receipt', { rideId: item.rideId });
                    }
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Ionicons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.serviceIconWrap}>
                        <Ionicons name="construct" size={24} color={PREMIUM_COLORS.indigo} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceType}>{item.serviceType?.toUpperCase()} SERVICE</Text>
                        <Text style={styles.addressText} numberOfLines={1}>{item.pickup?.address}</Text>
                    </View>
                    <View style={styles.priceInfo}>
                        <Text style={styles.priceText}>₹{item.price || '899'}</Text>
                        <Text style={styles.idText}>#{item.rideId?.substring(4, 10).toUpperCase()}</Text>
                    </View>
                </View>

                {isNotCancelled && (
                    <View style={styles.cardFooter}>
                        <View style={styles.footerAction}>
                            <Text style={styles.actionText}>
                                {item.status === 'COMPLETED' ? 'View Receipt' : 'Track Booking'}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={PREMIUM_COLORS.indigo} />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[PREMIUM_COLORS.slate, '#1e293b']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.canGoBack() && navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>Activity</Text>
                            <Text style={styles.headerSub}>All your bookings</Text>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={PREMIUM_COLORS.indigo} />
                    <Text style={styles.loaderText}>Fetching activity...</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item, index) => item._id || item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-outline" size={60} color={PREMIUM_COLORS.textMuted} />
                            </View>
                            <Text style={styles.emptyTitle}>No activity yet</Text>
                            <Text style={styles.emptySubtitle}>Your booked services will appear here.</Text>
                            <TouchableOpacity
                                style={styles.startBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.startBtnText}>Explore Services</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PREMIUM_COLORS.background,
    },
    header: {
        paddingBottom: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...SHADOWS.medium,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: PREMIUM_COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 13,
        color: PREMIUM_COLORS.textMuted,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceType: {
        fontSize: 14,
        fontWeight: '800',
        color: PREMIUM_COLORS.textMain,
        letterSpacing: 1,
    },
    addressText: {
        fontSize: 13,
        color: PREMIUM_COLORS.textMuted,
        marginTop: 2,
    },
    priceInfo: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '900',
        color: PREMIUM_COLORS.textMain,
    },
    idText: {
        fontSize: 10,
        color: PREMIUM_COLORS.textMuted,
        marginTop: 2,
        fontWeight: '700',
    },
    cardFooter: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerAction: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: PREMIUM_COLORS.indigo,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        color: PREMIUM_COLORS.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyView: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.light,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: PREMIUM_COLORS.textMain,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: PREMIUM_COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    startBtn: {
        backgroundColor: PREMIUM_COLORS.indigo,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        ...SHADOWS.medium,
    },
    startBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

