import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

const METHODS = [
    {
        id: 'prepaid',
        name: 'Instant Checkout',
        icon: 'flash',
        desc: 'Unlock special priority service with prepaid booking.',
        timing: 'PREPAID',
        accent: COLORS.indigo
    },
    {
        id: 'postpaid',
        name: 'Pay After Service',
        icon: 'time',
        desc: 'Review the job and pay online once completed.',
        timing: 'POSTPAID',
        accent: '#7c3aed'
    },
];

export default function PaymentMethodScreen({ route, navigation }) {
    const { total, service, address, time, date } = route.params;
    const [selectedMethod, setSelectedMethod] = useState('prepaid');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const serviceTypeMap = {
                'r1': 'repair', 'r2': 'service', 'r3': 'install',
                'i1': 'install', 's1': 'service', 'emergency': 'emergency'
            };

            const mappedServiceType = serviceTypeMap[service?.id] || 'service';
            const pickupLocation = {
                address: address?.description || address?.address || 'No address provided',
                lat: address?.location?.lat || 0,
                lng: address?.location?.lng || 0
            };

            if (!pickupLocation.lat || !pickupLocation.lng) {
                Alert.alert('Invalid Location', 'Please select a valid location with coordinates');
                setLoading(false);
                return;
            }

            const selectedMethodObj = METHODS.find(m => m.id === selectedMethod);
            const paymentTiming = selectedMethodObj?.timing || 'PREPAID';

            const response = await rideService.requestRide(
                pickupLocation,
                { address: 'Technician Hub', lat: 0, lng: 0 },
                mappedServiceType,
                'ONLINE',
                paymentTiming
            );

            if (response.success) {
                const jobId = response.rideId || response.data?.rideId || 'UNKNOWN';
                if (paymentTiming === 'PREPAID') {
                    navigation.navigate('CustomerRazorpayCheckout', {
                        rideId: jobId,
                        amount: total,
                        paymentTiming: 'PREPAID',
                        service,
                        address
                    });
                } else {
                    navigation.navigate('PaymentStatus', {
                        status: 'success',
                        rideId: jobId,
                        total,
                        paymentMethod: 'online',
                        paymentTiming: 'POSTPAID'
                    });
                }
            } else {
                Alert.alert('Booking Failed', response.error || 'Unable to create booking');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

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
                        <Text style={styles.headerTitle}>Secure Checkout</Text>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryLeft}>
                        <Text style={styles.summaryLabel}>Final Amount</Text>
                        <View style={styles.amountBox}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.amount}>{total.toFixed(2)}</Text>
                        </View>
                    </View>
                    <View style={styles.summaryRight}>
                        <Ionicons name="shield-checkmark" size={40} color="rgba(255,255,255,0.3)" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Preferred Payment Timing</Text>

                <View style={styles.methodList}>
                    {METHODS.map((method) => {
                        const isActive = selectedMethod === method.id;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                activeOpacity={0.9}
                                style={[
                                    styles.methodCard,
                                    isActive && { borderColor: method.accent, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={[
                                    styles.methodIconBox,
                                    { backgroundColor: isActive ? method.accent : '#f8fafc' }
                                ]}>
                                    <Ionicons
                                        name={method.icon}
                                        size={24}
                                        color={isActive ? '#fff' : COLORS.textMuted}
                                    />
                                </View>

                                <View style={styles.methodInfo}>
                                    <Text style={[
                                        styles.methodName,
                                        isActive && { color: method.accent }
                                    ]}>
                                        {method.name}
                                    </Text>
                                    <Text style={styles.methodDesc}>{method.desc}</Text>
                                </View>

                                <View style={[
                                    styles.radioCircle,
                                    isActive && { borderColor: method.accent }
                                ]}>
                                    {isActive && (
                                        <View style={[styles.radioDot, { backgroundColor: method.accent }]} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.securityBox}>
                    <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                    <Text style={styles.securityText}>
                        Encryption protocols ensure your data is 100% private.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    activeOpacity={0.8}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[COLORS.indigo, '#3730a3']}
                        style={styles.bookBtnGradient}
                    >
                        {loading ? (
                            <Text style={styles.bookBtnText}>Securing Booking...</Text>
                        ) : (
                            <>
                                <Text style={styles.bookBtnText}>Confirm Booking</Text>
                                <Ionicons name="chevron-forward" size={18} color="#fff" />
                            </>
                        )}
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
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 30,
    },
    summaryCard: {
        backgroundColor: COLORS.slate,
        borderRadius: 28,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 35,
        ...SHADOWS.heavy
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    amountBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currency: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginTop: 6,
        marginRight: 4,
    },
    amount: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff'
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: COLORS.textMain,
        marginBottom: 20,
        marginLeft: 4,
    },
    methodList: {
        gap: 16
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        ...SHADOWS.light,
    },
    methodIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    methodInfo: {
        flex: 1
    },
    methodName: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textMain
    },
    methodDesc: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        lineHeight: 18,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    securityBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 30,
        paddingHorizontal: 20,
    },
    securityText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: COLORS.borderLight,
    },
    bookBtn: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        ...SHADOWS.medium
    },
    bookBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    bookBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },
});

