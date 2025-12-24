import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator,
    FlatList,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import useLocationStore from '../store/useLocationStore';
import rideService from '../services/rideService';
import config from '../constants/config';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const pickupRef = useRef();
    const destRef = useRef();

    const {
        setRideInfo,
        setRideStatus,
        setPickupLocation,
        setDestinationLocation,
        pickupLocation,
        destinationLocation,
        driverId,
        setDriverId
    } = useLocationStore();

    const [loading, setLoading] = useState(false);
    const [pendingRides, setPendingRides] = useState([]);
    const [role, setRole] = useState(null); // 'customer' or 'driver'

    useEffect(() => {
        if (role === 'driver') {
            fetchPendingRides();
            const interval = setInterval(fetchPendingRides, 5000);
            return () => clearInterval(interval);
        }
    }, [role]);

    const fetchPendingRides = async () => {
        const result = await rideService.getPendingRides();
        if (result.success) {
            setPendingRides(result.data);
        }
    };

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        if (selectedRole === 'driver' && !driverId) {
            const newDriverId = `driver_${Math.floor(Math.random() * 1000)}`;
            setDriverId(newDriverId);
        }
    };

    const handlePickupSelect = (data, details = null) => {
        if (!details) return;
        setPickupLocation({
            address: data.description,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
        });
        // Force list to close
        pickupRef.current?.setAddressText(data.description);
        pickupRef.current?.blur();
    };

    const handleDestinationSelect = (data, details = null) => {
        if (!details) return;
        setDestinationLocation({
            address: data.description,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
        });
        // Force list to close
        destRef.current?.setAddressText(data.description);
        destRef.current?.blur();
    };

    const handleRequestRide = async () => {
        if (!pickupLocation || !destinationLocation) {
            Alert.alert('Missing Info', 'Please select both pickup and destination');
            return;
        }

        setLoading(true);
        const result = await rideService.requestRide(pickupLocation, destinationLocation);
        setLoading(false);

        if (result.success) {
            setRideInfo(result.data.rideId, 'customer');
            setRideStatus('REQUESTED');
            navigation.navigate('Customer', { rideId: result.data.rideId });
        } else {
            Alert.alert('Error', result.error || 'Failed to request ride');
        }
    };

    const handleAcceptRide = async (request) => {
        setLoading(true);
        const result = await rideService.acceptRide(request.rideId, driverId);
        setLoading(false);

        if (result.success) {
            setRideInfo(request.rideId, 'driver');
            setRideStatus('ACCEPTED');
            setPickupLocation(request.pickup);
            setDestinationLocation(request.destination);
            navigation.navigate('Driver', { rideId: request.rideId });
        } else {
            Alert.alert('Error', result.error || 'Could not accept ride');
            fetchPendingRides();
        }
    };

    const renderRoleSelection = () => (
        <View style={styles.roleContainer}>
            <Text style={styles.roleTitle}>Select Your Role</Text>
            <View style={styles.roleButtons}>
                <TouchableOpacity
                    style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
                    onPress={() => handleRoleSelect('customer')}
                >
                    <Ionicons name="person" size={width * 0.08} color={role === 'customer' ? '#fff' : '#1976D2'} />
                    <Text style={[styles.roleBtnText, role === 'customer' && styles.roleBtnTextActive]}>Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.roleBtn, role === 'driver' && styles.roleBtnActive]}
                    onPress={() => handleRoleSelect('driver')}
                >
                    <Ionicons name="car" size={width * 0.08} color={role === 'driver' ? '#fff' : '#1976D2'} />
                    <Text style={[styles.roleBtnText, role === 'driver' && styles.roleBtnTextActive]}>Driver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCustomerView = () => (
        <View style={styles.content}>
            <Text style={styles.inputLabel}>Pickup Location</Text>
            <GooglePlacesAutocomplete
                ref={pickupRef}
                placeholder="Where to pick you up?"
                onPress={handlePickupSelect}
                query={{
                    key: config.GOOGLE_MAPS_API_KEY,
                    language: 'en',
                }}
                fetchDetails={true}
                minLength={2}
                debounce={300}
                styles={{
                    container: { flex: 0, width: '100%', marginBottom: 15, zIndex: 1000 },
                    textInput: styles.autocompleteInput,
                    listView: styles.autocompleteList,
                }}
                enablePoweredByContainer={false}
                textInputProps={{
                    placeholderTextColor: '#9E9E9E',
                }}
            />

            <Text style={styles.inputLabel}>Where to?</Text>
            <GooglePlacesAutocomplete
                ref={destRef}
                placeholder="Where are you going?"
                onPress={handleDestinationSelect}
                query={{
                    key: config.GOOGLE_MAPS_API_KEY,
                    language: 'en',
                }}
                fetchDetails={true}
                minLength={2}
                debounce={300}
                styles={{
                    container: { flex: 0, width: '100%', marginBottom: 20, zIndex: 999 },
                    textInput: styles.autocompleteInput,
                    listView: styles.autocompleteList,
                }}
                enablePoweredByContainer={false}
                textInputProps={{
                    placeholderTextColor: '#9E9E9E',
                }}
            />

            <TouchableOpacity
                style={[
                    styles.requestBtn,
                    (!pickupLocation || !destinationLocation) && styles.disabledBtn
                ]}
                onPress={handleRequestRide}
                disabled={loading || !pickupLocation || !destinationLocation}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.requestBtnText}>Request Ride</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (role === 'customer') return renderCustomerView();
        if (role === 'driver') return renderDriverView();
        return null;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <View style={styles.header}>
                <Ionicons name="car-sport" size={35} color="#fff" />
                <Text style={styles.headerTitle}>SwiftTrack</Text>
            </View>

            <FlatList
                data={role === 'driver' ? pendingRides : [1]}
                keyExtractor={(item, index) => item.rideId || index.toString()}
                ListHeaderComponent={
                    <View>
                        {renderRoleSelection()}
                        {role === 'customer' && renderCustomerView()}
                        {role === 'driver' && <Text style={styles.sectionTitle}>New Live Requests</Text>}
                    </View>
                }
                renderItem={({ item }) => {
                    if (role !== 'driver') return null;
                    return (
                        <View style={styles.requestCard}>
                            <View style={styles.requestInfo}>
                                <View style={styles.locationRow}>
                                    <Ionicons name="pin" size={16} color="#4CAF50" />
                                    <Text style={styles.locationText} numberOfLines={1}>{item.pickup.address}</Text>
                                </View>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location" size={16} color="#F44336" />
                                    <Text style={styles.locationText} numberOfLines={1}>{item.destination.address}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => handleAcceptRide(item)}
                            >
                                <Text style={styles.acceptBtnText}>ACCEPT</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
                ListEmptyComponent={() => {
                    if (role !== 'driver') return null;
                    return (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-outline" size={width * 0.15} color="#BDBDBD" />
                            <Text style={styles.emptyText}>Waiting for requests...</Text>
                        </View>
                    );
                }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: '#1976D2',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
    scrollContent: { paddingBottom: 20 },
    roleContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        elevation: 2,
    },
    roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#424242', marginBottom: 15, textAlign: 'center' },
    roleButtons: { flexDirection: 'row', justifyContent: 'space-around' },
    roleBtn: {
        padding: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1976D2',
        alignItems: 'center',
        width: '44%'
    },
    roleBtnActive: { backgroundColor: '#1976D2' },
    roleBtnText: { marginTop: 5, color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
    roleBtnTextActive: { color: '#fff' },
    content: { padding: 20 },
    driverContent: { padding: 20 },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#757575',
        marginBottom: 8,
        marginLeft: 2,
        textTransform: 'uppercase',
    },
    autocompleteInput: {
        backgroundColor: '#fff',
        borderRadius: 10,
        height: 48,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        fontSize: 15,
        color: '#424242',
    },
    autocompleteList: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginTop: 2,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 2000,
    },
    requestBtn: {
        backgroundColor: '#1976D2',
        height: 55,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        elevation: 3,
    },
    disabledBtn: { backgroundColor: '#BDBDBD', elevation: 0 },
    requestBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginTop: 20, marginHorizontal: 20, marginBottom: 10 },
    requestCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    requestInfo: { flex: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    locationText: { marginLeft: 8, fontSize: 13, color: '#616161', flex: 1 },
    acceptBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    emptyContainer: { justifyContent: 'center', alignItems: 'center', minHeight: 200 },
    emptyText: { marginTop: 15, color: '#BDBDBD', fontSize: 14 },
});



