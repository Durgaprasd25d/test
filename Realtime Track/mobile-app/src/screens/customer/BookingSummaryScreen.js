import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export default function BookingSummaryScreen({ route, navigation }) {
    const { service, date, time, address } = route.params;

    const tax = service.price * 0.18;
    const total = service.price + tax;

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
                        <Text style={styles.headerTitle}>Booking Summary</Text>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Service Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="construct" size={24} color={COLORS.indigo} />
                        </View>
                        <View style={styles.serviceMain}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <Text style={styles.serviceCategory}>Premium Service Package</Text>
                        </View>
                        <Text style={styles.basePrice}>₹{service.price}</Text>
                    </View>
                </View>

                {/* Logistics Section */}
                <Text style={styles.sectionTitle}>Service Logistics</Text>
                <View style={styles.logisticsCard}>
                    <View style={styles.logisticsItem}>
                        <View style={[styles.logisticsIcon, { backgroundColor: '#eff6ff' }]}>
                            <Ionicons name="calendar" size={20} color={COLORS.indigo} />
                        </View>
                        <View style={styles.logisticsInfo}>
                            <Text style={styles.logisticsLabel}>Date & Time</Text>
                            <Text style={styles.logisticsValue}>{date} October 2025 • {time}</Text>
                        </View>
                    </View>

                    <View style={styles.itemDivider} />

                    <View style={styles.logisticsItem}>
                        <View style={[styles.logisticsIcon, { backgroundColor: '#fdf2f8' }]}>
                            <Ionicons name="location" size={20} color="#db2777" />
                        </View>
                        <View style={styles.logisticsInfo}>
                            <Text style={styles.logisticsLabel}>Service Location</Text>
                            <Text style={styles.logisticsValue} numberOfLines={2}>{address.description}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Breakdown */}
                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Service Fee</Text>
                        <Text style={styles.priceAmount}>₹{service.price}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>GST (18% Digital Service Tax)</Text>
                        <Text style={styles.priceAmount}>₹{tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Platform Convenience Fee</Text>
                        <Text style={[styles.priceAmount, { color: '#22c55e' }]}>FREE</Text>
                    </View>

                    <View style={styles.totalDivider} />

                    <View style={styles.totalRow}>
                        <View>
                            <Text style={styles.totalLabel}>Total Payable</Text>
                            <Text style={styles.inclusiveText}>Inclusive of all taxes</Text>
                        </View>
                        <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.guaranteeBox}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.indigo} />
                    <Text style={styles.guaranteeText}>Secure payment protected by industry-standard encryption.</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PaymentMethod', { total, service, address, time, date })}
                >
                    <LinearGradient
                        colors={[COLORS.indigo, '#3730a3']}
                        style={styles.payBtnGradient}
                    >
                        <Text style={styles.payBtnText}>Proceed to Payment</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
    scrollContent: {
        padding: 20,
        paddingTop: 25,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        marginBottom: 25
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    serviceMain: {
        flex: 1,
        marginLeft: 16,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textMain
    },
    serviceCategory: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
        marginTop: 2,
    },
    basePrice: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textMain
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textMain,
        marginBottom: 16,
        marginLeft: 4,
    },
    logisticsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        marginBottom: 25,
        ...SHADOWS.light,
    },
    logisticsItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logisticsIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logisticsInfo: {
        marginLeft: 16,
        flex: 1,
    },
    logisticsLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    logisticsValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMain,
        marginTop: 2,
    },
    itemDivider: {
        height: 1,
        backgroundColor: COLORS.borderLight,
        marginVertical: 16,
    },
    priceCard: {
        backgroundColor: COLORS.slate,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        ...SHADOWS.heavy,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14
    },
    priceLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    priceAmount: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700'
    },
    totalDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 16
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff'
    },
    inclusiveText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff'
    },
    guaranteeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 10,
        marginBottom: 30,
    },
    guaranteeText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: '#fff',
    },
    payBtn: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    payBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    payBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },
});

