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

export default function TechnicianNavigationScreen({ route, navigation }) {
    const { rideId, destination } = route.params;
    const mapRef = useRef(null);

    const [currentLocation, setCurrentLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const watchSubscriptionRef = useRef(null);
    const lastSentLocationRef = useRef(null);
    const hasInitialFitRef = useRef(false); // Prevent multiple fits

    useEffect(() => {
        if (!rideId) return;

        console.log('🚗 Technician Navigation - Ride:', rideId);
        connectSocket();
        startTracking();
        fetchRoute();

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
                {currentLocation && destination && (
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
                <TouchableOpacity style={styles.actionBtn} onPress={() => mapRef.current?.animateCamera({ center: currentLocation, heading, pitch: 60, zoom: 18 })}>
                    <Ionicons name="locate" size={24} color={COLORS.technicianPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.endBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="stop-circle" size={20} color={COLORS.white} />
                    <Text style={styles.endBtnText}>End Navigation</Text>
                </TouchableOpacity>
            </View>
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
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING.xl, flexDirection: 'row', gap: SPACING.md, ...SHADOWS.large },
    actionBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.technicianBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.technicianAccent },
    endBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: COLORS.error, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOWS.medium },
    endBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});