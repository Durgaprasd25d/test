import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

export default function ChecklistItem({ label, completed, onPress }) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, completed && styles.checkboxActive]}>
                {completed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <Text style={[styles.label, completed && styles.labelCompleted]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.greyMedium,
        marginRight: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.technicianPrimary,
        borderColor: COLORS.technicianPrimary,
    },
    label: {
        fontSize: 14,
        color: COLORS.black,
        fontWeight: '500',
    },
    labelCompleted: {
        color: COLORS.grey,
        textDecorationLine: 'line-through',
    },
});
