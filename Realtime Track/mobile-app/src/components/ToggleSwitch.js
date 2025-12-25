import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function ToggleSwitch({ value, onValueChange, label }) {
    const translateX = React.useRef(new Animated.Value(value ? 22 : 2)).current;

    React.useEffect(() => {
        Animated.spring(translateX, {
            toValue: value ? 22 : 2,
            friction: 6,
            useNativeDriver: true,
        }).start();
    }, [value]);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[styles.track, value && styles.trackActive]}
                onPress={() => onValueChange(!value)}
                activeOpacity={0.8}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        value && styles.thumbActive,
                        { transform: [{ translateX }] }
                    ]}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.black },
    track: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.greyMedium,
        justifyContent: 'center',
        padding: 2,
    },
    trackActive: { backgroundColor: COLORS.technicianPrimary },
    thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    thumbActive: {
        backgroundColor: COLORS.white,
    },
});
