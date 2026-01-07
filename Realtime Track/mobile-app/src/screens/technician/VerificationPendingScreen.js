import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import authService from '../../services/authService';

export default function VerificationPendingScreen({ navigation, route }) {
    const status = route.params?.status || 'PENDING';
    const reason = route.params?.reason || '';

    const handleSupport = () => {
        Linking.openURL('tel:+919876543210');
    };

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Auth');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: status === 'REJECTED' ? COLORS.error + '15' : COLORS.warning + '15' }
                ]}>
                    <Ionicons
                        name={status === 'REJECTED' ? "close-circle" : "time"}
                        size={80}
                        color={status === 'REJECTED' ? COLORS.error : COLORS.warning}
                    />
                </View>

                <Text style={styles.title}>
                    {status === 'REJECTED' ? 'Verification Rejected' : 'Verification Under Review'}
                </Text>

                <Text style={styles.description}>
                    {status === 'REJECTED'
                        ? (reason || 'Some of your documents were not clear. Please re-upload them.')
                        : 'Your documents have been submitted and are being reviewed by our team. This usually takes 24-48 hours.'}
                </Text>

                <View style={styles.actionSection}>
                    {status === 'REJECTED' ? (
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => navigation.navigate('KYC')}
                        >
                            <Text style={styles.primaryBtnText}>RE-UPLOAD DOCUMENTS</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => navigation.navigate('KYC')}
                        >
                            <Text style={styles.secondaryBtnText}>VIEW SUBMITTED DOCUMENTS</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.supportBtn}
                        onPress={handleSupport}
                    >
                        <Ionicons name="call-outline" size={20} color={COLORS.black} />
                        <Text style={styles.supportBtnText}>CONTACT SUPPORT</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
    iconContainer: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 24, fontWeight: '900', color: COLORS.black, textAlign: 'center', marginBottom: 15 },
    description: { fontSize: 16, color: COLORS.grey, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    actionSection: { width: '100%', gap: 15 },
    primaryBtn: { backgroundColor: COLORS.technicianPrimary, padding: 18, borderRadius: 15, alignItems: 'center', ...SHADOWS.medium },
    primaryBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { borderWidth: 1.5, borderColor: COLORS.technicianPrimary, padding: 18, borderRadius: 15, alignItems: 'center' },
    secondaryBtnText: { color: COLORS.technicianPrimary, fontWeight: 'bold', fontSize: 16 },
    supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
    supportBtnText: { color: COLORS.black, fontWeight: 'bold', fontSize: 14 },
    logoutBtn: { marginTop: 30 },
    logoutText: { color: COLORS.error, fontWeight: 'bold' }
});
