import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

const MOCK_TRANSACTIONS = [
    { id: '1', type: 'credit', amount: 960, description: 'Job #271254 (New)', date: '25 Dec', status: 'completed' },
    { id: '2', type: 'debit', amount: 240, description: 'Commission Pending #271254', date: '25 Dec', status: 'pending' },
    { id: '3', type: 'credit', amount: 1200, description: 'Job #271253 (Malvai)', date: '24 Dec', status: 'completed' },
    { id: '4', type: 'debit', amount: 240, description: 'Commission Paid', date: '23 Dec', status: 'completed' },
];

export default function TechnicianWalletScreen({ navigation }) {
    const [balance, setBalance] = useState(0);
    const [pendingCommission, setPendingCommission] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWallet();
    }, []);

    const loadWallet = async () => {
        const result = await technicianService.getWallet();
        if (result.success) {
            setBalance(result.balance);
            setPendingCommission(result.pendingCommission);
            setTransactions(result.transactions || MOCK_TRANSACTIONS);
        }
        setLoading(false);
    };

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>WALLET</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>₹{balance.toLocaleString()}</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="add" size={20} color={COLORS.white} />
                        <Text style={styles.actionText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="arrow-down" size={20} color={COLORS.white} />
                        <Text style={styles.actionText}>Withdraw</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pending Commission Warning */}
            {pendingCommission > 0 && (
                <View style={styles.warningCard}>
                    <Ionicons name="alert-circle" size={24} color={COLORS.warningAmber} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.warningTitle}>Pending Commission</Text>
                        <Text style={styles.warningAmount}>₹{pendingCommission}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => navigation.navigate('CommissionPayment', { pending: pendingCommission })}
                    >
                        <Text style={styles.payNowText}>Pay Now</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
            </View>
        </>
    );

    const renderTransaction = ({ item }) => (
        <View style={styles.transItem}>
            <View style={[styles.transIcon, item.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
                <Ionicons
                    name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={item.type === 'credit' ? COLORS.earningsGreen : COLORS.error}
                />
            </View>
            <View style={styles.transInfo}>
                <Text style={styles.transDesc}>{item.description}</Text>
                <Text style={styles.transDate}>{item.date} • {item.status}</Text>
            </View>
            <Text style={[styles.transAmount, item.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
                {item.type === 'credit' ? '+' : '-'}₹{item.amount}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[0]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
        backgroundColor: COLORS.white,
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { paddingHorizontal: SPACING.lg },
    balanceCard: {
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 25,
        padding: SPACING.xl,
        marginVertical: SPACING.lg,
        ...SHADOWS.heavy,
    },
    balanceLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginBottom: 8 },
    balanceAmount: { fontSize: 42, fontWeight: '900', color: COLORS.white, marginBottom: SPACING.lg },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 15,
    },
    actionText: { fontSize: 14, fontWeight: 'bold', color: COLORS.white },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.warningAmber + '15',
        padding: SPACING.md,
        borderRadius: 15,
        marginBottom: SPACING.lg,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warningAmber,
    },
    warningTitle: { fontSize: 13, color: COLORS.grey },
    warningAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.warningAmber },
    payNowBtn: { backgroundColor: COLORS.warningAmber, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    payNowText: { fontSize: 13, fontWeight: 'bold', color: COLORS.white },
    sectionHeader: { marginTop: SPACING.md, marginBottom: SPACING.md },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    transItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
    },
    transIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    creditIcon: { backgroundColor: '#E8F5E9' },
    debitIcon: { backgroundColor: '#FFEBEE' },
    transInfo: { flex: 1 },
    transDesc: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    transDate: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    transAmount: { fontSize: 16, fontWeight: 'bold' },
    creditAmount: { color: COLORS.earningsGreen },
    debitAmount: { color: COLORS.error },
});
