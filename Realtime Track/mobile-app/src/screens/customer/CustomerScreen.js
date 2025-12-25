import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Dimensions,
    Linking,
    Alert,
    Modal,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedMarker from '../../components/AnimatedMarker';
import customerSocketService from '../../services/customerSocketService';
import pollingService from '../../services/pollingService';
import technicianMapService from '../../services/technicianMapService';
import useLocationStore from '../../store/useLocationStore';
import { getCameraRegion, isGPSNoise } from '../../utils/mapUtils';
import config from '../../constants/config';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function CustomerScreen({ route }) {
    const { rideId } = route?.params || {};

    const mapRef = useRef(null);
    const {
        rideStatus,
        setRideStatus,
        pickupLocation,
        setPickupLocation
    } = useLocationStore();

    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [statusMessage, setStatusMessage] = useState('Assigning technician...');
    const [isCameraFollowing, setIsCameraFollowing] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [bearing, setBearing] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const [assignedTech, setAssignedTech] = useState(null);
    const [entranceOtp, setEntranceOtp] = useState(null);
    const [mainOtp, setMainOtp] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const assignedTechRef = useRef(null);

    // Sync ref with state
    useEffect(() => {
        assignedTechRef.current = assignedTech;
    }, [assignedTech]);

    useEffect(() => {
        // Fetch initially
        fetchOnlineTechnicians();
        fetchRideDetails();

        // Refresh every 10 seconds until assigned
        const intervalId = setInterval(() => {
            if (!assignedTechRef.current) {
                console.log('⏱️ Periodic refresh check...');
                fetchOnlineTechnicians();
                fetchRideDetails();
            }
        }, 10000);


        customerSocketService.connect(
            rideId,
            handleLocationUpdate,
            handleConnectionChange
        );

        return () => {
            clearInterval(intervalId);
            customerSocketService.disconnect();
            pollingService.stop();
        };
    }, [rideId]); // REMOVED assignedTech dependency to stop infinite loop

    const fetchOnlineTechnicians = async () => {
        const result = await technicianMapService.getOnlineTechnicians();
        if (result.success) {
            console.log('Online technicians:', result.technicians.length);
            setOnlineTechnicians(result.technicians);
        }
    };

    const fetchRideDetails = async () => {
        try {
            console.log('🔍 Fetching ride details for:', rideId);
            const response = await fetch(`${config.BACKEND_URL}/api/ride/${rideId}`);
            const result = await response.json();

            console.log('📄 Ride details response:', JSON.stringify(result, null, 2));

            if (result.success && result.data) {
                const ride = result.data;
                console.log('🚦 Current ride status:', ride.status);

                // Set pickup location from DB
                if (ride.pickup) {
                    setPickupLocation({
                        address: ride.pickup.address,
                        latitude: ride.pickup.lat,
                        longitude: ride.pickup.lng
                    });
                }

                if (ride.status === 'ACCEPTED' || ride.status === 'STARTED' || ride.status === 'ARRIVED' || ride.status === 'IN_PROGRESS' || ride.status === 'COMPLETED') {
                    console.log('👨‍🔧 Technician already assigned:', ride.technician?.name);
                    setAssignedTech(ride.technician);

                    // Set initial live location from DB if available
                    if (ride.technician?.location) {
                        const initialLoc = {
                            latitude: ride.technician.location.lat,
                            longitude: ride.technician.location.lng,
                            timestamp: Date.now()
                        };
                        console.log('📍 Setting initial technician location from DB:', initialLoc);
                        setCurrentLocation(initialLoc);
                    }

                    setRideStatus(ride.status);
                    setEntranceOtp(ride.arrivalOtp);
                    setMainOtp(ride.completionOtp);
                    setPaymentMethod(ride.paymentMethod || 'COD');

                    const messages = {
                        'ACCEPTED': 'Technician is on the way!',
                        'ARRIVED': 'Technician has arrived!',
                        'IN_PROGRESS': 'Service in progress...',
                        'COMPLETED': 'Service Completed!'
                    };
                    setStatusMessage(messages[ride.status] || 'Technician is here');
                    setOnlineTechnicians([]);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching ride details:', error);
        }
    };

    const handlePaymentChange = async (method) => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/update-payment-method`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId, paymentMethod: method })
            });
            const result = await response.json();
            if (result.success) {
                setPaymentMethod(method);
                setShowPaymentModal(false);
            }
        } catch (error) {
            console.error('Update payment error:', error);
            Alert.alert('Error', 'Could not update payment method');
        }
    };


    useEffect(() => {
        const socket = customerSocketService.getSocket();
        if (socket) {
            socket.on('ride:accepted', (data) => {
                setAssignedTech(data.technician);
                setEntranceOtp(data.arrivalOtp);
                setRideStatus('ACCEPTED');
                setStatusMessage('Technician is on the way!');
                setOnlineTechnicians([]);
            });

            socket.on('ride:arrived', () => {
                setRideStatus('ARRIVED');
                setStatusMessage('Technician has arrived!');
            });

            socket.on('ride:in_progress', () => {
                setRideStatus('IN_PROGRESS');
                setStatusMessage('Service in progress...');
            });

            socket.on('payment:method_updated', (data) => {
                setPaymentMethod(data.paymentMethod);
                Alert.alert('Payment Updated', `Payment method changed to ${data.paymentMethod}`);
            });

            socket.on('ride:service_ended', (data) => {
                if (data.completionOtp) setMainOtp(data.completionOtp);
                setStatusMessage('Service ended. Please provide OTP to complete.');
            });

            socket.on('payment:success', (data) => {
                setMainOtp(data.completionOtp);
                Alert.alert('Payment Successful', 'Payment confirmed! Please share the OTP with the technician.');
            });

            socket.on('ride:completed', () => {
                setRideStatus('COMPLETED');
                setStatusMessage('Service Completed!');
            });

            return () => {
                socket.off('ride:accepted');
                socket.off('ride:arrived');
                socket.off('ride:in_progress');
                socket.off('payment:method_updated');
                socket.off('ride:service_ended');
                socket.off('payment:success');
                socket.off('ride:completed');
            };
        }
    }, [rideId]);

    const handleConnectionChange = (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
            if (isPolling) {
                pollingService.stop();
                setIsPolling(false);
            }
        } else if (status === 'disconnected' || status === 'error') {
            if (!isPolling) {
                pollingService.start(rideId, handleLocationUpdate);
                setIsPolling(true);
            }
        }
    };

    const handleLocationUpdate = (locationData) => {
        console.log('========================================');
        console.log('📍 CUSTOMER: Location update received');
        console.log('Raw data:', JSON.stringify(locationData, null, 2));

        const newLocation = {
            latitude: locationData.lat,
            longitude: locationData.lng,
            timestamp: locationData.timestamp || Date.now(),
        };

        console.log('📌 New coordinates:', newLocation.latitude.toFixed(6), newLocation.longitude.toFixed(6));
        console.log('⏰ Timestamp:', new Date(newLocation.timestamp).toLocaleTimeString());

        // Always update - no filtering for customer side
        if (currentLocation) {
            const moved = Math.abs(currentLocation.latitude - newLocation.latitude) +
                Math.abs(currentLocation.longitude - newLocation.longitude);
            console.log('🔄 Position change:', moved > 0.00001 ? 'MOVED ✅' : 'SAME ⚠️');
        }

        setPreviousLocation(currentLocation);
        setCurrentLocation(newLocation);
        setBearing(locationData.bearing || 0);

        console.log('✅ CUSTOMER: State updated - marker should move');
        console.log('========================================');
    };




    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: pickupLocation?.latitude || 20.2605, // Updated to match Jagamara area or default
                    longitude: pickupLocation?.longitude || 85.7922,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={true}
                zoomEnabled={true}
                scrollEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
                customMapStyle={customerMapStyle}
            >
                {/* Show all online technicians when no one is assigned */}
                {!assignedTech && onlineTechnicians.map((tech) => (
                    <Marker
                        key={tech.id}
                        coordinate={{ latitude: tech.location.lat, longitude: tech.location.lng }}
                        title={tech.name}
                        description="Available Technician"
                    >
                        <View style={styles.techMarker}>
                            <Ionicons name="car" size={24} color={COLORS.technicianPrimary} />
                        </View>
                    </Marker>
                ))}

                {/* Show assigned technician's live location - SIMPLE CIRCULAR MARKER */}
                {currentLocation && assignedTech && (
                    <Marker
                        coordinate={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                        rotation={bearing}
                    >
                        <View style={styles.technicianMarker}>
                            <View style={styles.technicianDot} />
                        </View>
                    </Marker>
                )}

                {pickupLocation && (
                    <Marker
                        coordinate={{
                            latitude: pickupLocation.latitude,
                            longitude: pickupLocation.longitude
                        }}
                    >
                        <View style={styles.destMarker}>
                            <Ionicons name="location" size={24} color={COLORS.roseGold} />
                        </View>
                    </Marker>
                )}

                {currentLocation && pickupLocation && (
                    <MapViewDirections
                        origin={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude
                        }}
                        destination={{
                            latitude: pickupLocation.latitude,
                            longitude: pickupLocation.longitude
                        }}
                        apikey={config.GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor={COLORS.roseGold}
                        precision="high"
                        mode="DRIVING"
                        optimizeWaypoints={true}
                        onReady={(result) => {
                            console.log('Route ready - Distance:', result.distance, 'Duration:', result.duration);
                            // Fit to route only once on first load
                            if (mapRef.current && !mapRef.current.hasInitialFit) {
                                mapRef.current.hasInitialFit = true;
                                mapRef.current.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 150, right: 50, bottom: 250, left: 50 },
                                    animated: true
                                });
                            }
                        }}
                        onError={(error) => {
                            console.error('❌ Route error:', error);
                        }}
                    />
                )}
            </MapView>

            <View style={styles.topBar}>
                <View style={[styles.statusIndicator, { backgroundColor: connectionStatus === 'connected' ? COLORS.success : COLORS.warning }]} />
                <Text style={styles.statusMsg}>{statusMessage}</Text>
                {connectionStatus !== 'connected' && <ActivityIndicator size="small" color={COLORS.roseGold} style={{ marginLeft: 10 }} />}
            </View>

            <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.rideIdText}>JOB ID: {rideId?.substring(4, 12).toUpperCase()}</Text>
                    {entranceOtp && (rideStatus === 'ACCEPTED' || rideStatus === 'REQUESTED') && (
                        <View style={styles.otpBadge}>
                            <Text style={styles.otpLabel}>ENTRANCE OTP</Text>
                            <Text style={styles.otpValue}>{entranceOtp}</Text>
                        </View>
                    )}
                </View>


                <View style={styles.technicianCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={28} color={COLORS.white} />
                    </View>
                    <View style={styles.technicianDetails}>
                        <Text style={styles.technicianName}>
                            {assignedTech?.name || 'Professional Technician'}
                        </Text>
                        <View style={styles.techRatingRow}>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{assignedTech?.rating || '4.5'}</Text>
                            </View>
                            <Text style={styles.techPhone}>{assignedTech?.phone || ''}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{rideStatus || 'ALLOCATING'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.callCircle}
                        onPress={() => {
                            if (assignedTech?.phone) {
                                Linking.openURL(`tel:${assignedTech.phone}`);
                            } else {
                                Alert.alert('Not Available', 'Technician phone number not available yet');
                            }
                        }}
                    >
                        <Ionicons name="call" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Service Completion OTP */}
                {mainOtp && (
                    <View style={styles.mainOtpContainer}>
                        <Text style={styles.mainOtpTitle}>SERVICE COMPLETION OTP</Text>
                        <Text style={styles.mainOtpCode}>{mainOtp}</Text>
                        <Text style={styles.mainOtpHelper}>Share this with technician to finish the job</Text>
                    </View>
                )}

                {/* Payment Method Section */}
                <View style={styles.paymentRow}>
                    <View style={styles.paymentInfo}>
                        <Ionicons
                            name={paymentMethod === 'COD' ? 'cash-outline' : 'card-outline'}
                            size={20}
                            color={COLORS.roseGold}
                        />
                        <Text style={styles.paymentLabel}>PAYMENT: {paymentMethod}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => setShowPaymentModal(true)}
                    >
                        <Text style={styles.changeBtnText}>CHANGE</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.locationContainer}>
                    <View style={styles.dotLine}>
                        <View style={[styles.dot, { backgroundColor: COLORS.roseGold }]} />
                        <View style={styles.line} />
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>SERVICE LOCATION</Text>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {pickupLocation?.address || 'Detecting address...'}
                        </Text>
                    </View>
                </View>

                {rideStatus === 'COMPLETED' && (
                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.doneBtnText}>BACK TO HOME</Text>
                    </TouchableOpacity>
                )}

                {/* Payment Change Modal */}
                <Modal
                    visible={showPaymentModal}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Choose Payment Method</Text>

                            <TouchableOpacity
                                style={[styles.methodOption, paymentMethod === 'COD' && styles.methodSelected]}
                                onPress={() => handlePaymentChange('COD')}
                            >
                                <Ionicons name="cash" size={24} color={paymentMethod === 'COD' ? COLORS.white : COLORS.roseGold} />
                                <Text style={[styles.methodText, paymentMethod === 'COD' && styles.methodTextSelected]}>Cash on Service</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.methodOption, paymentMethod === 'ONLINE' && styles.methodSelected]}
                                onPress={() => handlePaymentChange('ONLINE')}
                            >
                                <Ionicons name="card" size={24} color={paymentMethod === 'ONLINE' ? COLORS.white : COLORS.roseGold} />
                                <Text style={[styles.methodText, paymentMethod === 'ONLINE' && styles.methodTextSelected]}>Pay Online</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowPaymentModal(false)}
                            >
                                <Text style={styles.closeBtnText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

const customerMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#fdf8f8" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#b76e79" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e3f2fd" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    map: { flex: 1 },
    destMarker: {
        backgroundColor: COLORS.white,
        padding: SPACING.xs,
        borderRadius: 20,
        ...SHADOWS.medium,
        borderWidth: 1.5,
        borderColor: COLORS.roseGold,
    },
    techMarker: {
        backgroundColor: COLORS.technicianBg,
        padding: SPACING.xs,
        borderRadius: 20,
        ...SHADOWS.medium,
        borderWidth: 1.5,
        borderColor: COLORS.technicianPrimary,
    },

    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    statusMsg: { fontSize: 13, fontWeight: '700', color: COLORS.black, letterSpacing: 0.5 },
    bottomSheet: {
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        ...SHADOWS.medium,
        marginTop: -32,
    },
    rideIdText: {
        fontSize: 10,
        color: COLORS.grey,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    otpBadge: {
        backgroundColor: COLORS.technicianBg,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    otpLabel: {
        fontSize: 8,
        color: COLORS.technicianPrimary,
        fontWeight: 'bold',
    },
    otpValue: {
        fontSize: 14,
        color: COLORS.technicianPrimary,
        fontWeight: '900',
        letterSpacing: 2,
    },
    mainOtpContainer: {
        backgroundColor: '#F8F9FA',
        padding: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    mainOtpTitle: {
        fontSize: 10,
        color: COLORS.grey,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    mainOtpCode: {
        fontSize: 28,
        color: COLORS.black,
        fontWeight: '900',
        letterSpacing: 8,
    },
    mainOtpHelper: {
        fontSize: 10,
        color: COLORS.grey,
        marginTop: 4,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginBottom: SPACING.sm,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.black,
        marginLeft: 8,
    },
    changeBtn: {
        backgroundColor: COLORS.roseGold + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    changeBtnText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.roseGold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        padding: SPACING.xl,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },
    methodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: 16,
        backgroundColor: '#F8F9FA',
        marginBottom: SPACING.md,
    },
    methodSelected: {
        backgroundColor: COLORS.roseGold,
    },
    methodText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginLeft: SPACING.md,
    },
    methodTextSelected: {
        color: COLORS.white,
    },
    closeBtn: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.grey,
    },
    technicianCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: 24,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.roseGold,
        alignItems: 'center',
        justifyContent: 'center'
    },
    technicianDetails: { flex: 1, marginLeft: SPACING.md },
    technicianName: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
    badge: {
        backgroundColor: COLORS.roseGoldLight,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start'
    },
    badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.roseGold, textTransform: 'uppercase' },
    techRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 8,
    },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: COLORS.warning, marginLeft: 2 },
    techPhone: { fontSize: 12, color: COLORS.grey, fontWeight: '500' },
    callCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.roseGold,
        alignItems: 'center',
        justifyContent: 'center'
    },
    locationContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.sm },
    dotLine: { alignItems: 'center', marginRight: SPACING.md, paddingTop: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    line: { width: 2, height: 20, backgroundColor: COLORS.greyLight, marginTop: 4 },
    locationInfo: { flex: 1 },
    locationLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grey, marginBottom: 2 },
    addressText: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
    doneBtn: {
        backgroundColor: COLORS.roseGold,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        ...SHADOWS.light,
    },
    doneBtnText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
    technicianMarker: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    technicianDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.technicianPrimary,
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
});
