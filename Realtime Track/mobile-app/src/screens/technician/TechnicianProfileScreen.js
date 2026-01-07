import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import authService from '../../services/authService';

export default function TechnicianProfileScreen({ navigation }) {
    const [kycStatus, setKycStatus] = React.useState('LOADING');

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStatus();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchStatus = async () => {
        const res = await technicianService.getKYCStatus();
        if (res.success) {
            setKycStatus(res.kycStatus);
        }
    };

    const getBadge = () => {
        switch (kycStatus) {
            case 'VERIFIED': return { label: 'Verified', color: COLORS.success };
            case 'PENDING': return { label: 'Pending', color: COLORS.warning };
            case 'REJECTED': return { label: 'Rejected', color: COLORS.error };
            case 'NOT_STARTED': return { label: 'Not Started', color: COLORS.grey };
            default: return null;
        }
    };

    const badge = getBadge();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PROFILE & SETTINGS</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={COLORS.technicianPrimary} />
                    </View>
                    <Text style={styles.name}>Professional Technician</Text>
                    <Text style={styles.role}>AC Service Expert</Text>
                </View>

                <View style={styles.section}>
                    <MenuItem icon="person-outline" label="Personal Details" onPress={() => { }} />
                    <MenuItem
                        icon="document-text-outline"
                        label="Documents / KYC"
                        onPress={() => navigation.navigate('KYC')}
                        badge={badge?.label}
                        badgeColor={badge?.color}
                    />
                    <MenuItem icon="lock-closed-outline" label="Passwords" onPress={() => { }} />
                    <MenuItem icon="card-outline" label="Bank Details" onPress={() => navigation.navigate('Withdrawal')} />
                </View>

                <View style={styles.section}>
                    <MenuItem icon="help-circle-outline" label="Support" onPress={() => { }} />
                    <MenuItem icon="log-out-outline" label="Logout" onPress={async () => {
                        await authService.logout();
                        navigation.replace('Auth');
                    }} color={COLORS.error} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function MenuItem({ icon, label, onPress, badge, badgeColor, color }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Ionicons name={icon} size={22} color={color || COLORS.technicianPrimary} />
            <Text style={[styles.menuLabel, color && { color }]}>{label}</Text>
            {badge && (
                <View style={[styles.badge, badgeColor && { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.lg },
    profileCard: { alignItems: 'center', marginBottom: SPACING.xxl },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.technicianLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    name: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
    role: { fontSize: 14, color: COLORS.grey },
    section: { marginBottom: SPACING.xl },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, backgroundColor: COLORS.greyLight, borderRadius: 12, marginBottom: SPACING.sm },
    menuLabel: { fontSize: 15, fontWeight: '500', color: COLORS.black },
    badge: { backgroundColor: COLORS.earningsGreen, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.white },
});
