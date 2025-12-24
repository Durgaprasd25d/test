/**
 * Driver Screen
 * 
 * Driver interface for location tracking
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import driverLocationService from '../services/driverLocationService';
import driverSocketService from '../services/driverSocketService';
import useLocationStore from '../store/useLocationStore';
import { formatSpeed } from '../utils/mapUtils';

export default function DriverScreen({ route }) {
    const { rideId } = route.params || { rideId: 'ride123' }; // Default for testing

    const [isTracking, setIsTracking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [locationCount, setLocationCount] = useState(0);

    const setLocation = useLocationStore((state) => state.setLocation);

    useEffect(() => {
        // Connect to socket when component mounts
        driverSocketService.connect(rideId, handleConnectionChange);

        return () => {
            // Cleanup
            stopTracking();
            driverSocketService.disconnect();
        };
    }, [rideId]);

    const handleConnectionChange = (status) => {
        setConnectionStatus(status);
    };

    const handleLocationUpdate = (locationData) => {
        // Update store
        setLocation({
            latitude: locationData.lat,
            longitude: locationData.lng,
            bearing: locationData.bearing,
            speed: locationData.speed,
            timestamp: locationData.timestamp,
        });

        // Update UI
        setCurrentSpeed(locationData.speed);
        setAccuracy(locationData.accuracy);
        setLocationCount((prev) => prev + 1);

        // Send to server via WebSocket
        const sent = driverSocketService.sendLocation(locationData);

        if (!sent) {
            console.warn('Failed to send location via WebSocket');
        }
    };

    const startTracking = async () => {
        try {
            // Check location services
            const isEnabled = await driverLocationService.isLocationEnabled();
            if (!isEnabled) {
                Alert.alert(
                    'Location Disabled',
                    'Please enable location services to start tracking.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Start foreground tracking
            await driverLocationService.startTracking(handleLocationUpdate);

            // Start background tracking
            await driverLocationService.startBackgroundTracking();

            setIsTracking(true);
            setLocationCount(0);

            Alert.alert('Success', 'Location tracking started');
        } catch (error) {
            console.error('Error starting tracking:', error);
            Alert.alert('Error', error.message || 'Failed to start tracking');
        }
    };

    const stopTracking = async () => {
        try {
            await driverLocationService.stopTracking();
            setIsTracking(false);
            setCurrentSpeed(0);
            setAccuracy(0);

            Alert.alert('Stopped', 'Location tracking stopped');
        } catch (error) {
            console.error('Error stopping tracking:', error);
        }
    };

    const toggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };

    const getConnectionColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return '#4CAF50';
            case 'connecting':
            case 'reconnecting':
                return '#FF9800';
            case 'disconnected':
            case 'error':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    const getConnectionText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'reconnecting':
                return 'Reconnecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Connection Error';
            default:
                return 'Unknown';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Driver Mode</Text>
                <Text style={styles.rideId}>Ride: {rideId}</Text>
            </View>

            {/* Connection Status */}
            <View style={[styles.statusCard, { borderLeftColor: getConnectionColor() }]}>
                <View style={styles.statusRow}>
                    <Ionicons
                        name={connectionStatus === 'connected' ? 'wifi' : 'wifi-outline'}
                        size={24}
                        color={getConnectionColor()}
                    />
                    <Text style={[styles.statusText, { color: getConnectionColor() }]}>
                        {getConnectionText()}
                    </Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="speedometer" size={32} color="#2196F3" />
                    <Text style={styles.statValue}>{formatSpeed(currentSpeed)}</Text>
                    <Text style={styles.statLabel}>Speed</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="locate" size={32} color="#4CAF50" />
                    <Text style={styles.statValue}>{accuracy.toFixed(0)}m</Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="navigate-circle" size={32} color="#FF9800" />
                    <Text style={styles.statValue}>{locationCount}</Text>
                    <Text style={styles.statLabel}>Updates</Text>
                </View>
            </View>

            {/* Tracking Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.trackingButton,
                        { backgroundColor: isTracking ? '#F44336' : '#4CAF50' },
                    ]}
                    onPress={toggleTracking}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isTracking ? 'stop-circle' : 'play-circle'}
                        size={32}
                        color="#fff"
                    />
                    <Text style={styles.trackingButtonText}>
                        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Info */}
            {isTracking && (
                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle" size={20} color="#2196F3" />
                    <Text style={styles.infoText}>
                        Tracking active. Your location is being shared with customers.
                    </Text>
                </View>
            )}

            {!isTracking && (
                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#757575" />
                    <Text style={styles.infoTextInactive}>
                        Press Start Tracking to begin sharing your location.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#1976D2',
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    rideId: {
        fontSize: 14,
        color: '#E3F2FD',
    },
    statusCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 16,
        marginTop: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        flex: 1,
        marginHorizontal: 6,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 4,
    },
    buttonContainer: {
        marginHorizontal: 16,
        marginTop: 40,
    },
    trackingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    trackingButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1976D2',
        marginLeft: 12,
    },
    infoTextInactive: {
        flex: 1,
        fontSize: 14,
        color: '#757575',
        marginLeft: 12,
    },
});
