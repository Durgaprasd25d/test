/**
 * Animated Marker Component
 * 
 * Smooth marker animation with bearing rotation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Marker, AnimatedRegion } from 'react-native-maps';
import { View, StyleSheet, Platform } from 'react-native';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import config from '../constants/config';

// Create animated Marker component
const AnimatedMarkerComponent = Animated.createAnimatedComponent(Marker);

export default function CustomAnimatedMarker({
    currentLocation,
    previousLocation,
    bearing
}) {
    // Use AnimatedRegion for smooth coordinate transitions
    const [animatedRegion] = useState(new AnimatedRegion({
        latitude: currentLocation?.latitude || 0,
        longitude: currentLocation?.longitude || 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
    }));

    // Use regular Animated.Value for rotation
    const animatedBearing = useRef(new Animated.Value(bearing || 0)).current;

    useEffect(() => {
        if (!currentLocation) return;

        const newCoord = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
        };

        if (Platform.OS === 'android') {
            // Android specific: marker.timing works well with AnimatedRegion
            animatedRegion.timing({
                ...newCoord,
                duration: config.MARKER_ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();
        } else {
            // iOS specific: spring or timing
            animatedRegion.timing({
                ...newCoord,
                duration: config.MARKER_ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();
        }

        // Calculate shortest path for bearing rotation
        let currentBearingValue = 0;
        try {
            // Use __getValue() only for calculating the delta
            currentBearingValue = animatedBearing.__getValue();
        } catch (e) {
            currentBearingValue = 0;
        }

        // Ensure we take the shortest path (e.g., from 350 to 10 is +20, not -340)
        let diff = (bearing || 0) - (currentBearingValue % 360);
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;
        const targetBearing = currentBearingValue + diff;

        // Animate bearing rotation smoothly with shortest path
        Animated.timing(animatedBearing, {
            toValue: targetBearing,
            duration: config.MARKER_ANIMATION_DURATION,
            useNativeDriver: false,
        }).start();

    }, [currentLocation?.latitude, currentLocation?.longitude, bearing]);

    if (!currentLocation) return null;

    return (
        <AnimatedMarkerComponent
            coordinate={animatedRegion}
            rotation={animatedBearing}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            zIndex={1000}
        >
            <View style={styles.markerContainer}>
                <Ionicons name="car" size={30} color="#1976D2" />
            </View>
        </AnimatedMarkerComponent>
    );
}

const styles = StyleSheet.create({
    markerContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
});
