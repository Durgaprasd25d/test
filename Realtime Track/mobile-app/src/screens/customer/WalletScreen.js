import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function WalletScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[COLORS.slate, COLORS.slateLight]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Wallet</Text>
                        <TouchableOpacity style={styles.historyBtn}>
                            <Ionicons name="pie-chart-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={[COLORS.indigo, '#3730a3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.chipIcon}>
                            <Ionicons name="card" size={20} color="rgba(255,255,255,0.4)" />
                        </View>
                        <Text style={styles.cardBrand}>Premium Wallet</Text>
                    </View>

                    <Text style={styles.balanceLabel}>Total Available Balance</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <Text style={styles.balanceValue}>2,580.40</Text>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.cardActionBtn}>
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="add" size={20} color={COLORS.indigo} />
                                </View>
                                <Text style={styles.actionBtnText}>Add Funds</Text>
                            </TouchableOpacity>
                            <View style={styles.cardDivider} />
                            <TouchableOpacity style={styles.cardActionBtn}>
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="send" size={16} color={COLORS.indigo} />
                                </View>
                                <Text style={styles.actionBtnText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Transitions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {[
                    { title: 'AC Service Booking', date: 'Yesterday • 11:30 AM', amount: '-799.00', type: 'debit', icon: 'construct' },
                    { title: 'Wallet Top-up', date: '24 Oct • 02:45 PM', amount: '+1500.00', type: 'credit', icon: 'wallet' },
                    { title: 'Emergency Repair', date: '21 Oct • 09:12 AM', amount: '-1250.00', type: 'debit', icon: 'alert-circle' },
                    { title: 'Referral Bonus', date: '18 Oct • 06:20 PM', amount: '+250.00', type: 'credit', icon: 'gift' },
                ].map((item, i) => (
                    <TouchableOpacity key={i} style={styles.transactionItem}>
                        <View style={[
                            styles.transIconBox,
                            { backgroundColor: item.type === 'credit' ? '#f0fdf4' : '#fef2f2' }
                        ]}>
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={item.type === 'credit' ? '#22c55e' : '#ef4444'}
                            />
                        </View>
                        <View style={styles.transInfo}>
                            <Text style={styles.transTitle}>{item.title}</Text>
                            <Text style={styles.transDate}>{item.date}</Text>
                        </View>
                        <View style={styles.amountContainer}>
                            <Text style={[
                                styles.transAmount,
                                { color: item.type === 'credit' ? '#22c55e' : COLORS.textMain }
                            ]}>
                                {item.amount}
                            </Text>
                            <Ionicons
                                name={item.type === 'credit' ? "chevron-up" : "chevron-down"}
                                size={12}
                                color={item.type === 'credit' ? '#22c55e' : '#ef4444'}
                                style={{ marginTop: 2 }}
                            />
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.premiumBg
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.medium,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 25,
    },
    balanceCard: {
        borderRadius: 32,
        padding: 28,
        marginBottom: 35,
        ...SHADOWS.heavy,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    chipIcon: {
        width: 44,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBrand: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    currencySymbol: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 6,
        marginRight: 4,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900'
    },
    cardFooter: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 12,
    },
    actionGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 10,
    },
    actionIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    cardDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textMain
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.indigo,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 12,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    transIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    transInfo: {
        flex: 1
    },
    transTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textMain
    },
    transDate: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    transAmount: {
        fontSize: 16,
        fontWeight: '900'
    },
});

