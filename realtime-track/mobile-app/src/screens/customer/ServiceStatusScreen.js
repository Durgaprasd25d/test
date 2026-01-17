import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';
import customerSocketService from '../../services/customerSocketService';
import customerLocationService from '../../services/customerLocationService';

const { width } = Dimensions.get('window');

export default function ServiceStatusScreen({ route, navigation }) {
    const { rideId, otp, initialStep = 'in_progress', total, paymentTiming } = route?.params || {};
    const [step, setStep] = useState(initialStep); // in_progress, service_ended, completed, rating
    const [liveStatus, setLiveStatus] = useState(null);
    const [currentOtp, setCurrentOtp] = useState(otp);
    const [showPayButton, setShowPayButton] = useState(false);
    const [serviceAmount, setServiceAmount] = useState(total || 0);
    const [technicianLocation, setTechnicianLocation] = useState(null);
    const [technicianHeading, setTechnicianHeading] = useState(0);
    const [animatedMarker, setAnimatedMarker] = useState(null);
    const [etaData, setEtaData] = useState({ distance: '--', duration: '--' });

    useEffect(() => {
        fetchLatestStatus();

        const socket = customerSocketService.getSocket();
        if (socket) {
            socket.on('ride:service_ended', (data) => {
                if (data.price) {
                    setServiceAmount(data.price);
                }
                if (data.paymentTiming === 'POSTPAID' && data.paymentMethod === 'ONLINE') {
                    setStep('service_ended');
                    setShowPayButton(true);
                } else if (data.paymentTiming === 'PREPAID') {
                    setStep('completed');
                }
            });

            socket.on('payment:success', (data) => {
                setShowPayButton(false);
                setStep('completed');
                if (data.completionOtp) {
                    setCurrentOtp(data.completionOtp);
                }
            });

            socket.on('ride:completed', () => {
                setStep('completed');
            });

            // Start tracking technician location
            if (rideId) {
                customerLocationService.startTracking(socket, rideId, handleTechnicianLocationUpdate);
            }
        }

        return () => {
            if (socket) {
                socket.off('ride:service_ended');
                socket.off('payment:success');
                socket.off('ride:completed');
            }
            customerLocationService.stopTracking();
        };
    }, [rideId]);

    const handleTechnicianLocationUpdate = (location) => {
        const { lat, lng, bearing } = location;

        // Initialize AnimatedRegion on first update
        if (!animatedMarker) {
            const newMarker = new AnimatedRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            setAnimatedMarker(newMarker);
            setTechnicianLocation({ latitude: lat, longitude: lng });
        } else {
            // Smooth 60fps animation to new position
            animatedMarker.timing({
                latitude: lat,
                longitude: lng,
                duration: 1000, // 1s to match GPS update interval
                useNativeDriver: false
            }).start();
            setTechnicianLocation({ latitude: lat, longitude: lng });
        }

        setTechnicianHeading(bearing || 0);
        console.log(`🎯 [CUSTOMER] Received location: ${lat.toFixed(6)}, ${lng.toFixed(6)}, heading: ${bearing}°`);
    };

    const fetchLatestStatus = async () => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/ride/${rideId}`);
            const result = await res.json();
            if (result.success) {
                const data = result.data;
                setLiveStatus(data);

                // State recovery logic
                if (data.status === 'COMPLETED') {
                    setStep('completed');
                } else if (data.status === 'IN_PROGRESS' || data.status === 'ARRIVED') {
                    // Check if completion OTP is ready (post-payment or prepaid)
                    if (data.paymentStatus === 'PAID') {
                        setStep('completed');
                        setCurrentOtp(data.completionOtp);
                    } else if (data.completionOtp && data.paymentTiming === 'POSTPAID') {
                        // Service ended, waiting for payment
                        setStep('service_ended');
                        setShowPayButton(true);
                        setServiceAmount(data.price || 1000);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching latest status:', error);
        }
    };

    const renderInProgress = () => (
        <View style={styles.centerContainer}>
            {/* Real-Time Tracking Map */}
            {(liveStatus?.status === 'ACCEPTED' || liveStatus?.status === 'ARRIVED') && (
                <View style={styles.mapContainer}>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={{
                            latitude: liveStatus?.pickup?.lat || 20.2961,
                            longitude: liveStatus?.pickup?.lng || 85.8245,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                    >
                        {/* Customer Pickup Marker */}
                        {liveStatus?.pickup && (
                            <Marker coordinate={{ latitude: liveStatus.pickup.lat, longitude: liveStatus.pickup.lng }}>
                                <View style={styles.destMarker}>
                                    <Ionicons name="home" size={24} color={COLORS.indigo} />
                                </View>
                            </Marker>
                        )}

                        {/* Technician Animated Marker (Smooth 60fps) */}
                        {animatedMarker && (
                            <Marker.Animated coordinate={animatedMarker} anchor={{ x: 0.5, y: 0.5 }}>
                                <View style={[styles.techMarker, { transform: [{ rotate: `${technicianHeading}deg` }] }]}>
                                    <Ionicons name="navigate" size={30} color={COLORS.indigo} />
                                </View>
                            </Marker.Animated>
                        )}

                        {/* Route Polyline with ETA */}
                        {technicianLocation && liveStatus?.pickup && (
                            <MapViewDirections
                                origin={technicianLocation}
                                destination={{ latitude: liveStatus.pickup.lat, longitude: liveStatus.pickup.lng }}
                                apikey={config.GOOGLE_MAPS_API_KEY}
                                strokeWidth={4}
                                strokeColor={COLORS.indigo}
                                precision="high"
                                mode="DRIVING"
                                optimizeWaypoints={false}
                                onReady={(result) => {
                                    setEtaData({
                                        distance: result.distance.toFixed(1) + ' km',
                                        duration: Math.round(result.duration) + ' min'
                                    });
                                }}
                                onError={(error) => console.warn('Directions error:', error)}
                            />
                        )}
                    </MapView>

                    {/* Live ETA Badge */}
                    {technicianLocation && (
                        <View style={styles.etaBadge}>
                            <Ionicons name="time" size={16} color={COLORS.white} />
                            <Text style={styles.etaText}>Technician arrives in {etaData.duration} • {etaData.distance}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.otpCard}>
                <LinearGradient
                    colors={['rgba(79, 70, 229, 0.05)', 'rgba(79, 70, 229, 0.02)']}
                    style={styles.otpGradient}
                >
                    <Text style={styles.otpLabel}>SHARE OTP WITH TECHNICIAN</Text>
                    <View style={styles.otpNumberContainer}>
                        {(currentOtp || otp)?.toString().split('').map((char, i) => (
                            <View key={i} style={styles.otpDigitBox}>
                                <Text style={styles.otpDigitText}>{char}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.otpDesc}>Verification ensures your safety and service quality.</Text>
                </LinearGradient>
            </View>

            <View style={styles.progressBox}>
                <View style={styles.pulseContainer}>
                    <View style={styles.pulseCircle} />
                    <View style={styles.mainCircle}>
                        <Ionicons name="construct" size={40} color={COLORS.indigo} />
                    </View>
                </View>
                <Text style={styles.statusTitle}>Expert is Working</Text>
                <Text style={styles.statusSubtitle}>Your AC unit is currently being serviced. Feel free to relax!</Text>
            </View>
        </View>
    );

    const renderServiceEnded = () => (
        <View style={styles.centerContainer}>
            <View style={styles.successIconBox}>
                <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.circleGradient}
                >
                    <Ionicons name="checkmark-done" size={60} color="#fff" />
                </LinearGradient>
            </View>

            <Text style={styles.statusTitle}>Almost Done!</Text>
            <Text style={styles.statusSubtitle}>Service has been completed successfully. Please settle the final payment.</Text>

            <View style={styles.finalPaymentCard}>
                <Text style={styles.finalPaymentLabel}>Total Amount Due</Text>
                <View style={styles.amountRow}>
                    <Text style={styles.finalCurrency}>₹</Text>
                    <Text style={styles.finalAmount}>{serviceAmount}</Text>
                </View>
                <View style={styles.paymentSecurity}>
                    <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
                    <Text style={styles.securityText}>Verified Secure Transaction</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.mainActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                    navigation.navigate('CustomerRazorpayCheckout', {
                        rideId: rideId,
                        amount: serviceAmount,
                        paymentTiming: 'POSTPAID'
                    });
                }}
            >
                <LinearGradient
                    colors={[COLORS.indigo, '#3730a3']}
                    style={styles.actionBtnGradient}
                >
                    <Ionicons name="card" size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.actionBtnText}>Pay Now via Razorpay</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderCompleted = () => (
        <View style={styles.centerContainer}>
            <View style={[styles.successIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="sparkles" size={70} color="#22c55e" />
            </View>
            <Text style={styles.statusTitle}>Service Finished!</Text>
            <Text style={styles.statusSubtitle}>Your cooling expert has finished the job. Hope everything is perfect!</Text>

            <TouchableOpacity
                style={styles.mainActionBtn}
                activeOpacity={0.8}
                onPress={() => setStep('rating')}
            >
                <LinearGradient
                    colors={[COLORS.slate, COLORS.slateLight]}
                    style={styles.actionBtnGradient}
                >
                    <Text style={styles.actionBtnText}>Leave a Rating</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderRating = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.statusTitle}>Rate Experience</Text>
            <Text style={styles.statusSubtitle}>How would you rate the service quality?</Text>

            <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} style={styles.starBtn}>
                        <Ionicons name="star" size={44} color={i <= 4 ? "#f59e0b" : "#e2e8f0"} />
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.mainActionBtn}
                activeOpacity={0.8}
                onPress={() => navigation.replace('Home')}
            >
                <LinearGradient
                    colors={[COLORS.indigo, '#3730a3']}
                    style={styles.actionBtnGradient}
                >
                    <Text style={styles.actionBtnText}>Submit & Finish</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[COLORS.slate, COLORS.slateLight]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View style={{ width: 44 }} />
                        <Text style={styles.headerTitle}>Live Activity</Text>
                        <TouchableOpacity style={styles.helpBtn}>
                            <Ionicons name="help-circle-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.mainContent}>
                {step === 'in_progress' && renderInProgress()}
                {step === 'service_ended' && renderServiceEnded()}
                {step === 'completed' && renderCompleted()}
                {step === 'rating' && renderRating()}
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
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    helpBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
    },
    mapContainer: {
        width: '100%',
        height: 350,
        backgroundColor: '#eee',
        marginBottom: 20,
        overflow: 'hidden',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...SHADOWS.medium,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    techMarker: {
        width: 50,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
        borderWidth: 2,
        borderColor: COLORS.indigo,
    },
    destMarker: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 15,
        ...SHADOWS.medium,
    },
    etaBadge: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: COLORS.indigo,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.heavy,
    },
    etaText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    otpCard: {
        width: width - 48,
        marginHorizontal: 24,
        borderRadius: 24,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: COLORS.indigo,
        overflow: 'hidden',
        marginVertical: 20,
        ...SHADOWS.medium,
    },
    otpGradient: {
        padding: 24,
        alignItems: 'center',
    },
    otpLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.indigo,
        marginBottom: 20,
        letterSpacing: 1.5,
    },
    otpNumberContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    otpDigitBox: {
        width: 50,
        height: 60,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...SHADOWS.light,
    },
    otpDigitText: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.textMain,
    },
    otpDesc: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 18,
        fontWeight: '500',
    },
    progressBox: {
        alignItems: 'center',
        width: '100%',
    },
    pulseContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    mainCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        ...SHADOWS.medium,
    },
    pulseCircle: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        zIndex: 1,
    },
    statusTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.textMain,
        marginBottom: 10,
        textAlign: 'center'
    },
    statusSubtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    successIconBox: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    circleGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finalPaymentCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
        marginTop: 30,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.medium,
    },
    finalPaymentLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    finalCurrency: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.indigo,
        marginTop: 10,
        marginRight: 4,
    },
    finalAmount: {
        fontSize: 52,
        fontWeight: '900',
        color: COLORS.textMain
    },
    paymentSecurity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
    },
    securityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#22c55e',
    },
    mainActionBtn: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        marginTop: 40,
        overflow: 'hidden',
        ...SHADOWS.medium
    },
    actionBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 30,
        marginBottom: 20,
    },
    starBtn: {
        padding: 4,
    }
});

