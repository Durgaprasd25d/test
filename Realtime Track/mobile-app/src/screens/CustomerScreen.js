/**
 * Customer Screen
 * 
 * Customer interface for tracking driver in real-time
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AnimatedMarker from '../components/AnimatedMarker';
import customerSocketService from '../services/customerSocketService';
import pollingService from '../services/pollingService';
import useLocationStore from '../store/useLocationStore';
import { getCameraRegion, isGPSNoise, isValidLocationUpdate } from '../utils/mapUtils';
import config from '../constants/config';

export default function CustomerScreen({ route }) {
    const { rideId } = route.params || { rideId: 'ride123' }; // Default for testing

    const mapRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [statusMessage, setStatusMessage] = useState('Connecting...');
    const [isCameraFollowing, setIsCameraFollowing] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [previousLocation, setPreviousLocation] = useState(null);
    const [bearing, setBearing] = useState(0);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        // Connect to socket
        customerSocketService.connect(
            rideId,
            handleLocationUpdate,
            handleConnectionChange
        );

        return () => {
            // Cleanup
            customerSocketService.disconnect();
            pollingService.stop();
        };
    }, [rideId]);

    const handleConnectionChange = (status) => {
        setConnectionStatus(status);

        if (status === 'connected') {
            setStatusMessage('Tracking driver');
            // Stop polling if it was active
            if (isPolling) {
                pollingService.stop();
                setIsPolling(false);
            }
        } else if (status === 'reconnecting') {
            setStatusMessage('Reconnecting...');
        } else if (status === 'disconnected' || status === 'error') {
            setStatusMessage('Connection lost. Using fallback...');
            // Start polling fallback
            if (!isPolling) {
                pollingService.start(rideId, handleLocationUpdate);
                setIsPolling(true);
            }
        }
    };

    const handleLocationUpdate = (locationData) => {
        if (!locationData || !locationData.lat || !locationData.lng) {
            console.warn('Invalid location data received');
            return;
        }

        const newLocation = {
            latitude: locationData.lat,
            longitude: locationData.lng,
            timestamp: locationData.timestamp || Date.now(),
        };

        // Filter GPS noise
        if (currentLocation && isGPSNoise(currentLocation, newLocation, config.GPS_NOISE_THRESHOLD)) {
            console.log('GPS noise filtered');
            return;
        }

        // Validate update (check for unrealistic speeds)
        if (currentLocation && !isValidLocationUpdate(currentLocation, newLocation, config.MAX_SPEED_THRESHOLD)) {
            console.warn('Invalid location update: unrealistic speed');
            return;
        }

        // Update locations
        setPreviousLocation(currentLocation);
        setCurrentLocation(newLocation);
        setBearing(locationData.bearing || 0);

        // Update status
        setStatusMessage('Driver is on the way');

        // Animate camera if following is enabled
        if (isCameraFollowing && mapRef.current) {
            const region = getCameraRegion(newLocation, config.DEFAULT_ZOOM_LEVEL);
            mapRef.current.animateToRegion(region, config.CAMERA_ANIMATION_DURATION);
        }
    };

    const toggleCameraFollow = () => {
        setIsCameraFollowing(!isCameraFollowing);
    };

    const centerCamera = () => {
        if (currentLocation && mapRef.current) {
            const region = getCameraRegion(currentLocation, config.DEFAULT_ZOOM_LEVEL);
            mapRef.current.animateToRegion(region, config.CAMERA_ANIMATION_DURATION);
            setIsCameraFollowing(true);
        }
    };

    const getStatusColor = () => {
        if (statusMessage.includes('on the way')) return '#4CAF50';
        if (statusMessage.includes('Connecting') || statusMessage.includes('Reconnecting')) return '#FF9800';
        if (statusMessage.includes('Waiting')) return '#757575';
        return '#F44336';
    };

    const initialRegion = currentLocation
        ? getCameraRegion(currentLocation, config.DEFAULT_ZOOM_LEVEL)
        : {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                rotateEnabled={true}
                pitchEnabled={false}
                scrollEnabled={!isCameraFollowing}
                zoomEnabled={true}
                onPanDrag={() => {
                    // User manually panned the map
                    if (isCameraFollowing) {
                        setIsCameraFollowing(false);
                    }
                }}
            >
                {currentLocation && (
                    <AnimatedMarker
                        currentLocation={currentLocation}
                        previousLocation={previousLocation}
                        bearing={bearing}
                    />
                )}
            </MapView>

            {/* Status Bar */}
            <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
                <Ionicons
                    name={statusMessage.includes('on the way') ? 'car' : 'time'}
                    size={20}
                    color="#fff"
                />
                <Text style={styles.statusText}>{statusMessage}</Text>
                {(connectionStatus === 'connecting' || connectionStatus === 'reconnecting') && (
                    <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
                )}
            </View>

            {/* Camera Control */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        isCameraFollowing && styles.controlButtonActive,
                    ]}
                    onPress={toggleCameraFollow}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isCameraFollowing ? 'navigate' : 'navigate-outline'}
                        size={24}
                        color={isCameraFollowing ? '#1976D2' : '#757575'}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={centerCamera}
                    activeOpacity={0.8}
                >
                    <Ionicons name="locate" size={24} color="#757575" />
                </TouchableOpacity>
            </View>

            {/* Connection Indicator */}
            {isPolling && (
                <View style={styles.pollingIndicator}>
                    <Ionicons name="wifi-outline" size={16} color="#FF9800" />
                    <Text style={styles.pollingText}>Polling mode</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    statusBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 12,
        flex: 1,
    },
    controls: {
        position: 'absolute',
        right: 16,
        bottom: 100,
    },
    controlButton: {
        backgroundColor: '#fff',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    controlButtonActive: {
        backgroundColor: '#E3F2FD',
    },
    pollingIndicator: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    pollingText: {
        fontSize: 12,
        color: '#FF9800',
        marginLeft: 6,
        fontWeight: '600',
    },
});
