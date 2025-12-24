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
import driverLocationService from '../services/driverLocationService';
import driverSocketService from '../services/driverSocketService';
import rideService from '../services/rideService';
import useLocationStore from '../store/useLocationStore';
import { formatSpeed, getCameraRegion } from '../utils/mapUtils';
import config from '../constants/config';
import CustomAnimatedMarker from '../components/AnimatedMarker';

const { width } = Dimensions.get('window');

export default function DriverScreen({ route, navigation }) {
    const { rideId } = route.params;
    const mapRef = useRef(null);

    const {
        setLocation,
        currentLocation,
        previousLocation,
        rideStatus,
        setRideStatus,
        pickupLocation,
        destinationLocation,
        driverId,
        reset
    } = useLocationStore();

    const [loading, setLoading] = useState(false);
    const [bearing, setBearing] = useState(0);

    useEffect(() => {
        // Connect to socket when component mounts
        driverSocketService.connect(rideId, (status) => {
            console.log(`Driver socket status: ${status}`);
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

    const handleStartRide = async () => {
        setLoading(true);
        const result = await rideService.startRide(rideId, driverId);
        setLoading(false);

        if (result.success) {
            setRideStatus('STARTED');
        } else {
            Alert.alert('Error', result.error || 'Failed to start ride');
        }
    };

    const handleCompleteRide = async () => {
        setLoading(true);
        const result = await rideService.completeRide(rideId, driverId);
        setLoading(false);

        if (result.success) {
            setRideStatus('COMPLETED');
            Alert.alert('Success', 'Ride completed successfully!', [
                {
                    text: 'OK', onPress: () => {
                        reset();
                        navigation.navigate('Home');
                    }
                }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to complete ride');
        }
    };

    const routeDest = rideStatus === 'ACCEPTED' ? pickupLocation : destinationLocation;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={currentLocation ? getCameraRegion(currentLocation) : {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {currentLocation && (
                    <CustomAnimatedMarker
                        currentLocation={currentLocation}
                        previousLocation={previousLocation}
                        bearing={bearing}
                    />
                )}

                {routeDest && (
                    <Marker
                        coordinate={{ latitude: routeDest.lat, longitude: routeDest.lng }}
                        title={rideStatus === 'ACCEPTED' ? 'Pickup' : 'Destination'}
                    >
                        <View style={styles.destMarker}>
                            <Ionicons
                                name={rideStatus === 'ACCEPTED' ? "pin" : "flag"}
                                size={24}
                                color={rideStatus === 'ACCEPTED' ? "#4CAF50" : "#F44336"}
                            />
                        </View>
                    </Marker>
                )}

                {currentLocation && routeDest && (
                    <MapViewDirections
                        origin={currentLocation}
                        destination={{ latitude: routeDest.lat, longitude: routeDest.lng }}
                        apikey={config.GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor="#1976D2"
                        onReady={(result) => {
                            mapRef.current.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 50, right: 50, bottom: 250, left: 50 }
                            });
                        }}
                    />
                )}
            </MapView>

            <View style={styles.bottomCard}>
                <View style={styles.infoRow}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{rideStatus}</Text>
                    </View>
                    <Text style={styles.speedText}>{formatSpeed(currentLocation?.speed || 0)}</Text>
                </View>

                <View style={styles.addressContainer}>
                    <Ionicons name="location" size={20} color="#757575" />
                    <Text style={styles.addressText} numberOfLines={2}>
                        {routeDest?.address || 'Loading address...'}
                    </Text>
                </View>

                {rideStatus === 'ACCEPTED' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.startBtn]}
                        onPress={handleStartRide}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>START RIDE</Text>}
                    </TouchableOpacity>
                )}

                {rideStatus === 'STARTED' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.completeBtn]}
                        onPress={handleCompleteRide}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>COMPLETE RIDE</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    destMarker: {
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: width * 0.05,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    statusBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { color: '#1976D2', fontWeight: 'bold', fontSize: 12 },
    speedText: { fontSize: 18, fontWeight: 'bold', color: '#424242' },
    addressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 20 },
    addressText: { flex: 1, marginLeft: 10, color: '#616161', fontSize: 14 },
    actionBtn: { height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    startBtn: { backgroundColor: '#1976D2' },
    completeBtn: { backgroundColor: '#4CAF50' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});


