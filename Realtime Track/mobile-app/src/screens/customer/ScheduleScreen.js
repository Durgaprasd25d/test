import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';

const { width } = Dimensions.get('window');

// Simple fixed dates for next 7 days
const DATES = [
    { day: 'Mon', date: '25', isToday: true },
    { day: 'Tue', date: '26', isToday: false },
    { day: 'Wed', date: '27', isToday: false },
    { day: 'Thu', date: '28', isToday: false },
    { day: 'Fri', date: '29', isToday: false },
    { day: 'Sat', date: '30', isToday: false },
    { day: 'Sun', date: '31', isToday: false },
];

const TIMES = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];

export default function ScheduleScreen({ route, navigation }) {
    const { service } = route.params;
    const [selectedDate, setSelectedDate] = useState('25');
    const [selectedTime, setSelectedTime] = useState('02:00 PM');
    const [address, setAddress] = useState(null);

    const handlePlaceSelect = (data, details) => {
        const newAddress = {
            description: data.description,
            location: details?.geometry?.location || null
        };
        setAddress(newAddress);
    };

    const isButtonEnabled = address && address.description;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>SCHEDULE SERVICE</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Service Info Card */}
                    <View style={styles.serviceCard}>
                        <View style={styles.serviceIconContainer}>
                            <Ionicons name="construct" size={24} color={COLORS.roseGold} />
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <Text style={styles.servicePrice}>₹{service.price} • {service.time}</Text>
                        </View>
                    </View>

                    {/* Date Selection */}
                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <View style={styles.dateContainer}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >
                            {DATES.map((item, index) => (
                                <TouchableOpacity
                                    key={`date-${index}`}
                                    style={[
                                        styles.dateCard,
                                        selectedDate === item.date && styles.activeDateCard
                                    ]}
                                    onPress={() => setSelectedDate(item.date)}
                                >
                                    <Text style={[
                                        styles.dateDay,
                                        selectedDate === item.date && styles.activeDateText
                                    ]}>
                                        {item.day}
                                    </Text>
                                    <Text style={[
                                        styles.dateNumber,
                                        selectedDate === item.date && styles.activeDateText
                                    ]}>
                                        {item.date}
                                    </Text>
                                    {item.isToday && (
                                        <View style={styles.todayBadge}>
                                            <Text style={styles.todayText}>Today</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Time Selection */}
                    <Text style={styles.sectionTitle}>Select Time</Text>
                    <View style={styles.timeGrid}>
                        {TIMES.map((time, index) => (
                            <TouchableOpacity
                                key={`time-${index}`}
                                style={[styles.timeCard, selectedTime === time && styles.activeTimeCard]}
                                onPress={() => setSelectedTime(time)}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color={selectedTime === time ? COLORS.roseGold : COLORS.grey}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.timeText, selectedTime === time && styles.activeTimeText]}>
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Location Selection */}
                    <Text style={styles.sectionTitle}>Service Location</Text>
                    <View style={styles.addressBox}>
                        <GooglePlacesAutocomplete
                            placeholder='Search for area, street, landmark...'
                            minLength={2}
                            onPress={handlePlaceSelect}
                            query={{
                                key: config.GOOGLE_MAPS_API_KEY,
                                language: 'en',
                                components: 'country:in',
                            }}
                            styles={{
                                textInput: styles.searchInput,
                                container: { flex: 0 },
                                listView: {
                                    backgroundColor: COLORS.white,
                                    borderRadius: 12,
                                    marginTop: 8,
                                    elevation: 5,
                                    maxHeight: 200,
                                },
                                row: {
                                    backgroundColor: COLORS.white,
                                    padding: 13,
                                },
                            }}
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            debounce={300}
                        />
                    </View>

                    {/* Selected Location Display */}
                    {address && (
                        <View style={styles.locationSummary}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location" size={20} color={COLORS.roseGold} />
                            </View>
                            <Text style={styles.selectedAddress} numberOfLines={2}>
                                {address.description}
                            </Text>
                            <TouchableOpacity onPress={() => setAddress(null)}>
                                <Ionicons name="close-circle" size={20} color={COLORS.grey} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmBtn, !isButtonEnabled && styles.disabledBtn]}
                    onPress={() => {
                        if (isButtonEnabled) {
                            navigation.navigate('BookingSummary', {
                                service,
                                date: selectedDate,
                                time: selectedTime,
                                address
                            });
                        }
                    }}
                    disabled={!isButtonEnabled}
                >
                    <Text style={styles.confirmBtnText}>
                        {isButtonEnabled ? 'Continue to Summary' : 'Select Location to Continue'}
                    </Text>
                    {isButtonEnabled && (
                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight
    },
    title: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    content: { padding: SPACING.xl },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
        padding: SPACING.md,
        borderRadius: 15,
        marginBottom: SPACING.xl,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.roseGold,
    },
    serviceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
    servicePrice: { fontSize: 14, color: COLORS.roseGold, fontWeight: '600' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: SPACING.md,
        marginTop: SPACING.lg
    },
    dateContainer: {
        height: 110,
        marginBottom: SPACING.lg,
    },
    dateCard: {
        width: 70,
        height: 100,
        backgroundColor: COLORS.greyLight,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    activeDateCard: {
        backgroundColor: COLORS.roseGold,
        ...SHADOWS.medium
    },
    dateDay: { fontSize: 13, color: COLORS.grey, fontWeight: '500' },
    dateNumber: { fontSize: 20, color: COLORS.black, fontWeight: 'bold', marginTop: 4 },
    activeDateText: { color: COLORS.white },
    todayBadge: {
        position: 'absolute',
        bottom: 6,
        backgroundColor: COLORS.white,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    todayText: { fontSize: 10, fontWeight: 'bold', color: COLORS.roseGold },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    timeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    activeTimeCard: {
        backgroundColor: COLORS.primaryBg,
        borderColor: COLORS.roseGold
    },
    timeText: { fontSize: 14, color: COLORS.black, fontWeight: '500' },
    activeTimeText: { color: COLORS.roseGold, fontWeight: 'bold' },
    addressBox: { marginTop: SPACING.sm, marginBottom: SPACING.md },
    searchInput: {
        backgroundColor: COLORS.greyLight,
        height: 50,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 15,
        color: COLORS.black,
    },
    locationSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg,
        padding: SPACING.md,
        borderRadius: 15,
        marginTop: SPACING.md,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.roseGold,
    },
    locationIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    selectedAddress: {
        flex: 1,
        fontSize: 14,
        color: COLORS.black,
        fontWeight: '500',
        marginRight: SPACING.sm,
    },
    footer: {
        padding: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.greyLight,
        backgroundColor: COLORS.white,
    },
    confirmBtn: {
        backgroundColor: COLORS.roseGold,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium
    },
    disabledBtn: { backgroundColor: COLORS.greyMedium, elevation: 0, shadowOpacity: 0 },
    confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
