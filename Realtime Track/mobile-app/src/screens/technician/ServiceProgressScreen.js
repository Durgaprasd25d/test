import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChecklistItem from '../../components/ChecklistItem';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function ServiceProgressScreen({ route, navigation }) {
    const { job } = route?.params || {};
    const [checklist, setChecklist] = useState([
        { id: 1, label: 'BYОTools shipped', completed: true },
        { id: 2, label: 'Checklist configured', completed: true },
        { id: 3, label: 'Check ins verification', completed: false },
        { id: 4, label: 'Complete enhancement', completed: false },
        { id: 5, label: 'Reviewed records', completed: false },
    ]);

    const toggleItem = (id) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const allCompleted = checklist.every(item => item.completed);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SERVICE IN PROGRESS</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.progressCard}>
                    <View style={styles.otpBadge}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.technicianPrimary} />
                        <View>
                            <Text style={styles.otpLabel}>TO-Tools shipped</Text>
                            <Text style={styles.otpCode}>1234</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Service Checklist</Text>
                {checklist.map(item => (
                    <ChecklistItem
                        key={item.id}
                        label={item.label}
                        completed={item.completed}
                        onPress={() => toggleItem(item.id)}
                    />
                ))}

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
                    <Text style={styles.noteText}>Complete all checklist items before finishing the service.</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeBtn, !allCompleted && styles.disabledBtn]}
                    onPress={() => allCompleted && navigation.navigate('CODCollection', { job })}
                    disabled={!allCompleted}
                >
                    <Text style={styles.completeBtnText}>Complete Job</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.xl },
    progressCard: { backgroundColor: COLORS.technicianLight, borderRadius: 20, padding: SPACING.lg, marginBottom: SPACING.xl },
    otpBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    otpLabel: { fontSize: 12, color: COLORS.grey },
    otpCode: { fontSize: 24, fontWeight: 'bold', color: COLORS.technicianDark },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.md },
    noteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.info + '15', padding: SPACING.md, borderRadius: 12, marginTop: SPACING.lg },
    noteText: { flex: 1, fontSize: 13, color: COLORS.info },
    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    completeBtn: { backgroundColor: COLORS.technicianPrimary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
    disabledBtn: { backgroundColor: COLORS.greyMedium },
    completeBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});
