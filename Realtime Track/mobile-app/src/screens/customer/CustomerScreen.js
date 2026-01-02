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
    StatusBar,
    ScrollView as RNScrollView,
    Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedMarker from '../../components/AnimatedMarker';
import customerSocketService from '../../services/customerSocketService';
import pollingService from '../../services/pollingService';
import technicianMapService from '../../services/technicianMapService';
import useLocationStore from '../../store/useLocationStore';
import config from '../../constants/config';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function CustomerScreen({ route, navigation }) {
    const { rideId } = route?.params || {};

    const mapRef = useRef(null);
    const {
        rideStatus,
        setRideStatus,
        pickupLocation,
        setPickupLocation
    } = useLocationStore();

    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [statusMessage, setStatusMessage] = useState('Locating nearby experts...');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [bearing, setBearing] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const [onlineTechnicians, setOnlineTechnicians] = useState([]);
    const [assignedTech, setAssignedTech] = useState(null);
    const [entranceOtp, setEntranceOtp] = useState(null);
    const [mainOtp, setMainOtp] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [paymentStatus, setPaymentStatus] = useState('PENDING');
    const [paymentTiming, setPaymentTiming] = useState('PREPAID');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const CANCEL_REASONS = [
        "Technician delaying too much",
        "Change of plans / Emergency",
        "Incorrect service type selected",
        "Found a better price elsewhere",
        "No longer need the service",
        "Other"
    ];

    const assignedTechRef = useRef(null);

    // Bottom Sheet Animation State
    const translateY = useRef(new Animated.Value(0)).current;
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const SHEET_HEIGHT = 450;
    const CLOSED_OFFSET = 280; // Distance to push down when closed

    const toggleBottomSheet = () => {
        const toValue = isSheetOpen ? 0 : CLOSED_OFFSET;
        Animated.spring(translateY, {
            toValue,
            useNativeDriver: true,
            bounciness: 4
        }).start();
        setIsSheetOpen(!isSheetOpen);
    };

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationY: translateY } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            const { translationY, velocityY } = event.nativeEvent;

            if (translationY > 100 || velocityY > 500) {
                // Close
                Animated.spring(translateY, {
                    toValue: CLOSED_OFFSET,
                    useNativeDriver: true
                }).start();
                setIsSheetOpen(false);
            } else if (translationY < -100 || velocityY < -500) {
                // Open
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
                setIsSheetOpen(true);
            } else {
                // Snap back
                Animated.spring(translateY, {
                    toValue: isSheetOpen ? 0 : CLOSED_OFFSET,
                    useNativeDriver: true
                }).start();
            }
        }
    };

    useEffect(() => {
        assignedTechRef.current = assignedTech;
    }, [assignedTech]);

    useEffect(() => {
        fetchOnlineTechnicians();
        fetchRideDetails();

        const intervalId = setInterval(() => {
            if (!assignedTechRef.current) {
                fetchOnlineTechnicians();
                fetchRideDetails();
            }
        }, 8000);

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
    }, [rideId]);

    const fetchOnlineTechnicians = async () => {
        const result = await technicianMapService.getOnlineTechnicians();
        if (result.success) {
            setOnlineTechnicians(result.technicians);
        }
    };

    const fetchRideDetails = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/${rideId}`);
            const result = await response.json();

            if (result.success && result.data) {
                const ride = result.data;
                if (ride.pickup) {
                    setPickupLocation({
                        address: ride.pickup.address,
                        latitude: ride.pickup.lat,
                        longitude: ride.pickup.lng
                    });
                }

                if (['ACCEPTED', 'STARTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(ride.status)) {
                    setAssignedTech(ride.technician);
                    if (ride.technician?.location) {
                        setCurrentLocation({
                            latitude: ride.technician.location.lat,
                            longitude: ride.technician.location.lng,
                            timestamp: Date.now()
                        });
                    }

                    setRideStatus(ride.status);
                    setEntranceOtp(ride.arrivalOtp);
                    setMainOtp(ride.completionOtp);
                    setPaymentMethod(ride.paymentMethod || 'ONLINE');
                    setPaymentStatus(ride.paymentStatus || 'PENDING');
                    setPaymentTiming(ride.paymentTiming || 'PREPAID');

                    const messages = {
                        'ACCEPTED': 'Technician is en route',
                        'ARRIVED': 'Technician has arrived',
                        'IN_PROGRESS': 'System diagnostic in progress',
                        'COMPLETED': 'Service finalized successfully',
                        'CANCELLED': 'Booking was cancelled'
                    };
                    setStatusMessage(messages[ride.status] || 'Expert is working');
                    setOnlineTechnicians([]);
                }
            }
        } catch (error) {
            console.error('Error fetching ride details:', error);
        }
    };

    const handleCancelRide = async (reason) => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId, reason })
            });
            const result = await response.json();
            if (result.success) {
                setRideStatus('CANCELLED');
                setStatusMessage('Booking cancelled');
                setShowCancelModal(false);
                Alert.alert('Cancelled', 'Your booking has been cancelled successfully.');
                setTimeout(() => navigation.navigate('Home'), 2000);
            } else {
                Alert.alert('Error', result.error || 'Failed to cancel booking');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Unable to process cancellation at this time.');
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
            Alert.alert('System Error', 'Unable to synchronization payment preference');
        }
    };

    useEffect(() => {
        const socket = customerSocketService.getSocket();
        if (socket) {
            socket.on('ride:accepted', (data) => {
                setAssignedTech(data.technician);
                setEntranceOtp(data.arrivalOtp);
                setRideStatus('ACCEPTED');
                setStatusMessage('Expert technician assigned');
                setOnlineTechnicians([]);
            });

            socket.on('ride:arrived', () => {
                setRideStatus('ARRIVED');
                setStatusMessage('Expert has arrived at location');
            });

            socket.on('ride:in_progress', () => {
                setRideStatus('IN_PROGRESS');
                setStatusMessage('Performance monitoring active');
            });

            socket.on('payment:method_updated', (data) => {
                setPaymentMethod(data.paymentMethod);
            });

            socket.on('ride:service_ended', (data) => {
                if (data.completionOtp) setMainOtp(data.completionOtp);
                setStatusMessage('Awaiting final verification');
            });

            socket.on('payment:success', (data) => {
                setMainOtp(data.completionOtp);
                Alert.alert('Payment Secured', 'Transaction successful. Please share the final completion code.');
            });

            socket.on('ride:completed', () => {
                setRideStatus('COMPLETED');
                setStatusMessage('Service lifecycle completed');
                setTimeout(() => navigation.navigate('Home'), 2500);
            });

            socket.on('ride:cancelled', (data) => {
                setRideStatus('CANCELLED');
                setStatusMessage('Booking cancelled');
                Alert.alert('Booking Cancelled', data.reason || 'The booking has been cancelled.');
                setTimeout(() => navigation.navigate('Home'), 2500);
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
        const newLocation = {
            latitude: locationData.lat,
            longitude: locationData.lng,
            timestamp: locationData.timestamp || Date.now(),
        };
        setPreviousLocation(currentLocation);
        setCurrentLocation(newLocation);
        setBearing(locationData.bearing || 0);
    };

    const getStatusTheme = () => {
        switch (rideStatus) {
            case 'COMPLETED': return { color: '#22c55e', label: 'Success' };
            case 'ARRIVED': return { color: COLORS.indigo, label: 'Arrived' };
            case 'IN_PROGRESS': return { color: '#f59e0b', label: 'Working' };
            default: return { color: COLORS.slate, label: rideStatus || 'Processing' };
        }
    };

    const statusTheme = getStatusTheme();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: pickupLocation?.latitude || 28.6139,
                    longitude: pickupLocation?.longitude || 77.2090,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={premiumTrackingMapStyle}
            >
                {!assignedTech && onlineTechnicians.map((tech) => (tech.location && (
                    <Marker
                        key={tech.id}
                        coordinate={{ latitude: tech.location.lat, longitude: tech.location.lng }}
                    >
                        <View style={styles.miniTechMarker}>
                            <Ionicons name="construct" size={12} color="#fff" />
                        </View>
                    </Marker>
                )))}

                {currentLocation && assignedTech && (
                    <AnimatedMarker
                        currentLocation={currentLocation}
                        previousLocation={previousLocation}
                        bearing={bearing}
                    />
                )}

                {pickupLocation && (
                    <Marker coordinate={{ latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }}>
                        <View style={styles.homeMarker}>
                            <View style={styles.homeMarkerInner}>
                                <Ionicons name="home" size={16} color="#fff" />
                            </View>
                            <View style={styles.homeMarkerBeard} />
                        </View>
                    </Marker>
                )}

                {currentLocation && pickupLocation && (
                    <MapViewDirections
                        origin={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                        destination={{ latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }}
                        apikey={config.GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor={COLORS.indigo}
                        precision="high"
                        mode="DRIVING"
                        onReady={(result) => {
                            if (mapRef.current && !mapRef.current.hasInitialFit) {
                                mapRef.current.hasInitialFit = true;
                                mapRef.current.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 100, right: 60, bottom: 400, left: 60 },
                                    animated: true
                                });
                            }
                        }}
                    />
                )}
            </MapView>

            <View style={styles.topOverlay}>
                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'connected' ? '#22c55e' : '#f59e0b' }]} />
                    <Text style={styles.statusTopText}>{statusMessage}</Text>
                    {connectionStatus !== 'connected' && <ActivityIndicator size="small" color={COLORS.indigo} style={{ marginLeft: 8 }} />}
                </View>

                {['REQUESTED', 'ACCEPTED', 'ARRIVED'].includes(rideStatus) && (
                    <TouchableOpacity
                        style={styles.cancelPill}
                        onPress={() => setShowCancelModal(true)}
                    >
                        <Ionicons name="close-circle" size={16} color="#ef4444" />
                        <Text style={styles.cancelText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.floatingControls}>
                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => mapRef.current?.animateToRegion({
                        latitude: currentLocation?.latitude || pickupLocation?.latitude,
                        longitude: currentLocation?.longitude || pickupLocation?.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    })}
                >
                    <Ionicons name="locate" size={24} color={COLORS.slate} />
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet UI */}
            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
            >
                <Animated.View
                    style={[
                        styles.bottomCard,
                        { transform: [{ translateY: translateY }] }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.sheetHeader}
                        activeOpacity={1}
                        onPress={toggleBottomSheet}
                    >
                        <View style={styles.dragIndicator} />
                    </TouchableOpacity>

                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.jobLabel}>SERVICE REFERENCE</Text>
                            <Text style={styles.jobIdValue}>#{rideId?.substring(rideId.length - 8).toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusTheme.color + '15' }]}>
                            <Text style={[styles.statusBadgeText, { color: statusTheme.color }]}>{statusTheme.label}</Text>
                        </View>
                    </View>

                    <View style={styles.expertRow}>
                        <View style={styles.avatarContainer}>
                            {assignedTech ? (
                                <Ionicons name="person" size={28} color="#fff" />
                            ) : (
                                <ActivityIndicator color="#fff" />
                            )}
                        </View>
                        <View style={styles.expertInfo}>
                            <Text style={styles.expertName}>{assignedTech?.name || 'Searching for Expert...'}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={styles.ratingValue}>{assignedTech?.rating || '4.9'}</Text>
                                <Text style={styles.ratingTotal}>(120+ jobs)</Text>
                            </View>
                        </View>
                        {assignedTech && (
                            <TouchableOpacity
                                style={styles.actionCircle}
                                onPress={() => assignedTech.phone && Linking.openURL(`tel:${assignedTech.phone}`)}
                            >
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {entranceOtp && (rideStatus === 'ACCEPTED' || rideStatus === 'STARTED') && (
                        <View style={styles.otpSection}>
                            <View style={styles.otpBox}>
                                <Text style={styles.otpBoxLabel}>SECURITY ENTRANCE CODE</Text>
                                <Text style={styles.otpBoxValue}>{entranceOtp}</Text>
                            </View>
                            <Text style={styles.otpHint}>Share this only when the expert reaches your door.</Text>
                        </View>
                    )}

                    {mainOtp && (rideStatus === 'ARRIVED' || rideStatus === 'IN_PROGRESS' || rideStatus === 'COMPLETED') && (
                        <View style={styles.otpSection}>
                            <View style={[styles.otpBox, { backgroundColor: COLORS.indigo }]}>
                                <Text style={[styles.otpBoxLabel, { color: 'rgba(255,255,255,0.7)' }]}>FINAL COMPLETION CODE</Text>
                                <Text style={[styles.otpBoxValue, { color: '#fff' }]}>{mainOtp}</Text>
                            </View>
                            <Text style={styles.otpHint}>Provide this to finalize the service and release payment.</Text>
                        </View>
                    )}

                    {/* Post-Service Payment Button */}
                    {rideStatus === 'COMPLETED' && paymentStatus !== 'PAID' && paymentTiming === 'POSTPAID' && (
                        <TouchableOpacity
                            style={styles.payNowBtn}
                            onPress={() => navigation.navigate('CustomerRazorpayCheckout', {
                                rideId: rideId,
                                amount: 1000, // This should come from ride.price
                                paymentTiming: 'POSTPAID'
                            })}
                        >
                            <LinearGradient
                                colors={['#22c55e', '#15803d']}
                                style={styles.doneFullGradient}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Ionicons name="card" size={20} color="#fff" />
                                    <Text style={styles.doneFullText}>Pay & Get Completion Code</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    <View style={styles.footerInfo}>
                        <TouchableOpacity
                            style={[
                                styles.paymentSelector,
                                (paymentStatus === 'PAID' || paymentTiming === 'PREPAID') && styles.paymentLocked
                            ]}
                            onPress={() => paymentStatus !== 'PAID' && setShowPaymentModal(true)}
                            disabled={paymentStatus === 'PAID'}
                        >
                            <View style={styles.paymentIconBox}>
                                <Ionicons name={paymentMethod === 'COD' ? 'cash' : 'card'} size={18} color={COLORS.indigo} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.paymentTitle}>Payment Method</Text>
                                <Text style={styles.paymentValue}>
                                    {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                                    {paymentStatus === 'PAID' && " (Paid)"}
                                </Text>
                            </View>
                            {paymentStatus === 'PAID' ? (
                                <View style={styles.paidBadge}>
                                    <Ionicons name="checkmark-done" size={14} color="#22c55e" />
                                    <Text style={styles.paidBadgeText}>SUCCESS</Text>
                                </View>
                            ) : (
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                            )}
                        </TouchableOpacity>

                        <View style={styles.locationSummary}>
                            <Ionicons name="navigate-circle" size={20} color={COLORS.indigo} />
                            <Text style={styles.locationSummaryText} numberOfLines={1}>
                                {pickupLocation?.address || 'Determining location...'}
                            </Text>
                        </View>
                    </View>

                    {rideStatus === 'COMPLETED' && (
                        <TouchableOpacity
                            style={styles.doneFullBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <LinearGradient
                                colors={[COLORS.indigo, '#3730a3']}
                                style={styles.doneFullGradient}
                            >
                                <Text style={styles.doneFullText}>Return to Dashboard</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </PanGestureHandler>

            <Modal visible={showPaymentModal} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>Change Payment Method</Text>

                        <TouchableOpacity
                            style={[styles.methodItem, paymentMethod === 'COD' && styles.methodItemActive]}
                            onPress={() => handlePaymentChange('COD')}
                        >
                            <View style={[styles.methodIcon, paymentMethod === 'COD' && { backgroundColor: '#fff' }]}>
                                <Ionicons name="cash" size={24} color={paymentMethod === 'COD' ? COLORS.indigo : COLORS.slate} />
                            </View>
                            <Text style={[styles.methodName, paymentMethod === 'COD' && { color: '#fff' }]}>Pay After Service (Cash)</Text>
                            {paymentMethod === 'COD' && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.methodItem, paymentMethod === 'ONLINE' && styles.methodItemActive]}
                            onPress={() => handlePaymentChange('ONLINE')}
                        >
                            <View style={[styles.methodIcon, paymentMethod === 'ONLINE' && { backgroundColor: '#fff' }]}>
                                <Ionicons name="card" size={24} color={paymentMethod === 'ONLINE' ? COLORS.indigo : COLORS.slate} />
                            </View>
                            <Text style={[styles.methodName, paymentMethod === 'ONLINE' && { color: '#fff' }]}>Pay Now (Netbanking/UPI)</Text>
                            {paymentMethod === 'ONLINE' && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowPaymentModal(false)}>
                            <Text style={styles.modalCloseText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Cancellation Modal */}
            <Modal visible={showCancelModal} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>Cancel Service Booking?</Text>
                        <Text style={styles.modalSubTitle}>Please select a reason for cancellation:</Text>

                        <RNScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                            {CANCEL_REASONS.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.reasonItem, cancelReason === reason && styles.reasonItemActive]}
                                    onPress={() => setCancelReason(reason)}
                                >
                                    <View style={styles.reasonRadio}>
                                        {cancelReason === reason && <View style={styles.reasonRadioInner} />}
                                    </View>
                                    <Text style={[styles.reasonText, cancelReason === reason && styles.reasonTextActive]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </RNScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelConfirmBtn}
                                onPress={() => handleCancelRide(cancelReason)}
                                disabled={!cancelReason}
                            >
                                <Text style={styles.cancelConfirmText}>Confirm Cancellation</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalDismissBtn}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <Text style={styles.modalDismissText}>Keep Booking</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const premiumTrackingMapStyle = [
    { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c9b96" }] },
    { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#000000" }, { "lightness": 16 }] },
    { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }, { "lightness": 20 }] },
    { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 }] },
    { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 20 }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 21 }] },
    { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }, { "lightness": 17 }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 29 }, { "weight": 0.2 }] },
    { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 18 }] },
    { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 16 }] },
    { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 19 }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    map: { flex: 1 },
    miniTechMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.indigo,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small
    },
    homeMarker: { alignItems: 'center' },
    homeMarkerInner: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.indigo,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        ...SHADOWS.medium
    },
    homeMarkerBeard: {
        width: 2,
        height: 10,
        backgroundColor: '#fff',
    },
    topOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 40,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        ...SHADOWS.medium,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12
    },
    statusTopText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.slate,
        flex: 1
    },
    floatingControls: {
        position: 'absolute',
        top: 130,
        right: 20,
        gap: 12
    },
    controlBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small
    },
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 12, // Reduced for handle
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        ...SHADOWS.heavy,
        zIndex: 100,
        minHeight: 450,
    },
    sheetHeader: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dragIndicator: {
        width: 44,
        height: 5,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    jobLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        marginBottom: 4
    },
    jobIdValue: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.slate
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase'
    },
    expertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 20
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: COLORS.indigo,
        justifyContent: 'center',
        alignItems: 'center'
    },
    expertInfo: {
        flex: 1,
        marginLeft: 16
    },
    expertName: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.slate,
        marginBottom: 6
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.slate,
        marginLeft: 4
    },
    ratingTotal: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginLeft: 6
    },
    actionCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.slate,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small
    },
    otpSection: {
        marginBottom: 24
    },
    otpBox: {
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    otpBoxLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 2,
        marginBottom: 8
    },
    otpBoxValue: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.slate,
        letterSpacing: 10
    },
    otpHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 18
    },
    footerInfo: {
        gap: 16
    },
    paymentSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    paymentIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    paymentTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 2
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.slate
    },
    locationSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 4
    },
    locationSummaryText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
        flex: 1
    },
    doneFullBtn: {
        marginTop: 24,
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.medium
    },
    doneFullGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    doneFullText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800'
    },
    payNowBtn: {
        marginTop: 12,
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.medium
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end'
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.slate,
        textAlign: 'center',
        marginBottom: 24
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#f1f5f9'
    },
    methodItemActive: {
        backgroundColor: COLORS.indigo,
        borderColor: COLORS.indigo,
        ...SHADOWS.medium
    },
    methodIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    cancelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: '#fee2e2'
    },
    cancelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ef4444',
        marginLeft: 6
    },
    paymentLocked: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0'
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dcfce7'
    },
    paidBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#22c55e',
        marginLeft: 4
    },
    modalSubTitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 20
    },
    reasonsList: {
        maxHeight: 300,
        marginBottom: 20
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    reasonItemActive: {
        borderColor: COLORS.indigo,
        backgroundColor: '#eef2ff'
    },
    reasonRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    reasonRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.indigo
    },
    reasonText: {
        fontSize: 14,
        color: COLORS.slate,
        fontWeight: '600'
    },
    reasonTextActive: {
        color: COLORS.indigo,
        fontWeight: '700'
    },
    modalFooter: {
        gap: 12
    },
    cancelConfirmBtn: {
        height: 56,
        backgroundColor: '#ef4444',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small
    },
    cancelConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800'
    },
    modalDismissBtn: {
        height: 56,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalDismissText: {
        color: COLORS.slate,
        fontSize: 15,
        fontWeight: '700'
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
