import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

export default function ArrivalScreen({ route, navigation }) {
    const { job } = route?.params || {};
    const [starting, setStarting] = useState(false);

    const handleStartService = async () => {
        setStarting(true);
        const result = await technicianService.updateJobStatus(job.id, 'in_progress');

        if (result.success) {
            navigation.navigate('ServiceProgress', { job });
        } else {
            setStarting(false);
            // Optionally, show an error message to the user
            console.error("Failed to start service:", result.error);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="location" size={60} color={COLORS.technicianPrimary} />
                </View>
                <Text style={styles.title}>Arrived at Location</Text>
                <Text style={styles.subtitle}>You have reached the customer's location</Text>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color={COLORS.grey} />
                        <Text style={styles.infoText}>{job?.location || 'Customer Location'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.contactBtn}>
                    <Ionicons name="call" size={20} color={COLORS.white} />
                    <Text style={styles.contactBtnText}>Contact Customer</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startBtn}
                    onPress={handleStartService}
                    disabled={starting}
                >
                    <Text style={styles.startBtnText}>
                        {starting ? 'Starting...' : 'Start Service'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.technicianLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.medium,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: COLORS.technicianDark, marginBottom: SPACING.sm },
    subtitle: { fontSize: 16, color: COLORS.grey, textAlign: 'center', marginBottom: SPACING.xxl },
    infoCard: {
        width: '100%',
        backgroundColor: COLORS.greyLight,
        borderRadius: 15,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { flex: 1, fontSize: 15, color: COLORS.black, fontWeight: '500' },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.info,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    contactBtnText: { fontSize: 15, fontWeight: 'bold', color: COLORS.white },
    footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    startBtn: {
        backgroundColor: COLORS.technicianPrimary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    startBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
