import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import driverLocationService from '../../services/driverLocationService';
import driverSocketService from '../../services/driverSocketService';
import rideService from '../../services/rideService';
import useLocationStore from '../../store/useLocationStore';
import { formatSpeed, getCameraRegion } from '../../utils/mapUtils';
import config from '../../constants/config';
import CustomAnimatedMarker from '../../components/AnimatedMarker';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function TechnicianScreen({ route, navigation }) {
    const { rideId } = route?.params || {};
    const mapRef = useRef(null);

    const {
        setLocation,
        currentLocation,
        previousLocation,
        rideStatus,
        setRideStatus,
        pickupLocation,
        driverId,
        reset
    } = useLocationStore();

    const [loading, setLoading] = useState(false);
    const [bearing, setBearing] = useState(0);

    useEffect(() => {
        // Connect to socket when component mounts
        driverSocketService.connect(rideId, (status) => {
            console.log(`Technician socket status: ${status}`);
        });

        startTracking();

        return () => {
            stopTracking();
            driverSocketService.disconnect();
        };
    }, [rideId]);

    const handleLocationUpdate = (locationData) => {
        setLocation({
            latitude: locationData.lat,
            longitude: locationData.lng,
            timestamp: locationData.timestamp,
        });
        setBearing(locationData.bearing);

        // Send to server via WebSocket
        driverSocketService.sendLocation(locationData);

        // Animate camera
        if (mapRef.current) {
            mapRef.current.animateToRegion(
                getCameraRegion({
                    latitude: locationData.lat,
                    longitude: locationData.lng
                }, config.DEFAULT_ZOOM_LEVEL),
                1000
            );
        }
    };

    const startTracking = async () => {
        try {
            await driverLocationService.startTracking(handleLocationUpdate);
            await driverLocationService.startBackgroundTracking();
        } catch (error) {
            Alert.alert('Error', 'Failed to start location tracking');
        }
    };

    const stopTracking = async () => {
        await driverLocationService.stopTracking();
    };

    const handleStartJob = async () => {
        setLoading(true);
        const result = await rideService.startRide(rideId, driverId);
        setLoading(false);

        if (result.success) {
            setRideStatus('STARTED');
        } else {
            Alert.alert('Error', result.error || 'Failed to start job');
        }
    };

    const handleCompleteJob = async () => {
        setLoading(true);
        const result = await rideService.completeRide(rideId, driverId);
        setLoading(false);

        if (result.success) {
            setRideStatus('COMPLETED');
            Alert.alert('Job Finished', 'The AC job has been completed!', [
                {
                    text: 'DONE', onPress: () => {
                        reset();
                        navigation.navigate('Home');
                    }
                }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to complete job');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header Overlay */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>ACTIVE JOB</Text>
                <Text style={styles.jobId}>#{rideId?.substring(0, 8)}</Text>
            </View>

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={currentLocation ? getCameraRegion(currentLocation) : {
                    latitude: 20.2961,
                    longitude: 85.8245,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                customMapStyle={technicianMapStyle}
            >
                {currentLocation && (
                    <CustomAnimatedMarker
                        currentLocation={currentLocation}
                        previousLocation={previousLocation}
                        bearing={bearing}
                    />
                )}

                {pickupLocation && (
                    <Marker
                        coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
                    >
                        <View style={styles.destMarker}>
                            <Ionicons name="location" size={24} color={COLORS.black} />
                        </View>
                    </Marker>
                )}

                {currentLocation && pickupLocation && (
                    <MapViewDirections
                        origin={currentLocation}
                        destination={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
                        apikey={config.GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor={COLORS.black}
                        onReady={(result) => {
                            mapRef.current.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 150, right: 50, bottom: 250, left: 50 }
                            });
                        }}
                    />
                )}
            </MapView>

            <View style={styles.bottomCard}>
                <View style={styles.infoRow}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{rideStatus}</Text>
                    </View>
                    <Text style={styles.speedText}>{formatSpeed(currentLocation?.speed || 0)}</Text>
                </View>

                <View style={styles.customerCard}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerLabel}>SERVICE ADDRESS</Text>
                        <Text style={styles.addressText} numberOfLines={2}>
                            {pickupLocation?.address || 'Locating target...'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.callIcon}>
                        <Ionicons name="call" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {rideStatus === 'ACCEPTED' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn]}
                        onPress={handleStartJob}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>START JOB</Text>}
                    </TouchableOpacity>
                )}

                {rideStatus === 'STARTED' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn]}
                        onPress={handleCompleteJob}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>COMPLETE JOB</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const technicianMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: 16,
        zIndex: 10,
        ...SHADOWS.medium,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.grey, letterSpacing: 1 },
    jobId: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    map: { flex: 1 },
    destMarker: {
        backgroundColor: COLORS.white,
        padding: 5,
        borderRadius: 20,
        ...SHADOWS.light,
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    bottomCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...SHADOWS.medium,
        marginTop: -32,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    statusBadge: {
        backgroundColor: COLORS.greyLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.black, marginRight: 8 },
    statusText: { color: COLORS.black, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    speedText: { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
    customerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: 20,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
    },
    customerInfo: { flex: 1 },
    customerLabel: { fontSize: 10, color: COLORS.grey, marginBottom: 4, fontWeight: 'bold' },
    addressText: { color: COLORS.black, fontSize: 15, fontWeight: '500' },
    callIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.md,
    },
    actionBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
    primaryBtn: { backgroundColor: COLORS.black },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
});



