import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedMarker from '../components/AnimatedMarker';
import customerSocketService from '../services/customerSocketService';
import pollingService from '../services/pollingService';
import useLocationStore from '../store/useLocationStore';
import { getCameraRegion, isGPSNoise } from '../utils/mapUtils';
import config from '../constants/config';

const { width } = Dimensions.get('window');

export default function CustomerScreen({ route }) {
    const { rideId } = route.params;

    const mapRef = useRef(null);
    const {
        destinationLocation,
        rideStatus,
        setRideStatus,
        pickupLocation
    } = useLocationStore();

    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [statusMessage, setStatusMessage] = useState('Locating driver...');
    const [isCameraFollowing, setIsCameraFollowing] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [bearing, setBearing] = useState(0);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        customerSocketService.connect(
            rideId,
            handleLocationUpdate,
            handleConnectionChange
        );

        return () => {
            customerSocketService.disconnect();
            pollingService.stop();
        };
    }, [rideId]);

    useEffect(() => {
        const socket = customerSocketService.getSocket();
        if (socket) {
            socket.on('ride:accepted', (data) => {
                setRideStatus('ACCEPTED');
                setStatusMessage('Driver accepted your ride!');
            });
            socket.on('ride:started', () => {
                setRideStatus('STARTED');
                setStatusMessage('Your ride has started!');
            });
            socket.on('ride:completed', () => {
                setRideStatus('COMPLETED');
                setStatusMessage('Ride completed!');
            });
        }
    }, [connectionStatus]);

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

        if (currentLocation && isGPSNoise(currentLocation, newLocation, config.GPS_NOISE_THRESHOLD)) return;

        setPreviousLocation(currentLocation);
        setCurrentLocation(newLocation);
        setBearing(locationData.bearing || 0);

        if (isCameraFollowing && mapRef.current && !destinationLocation) {
            mapRef.current.animateToRegion(getCameraRegion(newLocation), 1000);
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
                onPanDrag={() => setIsCameraFollowing(false)}
            >
                {currentLocation && (
                    <AnimatedMarker
                        currentLocation={currentLocation}
                        previousLocation={previousLocation}
                        bearing={bearing}
                    />
                )}

                {destinationLocation && (
                    <Marker
                        coordinate={{ latitude: destinationLocation.lat, longitude: destinationLocation.lng }}
                        title="Destination"
                    >
                        <View style={styles.destMarker}>
                            <Ionicons name="flag" size={24} color="#F44336" />
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
                                edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }
                            });
                        }}
                    />
                )}
            </MapView>

            <View style={styles.topBar}>
                <View style={[styles.statusIndicator, { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF9800' }]} />
                <Text style={styles.statusMsg}>{statusMessage}</Text>
                {connectionStatus !== 'connected' && <ActivityIndicator size="small" color="#1976D2" style={{ marginLeft: 10 }} />}
            </View>

            <View style={styles.bottomSheet}>
                <Text style={styles.rideIdText}>Ride: {rideId}</Text>
                <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                        <Ionicons name="person" size={width * 0.07} color="#fff" />
                    </View>
                    <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>Your Driver</Text>
                        <Text style={styles.rideStatusText}>{rideStatus || 'ALLOCATING...'}</Text>
                    </View>
                    <TouchableOpacity style={styles.callBtn}>
                        <Ionicons name="call" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.destinationRow}>
                    <Ionicons name="location" size={20} color="#757575" />
                    <Text style={styles.destText} numberOfLines={1}>
                        {destinationLocation?.address || 'Set your destination'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    destMarker: { backgroundColor: '#fff', padding: 5, borderRadius: 20, elevation: 5 },
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 55 : 35,
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    statusMsg: { fontSize: 13, fontWeight: 'bold', color: '#424242' },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: width * 0.06,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    rideIdText: { fontSize: 11, color: '#999', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    driverInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1976D2', alignItems: 'center', justifyContent: 'center' },
    driverDetails: { flex: 1, marginLeft: 15 },
    driverName: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
    rideStatusText: { fontSize: 13, color: '#1976D2', fontWeight: '800' },
    callBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
    destinationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15 },
    destText: { marginLeft: 10, color: '#666', fontSize: 13, flex: 1 },
});


