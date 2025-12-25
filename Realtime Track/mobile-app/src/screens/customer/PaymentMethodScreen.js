import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

const METHODS = [
    { id: 'online', name: 'Razorpay / Card', icon: 'card-outline', desc: 'Secure online payment' },
    // Wallet disabled for now - will be enabled later
    // { id: 'wallet', name: 'My Wallet', icon: 'wallet-outline', desc: 'Balance: ₹2,500' },
    { id: 'cod', name: 'Cash on Service', icon: 'cash-outline', desc: 'Pay after job completion' },
];

export default function PaymentMethodScreen({ route, navigation }) {
    const { total, service, address, time, date } = route.params;
    const [selectedMethod, setSelectedMethod] = useState('cod'); // Default to Cash on Service
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            console.log('🎯 Starting booking with data:', { service, address, time, date });

            // Map service.id to valid serviceType for backend
            const serviceTypeMap = {
                'r1': 'repair',
                'r2': 'service',
                'r3': 'install',
                'i1': 'install',
                's1': 'service',
                'emergency': 'emergency'
            };

            const mappedServiceType = serviceTypeMap[service?.id] || 'service';
            console.log('Mapped service type:', service?.id, '→', mappedServiceType);

            // Format location properly - backend expects lat/lng (NOT latitude/longitude)
            const pickupLocation = {
                address: address?.description || address?.address || 'No address provided',
                lat: address?.location?.lat || 0,
                lng: address?.location?.lng || 0
            };

            console.log('Pickup location:', pickupLocation);

            // Validate coordinates
            if (!pickupLocation.lat || !pickupLocation.lng) {
                Alert.alert('Invalid Location', 'Please select a valid location with coordinates');
                setLoading(false);
                return;
            }

            // Make booking request
            const response = await rideService.requestRide(
                pickupLocation,
                { address: 'Technician Hub', lat: 0, lng: 0 },
                mappedServiceType,
                selectedMethod.toUpperCase() // Ensure it's 'COD' or 'ONLINE'
            );

            console.log('Booking response:', response);

            if (response.success) {
                // Extract rideId from response - handle both formats
                const jobId = response.rideId || response.data?.rideId || 'UNKNOWN';
                console.log('✅ Navigating to payment status with Job ID:', jobId);

                navigation.navigate('PaymentStatus', {
                    status: 'success',
                    rideId: jobId,
                    total,
                    paymentMethod: selectedMethod
                });
            } else {
                Alert.alert('Booking Failed', response.error || 'Unable to create booking');
            }
        } catch (error) {
            console.error('❌ Payment error:', error);
            Alert.alert('Error', 'Something went wrong: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>CHOOSE PAYMENT</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Payable Amount</Text>
                    <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Payment Methods</Text>
                <View style={styles.methodList}>
                    {METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[styles.methodItem, selectedMethod === method.id && styles.activeMethod]}
                            onPress={() => setSelectedMethod(method.id)}
                        >
                            <View style={[styles.iconCircle, selectedMethod === method.id && styles.activeIconCircle]}>
                                <Ionicons name={method.icon} size={24} color={selectedMethod === method.id ? COLORS.white : COLORS.roseGold} />
                            </View>
                            <View style={styles.methodDetails}>
                                <Text style={styles.methodName}>{method.name}</Text>
                                <Text style={styles.methodDesc}>{method.desc}</Text>
                            </View>
                            <View style={styles.radio}>
                                {selectedMethod === method.id && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.payBtn}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    <Text style={styles.payBtnText}>{loading ? 'Processing...' : 'Confirm & Book'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    title: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    content: { padding: SPACING.xl },
    totalCard: { backgroundColor: COLORS.roseGold, borderRadius: 25, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xxl, ...SHADOWS.medium },
    totalLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginBottom: 8 },
    totalValue: { fontSize: 32, fontWeight: '900', color: COLORS.white },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.lg },
    methodList: { gap: SPACING.md },
    methodItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: 20, borderWidth: 1, borderColor: COLORS.greyLight, backgroundColor: COLORS.white },
    activeMethod: { borderColor: COLORS.roseGold, backgroundColor: COLORS.primaryBg },
    iconCircle: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
    activeIconCircle: { backgroundColor: COLORS.roseGold },
    methodDetails: { flex: 1 },
    methodName: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    methodDesc: { fontSize: 12, color: COLORS.grey },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.roseGold, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.roseGold },
    footer: { padding: SPACING.xl, position: 'absolute', bottom: 0, width: width },
    payBtn: { backgroundColor: COLORS.roseGold, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
    payBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
