import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import Logo from '../../components/Logo';

const { width } = Dimensions.get('window');

export default function WalletScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Logo size={24} />
                    <Text style={styles.title}>MY WALLET</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Balance Card */}
                <View style={styles.card}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceValue}>₹2,500.00</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="add" size={20} color={COLORS.roseGold} />
                            <Text style={styles.actionText}>Add Money</Text>
                        </TouchableOpacity>
                        <View style={styles.dividerV} />
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="arrow-down" size={20} color={COLORS.roseGold} />
                            <Text style={styles.actionText}>Withdraw</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Transitions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transactions</Text>
                </View>

                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.transactionItem}>
                        <View style={[styles.iconBox, { backgroundColor: i % 2 === 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Ionicons
                                name={i % 2 === 0 ? "arrow-down-circle" : "arrow-up-circle"}
                                size={24}
                                color={i % 2 === 0 ? COLORS.success : COLORS.error}
                            />
                        </View>
                        <View style={styles.transInfo}>
                            <Text style={styles.transTitle}>{i % 2 === 0 ? 'Wallet Top-up' : 'Service Booking'}</Text>
                            <Text style={styles.transDate}>Oct 2{i}, 2025 • 02:30 PM</Text>
                        </View>
                        <Text style={[styles.transAmount, { color: i % 2 === 0 ? COLORS.success : COLORS.error }]}>
                            {i % 2 === 0 ? '+' : '-'}₹{500 * i}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.xl },
    card: { backgroundColor: COLORS.roseGold, borderRadius: 30, padding: 30, ...SHADOWS.heavy, marginBottom: SPACING.xxl },
    balanceLabel: { color: COLORS.white, opacity: 0.8, fontSize: 14, marginBottom: 8 },
    balanceValue: { color: COLORS.white, fontSize: 36, fontWeight: '900', marginBottom: 30 },
    actionRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 15, justifyContent: 'space-around', alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    dividerV: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.3)' },
    sectionHeader: { marginBottom: SPACING.lg },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
    transInfo: { flex: 1 },
    transTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    transDate: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    transAmount: { fontSize: 16, fontWeight: 'bold' },
});
