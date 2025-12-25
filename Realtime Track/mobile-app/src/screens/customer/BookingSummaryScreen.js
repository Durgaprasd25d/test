import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function BookingSummaryScreen({ route, navigation }) {
    const { service, date, time, address } = route.params;

    const tax = service.price * 0.18;
    const total = service.price + tax;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>BOOKING SUMMARY</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Service Card */}
                <View style={[styles.sectionCard, styles.row]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="construct-outline" size={24} color={COLORS.roseGold} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{service.name}</Text>
                        <Text style={styles.itemSubtitle}>{service.time} estimated</Text>
                    </View>
                    <Text style={styles.itemPrice}>₹{service.price}</Text>
                </View>

                {/* Schedule info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Execution Time</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.grey} />
                        <Text style={styles.infoText}>{date} October 2025 at {time}</Text>
                    </View>
                </View>

                {/* Address info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Location</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={18} color={COLORS.grey} />
                        <Text style={styles.infoText}>{address.description}</Text>
                    </View>
                </View>

                {/* Billing details */}
                <View style={styles.billingSection}>
                    <Text style={styles.sectionTitle}>Price Details</Text>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Base Price</Text>
                        <Text style={styles.billValue}>₹{service.price}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>GST (18%)</Text>
                        <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.billRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => navigation.navigate('PaymentMethod', { total, service, address, time, date })}
                >
                    <Text style={styles.payBtnText}>Proceed to Payment</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    title: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    scrollContent: { padding: SPACING.xl },
    sectionCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: SPACING.md, ...SHADOWS.light, borderWidth: 1, borderColor: COLORS.greyLight, marginBottom: SPACING.xl },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center' },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    itemSubtitle: { fontSize: 12, color: COLORS.grey },
    itemPrice: { fontSize: 16, fontWeight: '700', color: COLORS.black },
    section: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.greyLight, padding: SPACING.md, borderRadius: 15 },
    infoText: { fontSize: 14, color: COLORS.black, opacity: 0.8, flex: 1 },
    billingSection: { marginTop: SPACING.lg },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    billLabel: { fontSize: 14, color: COLORS.grey },
    billValue: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
    divider: { height: 1, backgroundColor: COLORS.greyMedium, marginVertical: 12 },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    totalValue: { fontSize: 20, fontWeight: '900', color: COLORS.roseGold },
    footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    payBtn: { backgroundColor: COLORS.roseGold, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
    payBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
