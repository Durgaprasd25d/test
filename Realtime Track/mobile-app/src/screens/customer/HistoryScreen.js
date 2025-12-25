import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import rideService from '../../services/rideService';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function HistoryScreen({ navigation, route }) {
    const { userId = 'demo_user', role = 'customer' } = route.params || {};
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        const result = await rideService.getJobHistory(userId, role);
        if (result.success) {
            setHistory(result.data);
        }
        setLoading(false);
    };

    const renderItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getServiceColor(item.serviceType) + '20' }]}>
                    <Text style={[styles.typeText, { color: getServiceColor(item.serviceType) }]}>
                        {item.serviceType?.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.roseGold} />
                <Text style={styles.addressText} numberOfLines={1}>{item.pickup?.address}</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.jobId}>#{item.rideId?.substring(0, 8).toUpperCase()}</Text>
                <View style={styles.statusRow}>
                    <View style={styles.dot} />
                    <Text style={styles.statusLabel}>COMPLETED</Text>
                </View>
            </View>
        </View>
    );

    const getServiceColor = (type) => {
        switch (type) {
            case 'repair': return COLORS.roseGold;
            case 'install': return '#4CAF50';
            case 'emergency': return COLORS.error;
            default: return COLORS.navy;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>Service History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.roseGold} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Ionicons name="document-text-outline" size={64} color={COLORS.greyLight} />
                            <Text style={styles.emptyText}>No service history found</Text>
                        </View>
                    }
                    onRefresh={fetchHistory}
                    refreshing={loading}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    backBtn: { padding: SPACING.xs },
    title: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    listContent: { padding: SPACING.md },
    historyCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    typeText: { fontSize: 10, fontWeight: '800' },
    dateText: { fontSize: 12, color: COLORS.grey, fontWeight: '500' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
    addressText: { marginLeft: 8, color: COLORS.black, fontSize: 14, flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.greyLight, paddingTop: SPACING.md },
    jobId: { fontSize: 12, color: COLORS.grey, fontWeight: 'bold' },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
    statusLabel: { fontSize: 10, fontWeight: 'bold', color: '#4CAF50' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: COLORS.grey, fontSize: 16, fontWeight: '500' },
});
