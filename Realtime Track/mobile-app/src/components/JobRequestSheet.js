import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
    Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.55;
const MINIMIZED_SIZE = 64;

export default function JobRequestSheet({ visible, jobData, onAccept, onReject }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [distance, setDistance] = useState(null);

    // Animation transitions
    const translateY = useRef(new Animated.Value(height)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;
    const iconTranslateX = useRef(new Animated.Value(100)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && jobData) {
            calculateDistance();
            showSheet();
        } else {
            hideAll();
        }
    }, [visible, jobData]);

    const calculateDistance = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const destLat = jobData.pickup?.lat || jobData.pickup?.latitude;
            const destLng = jobData.pickup?.lng || jobData.pickup?.longitude;

            if (latitude && longitude && destLat && destLng) {
                // Haversine formula for distance
                const R = 6371; // km
                const dLat = (destLat - latitude) * Math.PI / 180;
                const dLon = (destLng - longitude) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(latitude * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;
                setDistance(d.toFixed(1));
            }
        } catch (error) {
            console.warn('Distance calc error:', error);
        }
    };

    const showSheet = () => {
        setIsMinimized(false);
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(iconOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    };

    const minimize = () => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: height,
                useNativeDriver: true,
                friction: 8,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            // Icon animation
            Animated.spring(iconTranslateX, {
                toValue: 0,
                useNativeDriver: true,
            }),
            Animated.timing(iconOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => setIsMinimized(true));
    };

    const expand = () => {
        setIsMinimized(false);
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // Hide Icon
            Animated.timing(iconOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(iconTranslateX, {
                toValue: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const hideAll = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(iconOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsMinimized(false);
        });
    };

    if (!jobData || !visible) return null;

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            {/* Minimized Icon */}
            <Animated.View
                style={[
                    styles.floatingIconContainer,
                    {
                        opacity: iconOpacity,
                        transform: [{ translateX: iconTranslateX }]
                    }
                ]}
                pointerEvents={isMinimized ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={styles.floatingIcon}
                    onPress={expand}
                    activeOpacity={0.8}
                >
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>1</Text>
                    </View>
                    <Ionicons name="notifications" size={32} color={COLORS.white} />
                </TouchableOpacity>
            </Animated.View>

            {/* Bottom Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    {
                        opacity: opacity,
                        transform: [{ translateY }]
                    }
                ]}
                pointerEvents={!isMinimized ? 'auto' : 'none'}
            >
                {/* Handle Bar */}
                <TouchableOpacity style={styles.handleContainer} onPress={minimize}>
                    <View style={styles.handle} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="flash" size={24} color={COLORS.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>New Service Request</Text>
                        <Text style={styles.headerSubtitle}>Incoming job nearby</Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>SERVICE</Text>
                            <Text style={styles.infoValue}>{jobData.serviceType || 'AC Service'}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>EST. EARNING</Text>
                            <Text style={[styles.infoValue, { color: '#2E7D32' }]}>₹{jobData.price || '850'}</Text>
                        </View>
                    </View>

                    <View style={styles.addressBox}>
                        <Ionicons name="location" size={20} color={COLORS.technicianPrimary} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {jobData.pickup?.address || 'Pickup location details'}
                        </Text>
                    </View>

                    <View style={styles.distanceBox}>
                        <Ionicons name="navigate-circle-outline" size={16} color={COLORS.grey} />
                        <Text style={styles.distanceText}>
                            {distance ? `${distance} km` : 'Calculating...'} away from you
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn]}
                        onPress={onReject}
                    >
                        <Text style={styles.rejectBtnText}>IGNORE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.acceptBtn]}
                        onPress={onAccept}
                    >
                        <Text style={styles.acceptBtnText}>ACCEPT JOB</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    sheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: SPACING.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        ...SHADOWS.heavy,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: COLORS.greyLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: SPACING.lg,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.technicianPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.grey,
    },
    content: {
        backgroundColor: COLORS.technicianBg,
        borderRadius: 24,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.technicianAccent,
        marginBottom: SPACING.xl,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    infoBox: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.grey,
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.black,
        fontWeight: '500',
    },
    distanceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 4,
    },
    distanceText: {
        fontSize: 12,
        color: COLORS.grey,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    rejectBtn: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
    },
    acceptBtn: {
        flex: 2,
        backgroundColor: COLORS.technicianPrimary,
        ...SHADOWS.medium,
    },
    rejectBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.grey,
    },
    acceptBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    floatingIconContainer: {
        position: 'absolute',
        top: 150, // Slightly lower
        right: 20,
        zIndex: 2000,
        elevation: 11,
    },
    floatingIcon: {
        width: MINIMIZED_SIZE,
        height: MINIMIZED_SIZE,
        borderRadius: MINIMIZED_SIZE / 2,
        backgroundColor: COLORS.technicianPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.heavy,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.error,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});
