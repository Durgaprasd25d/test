/**
 * Home Screen - Role Selection
 * 
 * Choose between Driver and Customer modes
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
    const [rideId, setRideId] = useState('ride123');

    const navigateToDriver = () => {
        if (!rideId.trim()) {
            alert('Please enter a Ride ID');
            return;
        }
        navigation.navigate('Driver', { rideId: rideId.trim() });
    };

    const navigateToCustomer = () => {
        if (!rideId.trim()) {
            alert('Please enter a Ride ID');
            return;
        }
        navigation.navigate('Customer', { rideId: rideId.trim() });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="car-sport" size={64} color="#fff" />
                    <Text style={styles.title}>Uber-Like Tracking</Text>
                    <Text style={styles.subtitle}>Real-Time Driver Tracking System</Text>
                </View>

                {/* Ride ID Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Ride ID</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="key" size={20} color="#757575" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Ride ID"
                            value={rideId}
                            onChangeText={setRideId}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <Text style={styles.inputHint}>
                        Both driver and customer must use the same Ride ID
                    </Text>
                </View>

                {/* Role Selection */}
                <View style={styles.rolesContainer}>
                    <Text style={styles.rolesTitle}>Select Your Role</Text>

                    <TouchableOpacity
                        style={[styles.roleCard, styles.driverCard]}
                        onPress={navigateToDriver}
                        activeOpacity={0.8}
                    >
                        <View style={styles.roleIconContainer}>
                            <Ionicons name="navigate-circle" size={48} color="#1976D2" />
                        </View>
                        <Text style={styles.roleTitle}>Driver</Text>
                        <Text style={styles.roleDescription}>
                            Share your live location with customers
                        </Text>
                        <View style={styles.roleFeatures}>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.featureText}>GPS tracking</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.featureText}>Background updates</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.featureText}>Real-time sharing</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.roleCard, styles.customerCard]}
                        onPress={navigateToCustomer}
                        activeOpacity={0.8}
                    >
                        <View style={styles.roleIconContainer}>
                            <Ionicons name="location" size={48} color="#4CAF50" />
                        </View>
                        <Text style={styles.roleTitle}>Customer</Text>
                        <Text style={styles.roleDescription}>
                            Track your driver in real-time
                        </Text>
                        <View style={styles.roleFeatures}>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#1976D2" />
                                <Text style={styles.featureText}>Live map tracking</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#1976D2" />
                                <Text style={styles.featureText}>Smooth animations</Text>
                            </View>
                            <View style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#1976D2" />
                                <Text style={styles.featureText}>Auto-follow camera</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1976D2',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#E3F2FD',
        marginTop: 8,
    },
    inputContainer: {
        marginHorizontal: 24,
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#212121',
    },
    inputHint: {
        fontSize: 12,
        color: '#E3F2FD',
        marginTop: 8,
    },
    rolesContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 24,
        paddingHorizontal: 24,
    },
    rolesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 20,
        textAlign: 'center',
    },
    roleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    driverCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#1976D2',
    },
    customerCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    roleIconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    roleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212121',
        textAlign: 'center',
        marginBottom: 8,
    },
    roleDescription: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        marginBottom: 16,
    },
    roleFeatures: {
        marginTop: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#424242',
        marginLeft: 8,
    },
});
