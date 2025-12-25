import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import driverLocationService from '../../services/driverLocationService';
import driverSocketService from '../../services/driverSocketService';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';
import { Modal, TextInput, Alert, ActivityIndicator } from 'react-native';


export default function TechnicianNavigationScreen({ route, navigation }) {
    const { rideId, destination } = route.params;
    const mapRef = useRef(null);

    const [currentLocation, setCurrentLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [rideStatus, setRideStatus] = useState('ACCEPTED');
    const [otp, setOtp] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpType, setOtpType] = useState('ENTRANCE'); // ENTRANCE or COMPLETION

    const watchSubscriptionRef = useRef(null);
    const lastSentLocationRef = useRef(null);
    const hasInitialFitRef = useRef(false); // Prevent multiple fits

    useEffect(() => {
        if (!rideId) return;

        console.log('🚗 Technician Navigation - Ride:', rideId);
        connectSocket();
        startTracking();
        fetchRoute();
        fetchRideStatus();

        return () => {
            stopTracking();
            console.log('Keeping socket alive');
        };
    }, [rideId]);

    const connectSocket = () => {
        driverSocketService.connect(rideId, (status) => {
            if (status === 'connected') {
                setTimeout(() => {
                    const socket = driverSocketService.getSocket();
                    if (socket?.connected) {
                        socket.emit('driver:join', { rideId });
                        console.log('✅ Driver joined ride room');
                    }
                }, 500);
            }
        });
    };

    const fetchRoute = async () => {
        try {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const orig = `${pos.coords.latitude},${pos.coords.longitude}`;
            const dest = `${destination.lat || destination.latitude},${destination.lng || destination.longitude}`;

            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${orig}&destination=${dest}&mode=driving&key=${config.GOOGLE_MAPS_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes?.[0]?.legs?.[0]) {
                const leg = data.routes[0].legs[0];
                setDistance(leg.distance.value / 1000);
                setDuration(leg.duration.value / 60);
                console.log('📍 Route:', leg.distance.text, '-', leg.duration.text);
            }
        } catch (error) {
            console.error('Route error:', error);
        }
    };

    const startTracking = async () => {
        try {
            console.log('🚀 Using driverLocationService...');
            await driverLocationService.startTracking(handleLocationUpdate);
            await driverLocationService.startBackgroundTracking().catch(() => console.warn('BG tracking unavailable'));
            setIsNavigating(true);
            console.log('✅ Location service active!');
        } catch (error) {
            console.error('❌ Tracking error:', error.message);
            alert('GPS Error: ' + error.message);
        }
    };

    const stopTracking = async () => {
        await driverLocationService.stopTracking();
    };

    const handleLocationUpdate = (locationData) => {
        const newLoc = { latitude: locationData.lat, longitude: locationData.lng };
        console.log('💚 [UPDATE]:', locationData.lat.toFixed(6), locationData.lng.toFixed(6), 'Speed:', (locationData.speed * 3.6).toFixed(1), 'km/h');

        setCurrentLocation(newLoc);
        setHeading(locationData.bearing);
        setSpeed(locationData.speed);

        driverSocketService.sendLocation(locationData);

        mapRef.current?.animateCamera({
            center: newLoc,
            heading: locationData.bearing,
            pitch: 60,
            zoom: 18,
        }, { duration: 1000 });
    };
    const fetchRideStatus = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/${rideId}`);
            const result = await response.json();
            if (result.success) setRideStatus(result.data.status);
        } catch (e) { console.error(e); }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) return;
        setLoading(true);
        try {
            const endpoint = otpType === 'ENTRANCE' ? 'verify-arrival' : 'complete';
            const response = await fetch(`${config.BACKEND_URL}/api/ride/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId, otp })
            });
            const result = await response.json();

            if (result.success) {
                setShowOtpModal(false);
                setOtp('');
                if (otpType === 'ENTRANCE') {
                    setRideStatus('ARRIVED');
                    Alert.alert('Success', 'Entrance verified! You can now start the service.');
                } else {
                    setRideStatus('COMPLETED');
                    Alert.alert('Success', 'Job completed successfully!');
                    navigation.navigate('TechnicianDashboard');
                }

            } else {
                Alert.alert('Error', result.error || 'Invalid OTP');
            }
        } catch (e) {
            Alert.alert('Error', 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStartService = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/start-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId })
            });
            if ((await response.json()).success) setRideStatus('IN_PROGRESS');
        } catch (e) { Alert.alert('Error', 'Could not start service'); }
    };

    const handleEndService = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/ride/end-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId })
            });
            const result = await response.json();
            if (result.success) {
                setOtpType('COMPLETION');
                setShowOtpModal(true);
            }
        } catch (e) { Alert.alert('Error', 'Could not end service'); }
    };

    const formatSpeed = (mps) => Math.round((mps || 0) * 3.6);
    const formatDistance = (km) => !km ? '--' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    const formatDuration = (mins) => !mins ? '--' : mins >= 60 ? `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m` : `${Math.round(mins)} min`;


    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                showsUserLocation={false}
                initialRegion={{
                    latitude: currentLocation?.latitude || 20.2961,
                    longitude: currentLocation?.longitude || 85.8245,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {currentLocation && (
                    <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={[styles.carMarker, { transform: [{ rotate: `${heading}deg` }] }]}>
                            <Ionicons name="navigate" size={32} color={COLORS.technicianPrimary} />
                        </View>
                    </Marker>
                )}
                {destination && (
                    <Marker coordinate={{ latitude: destination.lat || destination.latitude, longitude: destination.lng || destination.longitude }}>
                        <View style={styles.destMarker}>
                            <Ionicons name="location" size={28} color={COLORS.error} />
                        </View>
                    </Marker>
                )}
                {/* Route Path - Like Google Maps */}
                {currentLocation && destination && rideStatus === 'ACCEPTED' && (
                    <MapViewDirections
                        key={rideId}
                        origin={currentLocation}
                        destination={{
                            latitude: destination.lat || destination.latitude,
                            longitude: destination.lng || destination.longitude
                        }}
                        apikey={config.GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor={COLORS.technicianPrimary}
                        precision="high"
                        mode="DRIVING"
                        onReady={(result) => {
                            console.log("🗺️ Route ready");
                            if (!hasInitialFitRef.current && mapRef.current) {
                                hasInitialFitRef.current = true;
                                mapRef.current.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                                    animated: true
                                });
                            }
                        }}
                        onError={(error) => console.error("Route error:", error)}
                    />
                )}
            </MapView>

            <View style={styles.speedContainer}>
                <Text style={styles.speedValue}>{formatSpeed(speed)}</Text>
                <Text style={styles.speedLabel}>km/h</Text>
            </View>

            <View style={styles.etaCard}>
                <View style={styles.etaRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.technicianPrimary} />
                    <Text style={styles.etaValue}>{formatDuration(duration)}</Text>
                </View>
                <Text style={styles.etaLabel}>{formatDistance(distance)}</Text>
            </View>

            <View style={styles.bottomSheet}>
                {rideStatus === 'ACCEPTED' && (
                    <TouchableOpacity
                        style={[styles.btn, styles.primaryBtn]}
                        onPress={() => {
                            setOtpType('ENTRANCE');
                            setShowOtpModal(true);
                        }}
                    >
                        <Ionicons name="home" size={20} color={COLORS.white} />
                        <Text style={styles.btnText}>I'VE ARRIVED</Text>
                    </TouchableOpacity>
                )}

                {rideStatus === 'ARRIVED' && (
                    <TouchableOpacity style={[styles.btn, styles.successBtn]} onPress={handleStartService}>
                        <Ionicons name="play" size={20} color={COLORS.white} />
                        <Text style={styles.btnText}>START SERVICE</Text>
                    </TouchableOpacity>
                )}

                {rideStatus === 'IN_PROGRESS' && (
                    <TouchableOpacity style={[styles.btn, styles.endServiceBtn]} onPress={handleEndService}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                        <Text style={styles.btnText}>END SERVICE</Text>
                    </TouchableOpacity>
                )}

                {rideStatus === 'COMPLETED' && (
                    <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => navigation.navigate('TechnicianDashboard')}>
                        <Text style={styles.btnText}>BACK TO DASHBOARD</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.recenterBtn} onPress={() => mapRef.current?.animateCamera({ center: currentLocation, heading, pitch: 60, zoom: 18 })}>
                    <Ionicons name="locate" size={24} color={COLORS.technicianPrimary} />
                </TouchableOpacity>
            </View>

            {/* OTP Verification Modal */}
            <Modal visible={showOtpModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{otpType === 'ENTRANCE' ? 'Entrance Verification' : 'Job Completion'}</Text>
                        <Text style={styles.modalSub}>{otpType === 'ENTRANCE' ? 'Enter 4-digit code provided by customer' : 'Enter 5-digit completion code'}</Text>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="XXXXX"
                            keyboardType="number-pad"
                            maxLength={otpType === 'ENTRANCE' ? 4 : 5}
                            value={otp}
                            onChangeText={setOtp}
                        />

                        <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.verifyBtnText}>VERIFY CODE</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowOtpModal(false)}>
                            <Text style={styles.cancelBtnText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.black },
    map: { flex: 1 },
    carMarker: { width: 48, height: 48, backgroundColor: COLORS.white, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...SHADOWS.large, borderWidth: 3, borderColor: COLORS.technicianPrimary },
    destMarker: { backgroundColor: COLORS.white, padding: 8, borderRadius: 20, ...SHADOWS.medium },
    speedContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md, alignItems: 'center', minWidth: 80, ...SHADOWS.medium },
    speedValue: { fontSize: 32, fontWeight: '900', color: COLORS.technicianPrimary },
    speedLabel: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    etaCard: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md, ...SHADOWS.medium },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    etaValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.technicianPrimary },
    etaLabel: { fontSize: 12, color: COLORS.grey },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: SPACING.xl,
        flexDirection: 'row',
        gap: SPACING.md,
        ...SHADOWS.large,
    },
    btn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.medium,
    },
    primaryBtn: { backgroundColor: COLORS.technicianPrimary },
    successBtn: { backgroundColor: '#2E7D32' }, // Dark green
    endServiceBtn: { backgroundColor: COLORS.error },
    btnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
    recenterBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.technicianBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.technicianAccent,
    },

    // Modal Styles
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 14,
        color: COLORS.grey,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    otpInput: {
        width: '100%',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 10,
        marginBottom: SPACING.xl,
        color: COLORS.technicianPrimary,
    },
    verifyBtn: {
        backgroundColor: COLORS.technicianPrimary,
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    verifyBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelBtn: {
        marginTop: SPACING.md,
        padding: SPACING.md,
    },
    cancelBtnText: {
        color: COLORS.grey,
        fontSize: 14,
        fontWeight: '600',
    },

});