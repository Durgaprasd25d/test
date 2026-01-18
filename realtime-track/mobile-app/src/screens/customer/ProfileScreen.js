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
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        mobile: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
        if (userData) {
            setEditForm({
                name: userData.name || '',
                email: userData.email || '',
                mobile: userData.mobile || ''
            });
        }
    };

    const handleEditProfile = () => {
        setEditForm({
            name: user?.name || '',
            email: user?.email || '',
            mobile: user?.mobile || ''
        });
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        // Validation
        if (!editForm.name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        if (editForm.email && !editForm.email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    name: editForm.name,
                    email: editForm.email
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update local user data
                const updatedUser = { ...user, ...editForm };
                setUser(updatedUser);
                await authService.setUser(updatedUser);

                setShowEditModal(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
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
                            onPress={handleEditProfile}
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

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color={PREMIUM_COLORS.textMain} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.name}
                                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                                    placeholder="Enter your name"
                                    placeholderTextColor={PREMIUM_COLORS.textMuted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.email}
                                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                                    placeholder="Enter your email"
                                    placeholderTextColor={PREMIUM_COLORS.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Mobile Number</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={editForm.mobile}
                                    editable={false}
                                    placeholderTextColor={PREMIUM_COLORS.textMuted}
                                />
                                <Text style={styles.inputHint}>Mobile number cannot be changed</Text>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setShowEditModal(false)}
                                disabled={saving}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: PREMIUM_COLORS.textMain,
    },
    modalBody: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: PREMIUM_COLORS.textMain,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: PREMIUM_COLORS.textMain,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputDisabled: {
        backgroundColor: '#f1f5f9',
        color: PREMIUM_COLORS.textMuted,
    },
    inputHint: {
        fontSize: 12,
        color: PREMIUM_COLORS.textMuted,
        marginTop: 6,
        marginLeft: 4,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
    },
    modalBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#f1f5f9',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: PREMIUM_COLORS.textMain,
    },
    saveBtn: {
        backgroundColor: PREMIUM_COLORS.indigo,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
});
