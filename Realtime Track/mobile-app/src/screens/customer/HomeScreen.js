import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';
import authService from '../../services/authService';

const { width } = Dimensions.get('window');

// Premium Palette
const PREMIUM_COLORS = {
    slate: '#0f172a',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    background: '#f8fafc',
    white: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
};

// Pastel Service Highlights
const SERVICE_HIGHLIGHTS = [
    { bg: '#eff6ff', icon: '#3b82f6', border: '#dbeafe' }, // Blue
    { bg: '#fef2f2', icon: '#ef4444', border: '#fee2e2' }, // Red
    { bg: '#f0fdf4', icon: '#22c55e', border: '#dcfce7' }, // Green
    { bg: '#fffbeb', icon: '#f59e0b', border: '#fef3c7' }, // Amber
    { bg: '#faf5ff', icon: '#a855f7', border: '#f3e8ff' }, // Purple
];

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
        fetchCategories();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/categories`);
            const result = await response.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Premium Header with Gradient */}
            <LinearGradient
                colors={[PREMIUM_COLORS.slate, '#1e293b']}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.safeArea}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.userProfile}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                            <View>
                                <Text style={styles.greetingText}>{getGreeting()},</Text>
                                <Text style={styles.userNameText}>{user?.name?.split(' ')[0] || 'Guest'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </LinearGradient>


            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[]}
            >
                {/* Promo Banner */}
                <LinearGradient
                    colors={[PREMIUM_COLORS.violet, '#4c1d95']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoBanner}
                >
                    <View style={styles.promoContent}>
                        <View style={styles.promoBadge}>
                            <Text style={styles.promoBadgeText}>NEW YEAR OFFER</Text>
                        </View>
                        <Text style={styles.promoTitle}>Get 30% OFF</Text>
                        <Text style={styles.promoDesc}>On your first split AC service</Text>
                        <TouchableOpacity style={styles.promoBtn}>
                            <Text style={styles.promoBtnText}>Claim Now</Text>
                        </TouchableOpacity>
                    </View>
                    <Ionicons name="snow-outline" size={100} color="rgba(255,255,255,0.15)" style={styles.promoIcon} />
                </LinearGradient>

                {/* Categories Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>What are you looking for?</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={PREMIUM_COLORS.indigo} style={styles.loader} />
                ) : (
                    <View style={styles.grid}>
                        {categories.map((cat, index) => {
                            const highlight = SERVICE_HIGHLIGHTS[index % SERVICE_HIGHLIGHTS.length];
                            return (
                                <TouchableOpacity
                                    key={cat._id || cat.id || index.toString()}
                                    style={[styles.categoryCard, { backgroundColor: highlight.bg, borderColor: highlight.border }]}
                                    onPress={() => navigation.navigate('ServiceList', {
                                        type: cat.slug,
                                        categoryName: cat.name
                                    })}
                                >
                                    <View style={styles.iconWrapper}>
                                        <Ionicons name={cat.icon} size={32} color={highlight.icon} />
                                    </View>
                                    <Text style={styles.categoryNameText}>{cat.name}</Text>
                                    <View style={styles.categoryArrow}>
                                        <Ionicons name="arrow-forward" size={16} color={highlight.icon} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Recent Addresses */}
                <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
                    <Text style={styles.sectionTitle}>Saved Addresses</Text>
                    <TouchableOpacity>
                        <Ionicons name="add-circle-outline" size={24} color={PREMIUM_COLORS.indigo} />
                    </TouchableOpacity>
                </View>

                <View style={styles.addressList}>
                    {[
                        { label: 'Home', address: 'B-12, Green Park, New Delhi', icon: 'home-outline' },
                        { label: 'Office', address: 'Tech Hub, Cyber City, Gurgaon', icon: 'business-outline' }
                    ].map((item, idx) => (
                        <TouchableOpacity key={idx} style={styles.addressItem}>
                            <View style={styles.addressIconWrap}>
                                <Ionicons name={item.icon} size={20} color={PREMIUM_COLORS.indigo} />
                            </View>
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressLabel}>{item.label}</Text>
                                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={18} color={PREMIUM_COLORS.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Premium Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home" size={24} color={PREMIUM_COLORS.indigo} />
                    <Text style={[styles.navText, { color: PREMIUM_COLORS.indigo }]}>Home</Text>
                    <View style={styles.activeDot} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('History')}>
                    <Ionicons name="receipt-outline" size={24} color={PREMIUM_COLORS.textMuted} />
                    <Text style={styles.navText}>Activity</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={24} color={PREMIUM_COLORS.textMuted} />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PREMIUM_COLORS.background,
    },
    headerGradient: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    safeArea: {
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 25,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    greetingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    userNameText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userNameText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Search Card
    searchCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.heavy,
        marginTop: 5,
    },
    searchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    searchTextContainer: {
        flex: 1,
    },
    searchPlaceholder: {
        fontSize: 16,
        fontWeight: '600',
        color: PREMIUM_COLORS.textMain,
    },
    searchSubtext: {
        fontSize: 12,
        color: PREMIUM_COLORS.textMuted,
    },
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: PREMIUM_COLORS.indigo,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 30,
        paddingHorizontal: 20,
    },
    // Promo Banner
    promoBanner: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        flexDirection: 'row',
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    promoContent: {
        flex: 1,
        zIndex: 1,
    },
    promoBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    promoBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    promoTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    promoDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 15,
    },
    promoBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    promoBtnText: {
        color: PREMIUM_COLORS.violet,
        fontWeight: 'bold',
        fontSize: 14,
    },
    promoIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 0.3,
    },
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PREMIUM_COLORS.textMain,
    },
    seeAll: {
        color: PREMIUM_COLORS.indigo,
        fontWeight: '600',
        fontSize: 14,
    },
    loader: {
        marginVertical: 40,
    },
    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    categoryCard: {
        width: (width - 40 - 15) / 2,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        height: 160,
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    iconWrapper: {
        backgroundColor: '#fff',
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    categoryNameText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: PREMIUM_COLORS.textMain,
    },
    categoryArrow: {
        alignSelf: 'flex-end',
    },
    // Addresses
    addressList: {
        gap: 12,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        ...SHADOWS.light,
    },
    addressIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: PREMIUM_COLORS.textMain,
    },
    addressText: {
        fontSize: 13,
        color: PREMIUM_COLORS.textMuted,
    },
    // Bottom Nav
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: Platform.OS === 'ios' ? 90 : 70,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 25 : 0,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        ...SHADOWS.heavy,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: PREMIUM_COLORS.indigo,
        marginTop: 2,
    },
});

