import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    TextInput,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import authService from '../../services/authService';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'repair', name: 'Repair', icon: 'build-outline' },
    { id: 'service', name: 'Service', icon: 'color-filter-outline' },
    { id: 'install', name: 'Install', icon: 'settings-outline' },
    { id: 'emergency', name: 'Emergency', icon: 'flash-outline' },
];

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome home,</Text>
                        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('History')}>
                        <Ionicons name="person-circle-outline" size={40} color={COLORS.roseGold} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <TouchableOpacity style={styles.searchContainer} activeOpacity={0.8}>
                    <Ionicons name="search-outline" size={20} color={COLORS.grey} />
                    <Text style={styles.searchText}>Explore places...</Text>
                </TouchableOpacity>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>What do you need?</Text>
                </View>
                <View style={styles.categoriesGrid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.categoryCard}
                            onPress={() => navigation.navigate('ServiceList', { type: cat.id })}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name={cat.icon} size={28} color={COLORS.roseGold} />
                            </View>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent/Favorites */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Addresses</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                    {[1, 2].map((i) => (
                        <TouchableOpacity key={i} style={styles.locationItem}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location-outline" size={20} color={COLORS.roseGold} />
                            </View>
                            <View style={styles.locationDetails}>
                                <Text style={styles.locationName}>Hukul Gali, 123</Text>
                                <Text style={styles.locationAddress}>New Delhi, India</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.greyMedium} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Promotional Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>30% OFF</Text>
                        <Text style={styles.bannerSubtitle}>On First Installation</Text>
                        <TouchableOpacity style={styles.bannerBtn}>
                            <Text style={styles.bannerBtnText}>Book Now</Text>
                        </TouchableOpacity>
                    </View>
                    <Ionicons name="snow-outline" size={80} color={COLORS.white} style={styles.bannerIcon} />
                </View>
            </ScrollView>

            {/* Bottom Nav Mock (since we aren't using Tab Navigator yet) */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={24} color={COLORS.roseGold} /></TouchableOpacity>
                <TouchableOpacity style={styles.navItem}><Ionicons name="calendar-outline" size={24} color={COLORS.grey} /></TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Wallet')}><Ionicons name="wallet-outline" size={24} color={COLORS.grey} /></TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('History')}><Ionicons name="person-outline" size={24} color={COLORS.grey} /></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    welcomeText: { fontSize: 14, color: COLORS.grey, fontWeight: '500' },
    userName: { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
    profileBtn: { ...SHADOWS.light },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.greyLight,
        borderRadius: 20,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        ...SHADOWS.light,
    },
    searchText: { marginLeft: SPACING.sm, color: COLORS.grey, fontSize: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    viewAll: { color: COLORS.roseGold, fontSize: 13, fontWeight: '600' },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
    categoryCard: {
        width: (width - SPACING.lg * 2 - SPACING.md) / 2,
        backgroundColor: COLORS.white,
        borderRadius: 25,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.greyLight,
        ...SHADOWS.light,
    },
    iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
    categoryName: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    recentList: { gap: SPACING.sm, marginBottom: SPACING.xl },
    locationItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.greyLight, borderRadius: 20 },
    locationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
    locationDetails: { flex: 1 },
    locationName: { fontSize: 15, fontWeight: 'bold', color: COLORS.black },
    locationAddress: { fontSize: 12, color: COLORS.grey },
    banner: {
        backgroundColor: COLORS.roseGold,
        borderRadius: 25,
        padding: SPACING.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        marginTop: SPACING.md,
    },
    bannerContent: { zIndex: 1 },
    bannerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white },
    bannerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginBottom: SPACING.md },
    bannerBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    bannerBtnText: { color: COLORS.roseGold, fontWeight: 'bold', fontSize: 13 },
    bannerIcon: { position: 'absolute', right: -20, bottom: -20, opacity: 0.2 },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: 70,
        backgroundColor: COLORS.white,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.greyLight,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    navItem: { padding: 10 },
});
