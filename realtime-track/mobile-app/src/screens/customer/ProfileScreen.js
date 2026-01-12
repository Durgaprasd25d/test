import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import authService from '../../services/authService';

const { width } = Dimensions.get('window');

// Premium Palette matching Home
const PREMIUM_COLORS = {
    slate: '#0f172a',
    indigo: '#4f46e5',
    violet: '#7c3aed',
    background: '#f8fafc',
    white: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
};

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    const handleLogout = () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to exit the application?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await authService.logout();
                        navigation.replace('Auth');
                    }
                }
            ]
        );
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
                            style={styles.backBtn}
                            onPress={() => navigation.canGoBack() && navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Account Settings</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>{user?.name?.[0] || 'U'}</Text>
                        </View>
                        <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
                        <Text style={styles.profileMeta}>{user?.mobile || 'No mobile linked'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>Customer Account</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        <ProfileMenuItem
                            icon="person-outline"
                            label="Edit Profile"
                            onPress={() => { }}
                        />
                        <View style={styles.separator} />
                        <ProfileMenuItem
                            icon="shield-checkmark-outline"
                            label="Privacy & Security"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.card}>
                        <ProfileMenuItem
                            icon="help-circle-outline"
                            label="Help Center"
                            onPress={() => { }}
                        />
                        <View style={styles.separator} />
                        <ProfileMenuItem
                            icon="information-circle-outline"
                            label="About AIRCARE"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    <Text style={styles.logoutText}>Logout Account</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.2.0 • Build 2026.01.02</Text>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function ProfileMenuItem({ icon, label, onPress, color }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconContainer, color && { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color || PREMIUM_COLORS.indigo} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={PREMIUM_COLORS.textMuted} />
        </TouchableOpacity>
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
        marginBottom: 30,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        marginBottom: 16,
        ...SHADOWS.medium,
    },
    avatarTextLarge: {
        color: '#fff',
        fontSize: 40,
        fontWeight: '900',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    profileMeta: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    roleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: PREMIUM_COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 8,
        ...SHADOWS.light,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: PREMIUM_COLORS.textMain,
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 24,
        marginTop: 10,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#fee2e2',
        ...SHADOWS.light,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#ef4444',
        marginLeft: 10,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: PREMIUM_COLORS.textMuted,
        fontWeight: '600',
    },
});
