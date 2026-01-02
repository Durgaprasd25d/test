import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';

const { width } = Dimensions.get('window');

export default function ServiceListScreen({ route, navigation }) {
    const { type, categoryName } = route.params;
    const [services, setServices] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchServices();
    }, [type]);

    const fetchServices = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/category/${type}`);
            const result = await response.json();
            if (result.success) {
                setServices(result.data.services);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        >
            <View style={styles.cardContent}>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Ionicons name="time-outline" size={14} color={COLORS.indigo} />
                            <Text style={styles.badgeText}>{item.time}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#f0fdf4' }]}>
                            <Ionicons name="star" size={12} color="#22c55e" />
                            <Text style={[styles.badgeText, { color: '#22c55e' }]}>4.8</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.priceSection}>
                    <Text style={styles.currency}>₹</Text>
                    <Text style={styles.priceValue}>{item.price}</Text>
                    <View style={styles.arrowCircle}>
                        <Ionicons name="chevron-forward" size={18} color="#fff" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[COLORS.slate, COLORS.slateLight]}
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
                        <View style={styles.titleContainer}>
                            <Text style={styles.headerSubtitle}>Category</Text>
                            <Text style={styles.headerTitle}>{categoryName || type}</Text>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.indigo} />
                    <Text style={styles.loaderText}>Finding best services...</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="construct-outline" size={80} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No services available in this category yet.</Text>
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
        backgroundColor: COLORS.premiumBg,
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: 20,
        paddingTop: 25,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        padding: 16,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textMain,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.borderLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    priceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    currency: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.indigo,
        marginTop: 4,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.textMain,
        marginRight: 10,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.indigo,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    loaderText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: 16,
        marginTop: 20,
        lineHeight: 24,
    },
});

