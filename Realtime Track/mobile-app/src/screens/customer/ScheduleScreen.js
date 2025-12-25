import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Keyboard, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';

const { width } = Dimensions.get('window');

// Dynamic Dates for next 7 days
const getNext7Days = () => {
    const days = [];
    const date = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(date);
        d.setDate(date.getDate() + i);
        days.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate().toString(),
            fullDate: d.toDateString(),
            isToday: i === 0
        });
    }
    return days;
};

const DATES = getNext7Days();
const TIMES = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];

export default function ScheduleScreen({ route, navigation }) {
    const { service } = route.params;
    const [selectedDate, setSelectedDate] = useState(DATES[0].date);
    const [selectedTime, setSelectedTime] = useState('02:00 PM');
    const [address, setAddress] = useState(null);

    const googleRef = useRef(null);

    const handlePlaceSelect = (data, details = null) => {
        if (!data) return;

        const newAddress = {
            description: data.description || data.formatted_address || "Unnamed Location",
            location: details?.geometry?.location || { lat: 0, lng: 0 }
        };

        // Setting address will trigger the unmount of GooglePlacesAutocomplete
        // which physically removes the suggestion box from the view tree
        setAddress(newAddress);
        Keyboard.dismiss();
    };

    const isButtonEnabled = address && address.description && selectedDate && selectedTime;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 1. Header (Fixed) */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>Book Appointment</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* 2. Service Summary (Fixed) */}
            <View style={styles.serviceSection}>
                <View style={styles.miniServiceCard}>
                    <View style={styles.iconBox}>
                        <Ionicons name="construct-outline" size={20} color={COLORS.roseGold} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.miniLabel}>SERVICE SELECTED</Text>
                        <Text style={styles.miniName}>{service.name}</Text>
                    </View>
                    <Text style={styles.miniPrice}>₹{service.price}</Text>
                </View>
            </View>

            {/* 3. Search Bar (Fixed & Separated to avoid VirtualizedList warning) */}
            {/* This container has high zIndex so suggestions float over everything else */}
            <View style={styles.searchSection}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="location-outline" size={18} color={COLORS.roseGold} />
                    <Text style={styles.sectionTitle}>Where to service?</Text>
                </View>

                {address ? (
                    /* FORCE CLOSURE: Unmounting the search bar is the only 100% way to kill the suggestion box */
                    <View style={styles.selectedLocationPill}>
                        <View style={styles.pillIcon}>
                            <Ionicons name="location" size={18} color={COLORS.success} />
                        </View>
                        <Text style={styles.pillText} numberOfLines={1}>{address.description}</Text>
                        <TouchableOpacity
                            style={styles.changeBtn}
                            onPress={() => setAddress(null)}
                        >
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.searchContainer}>
                        <GooglePlacesAutocomplete
                            ref={googleRef}
                            placeholder='Search for home, street or landmark...'
                            minLength={2}
                            onPress={handlePlaceSelect}
                            query={{
                                key: config.GOOGLE_MAPS_API_KEY,
                                language: 'en',
                                components: 'country:in',
                            }}
                            styles={{
                                textInputContainer: styles.googleInputContainer,
                                textInput: styles.googleInput,
                                listView: styles.googleListView,
                                row: styles.googleRow,
                                description: styles.googleDescription,
                                separator: styles.googleSeparator,
                            }}
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            debounce={300}
                            nearbyPlacesAPI="GooglePlacesSearch"
                            keyboardShouldPersistTaps="always"
                            renderLeftButton={() => (
                                <View style={styles.searchIconInner}>
                                    <Ionicons name="search" size={20} color={COLORS.roseGold} />
                                </View>
                            )}
                        />
                    </View>
                )}
            </View>

            {/* 4. Main Scrollable Content (Date/Time) */}
            {/* This remains below the search bar to resolve nested list warning */}
            <ScrollView
                style={styles.mainScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.scrollPadding}>
                    <View style={styles.divider} />

                    {/* Date Selection */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.roseGold} />
                        <Text style={styles.sectionTitle}>Pick a Date</Text>
                    </View>
                    <View style={styles.dateScroll}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {DATES.map((item, index) => (
                                <TouchableOpacity
                                    key={`date-${index}`}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.premiumDateCard,
                                        selectedDate === item.date && styles.activePremiumDateCard
                                    ]}
                                    onPress={() => {
                                        setSelectedDate(item.date);
                                        Keyboard.dismiss();
                                    }}
                                >
                                    <Text style={[
                                        styles.premiumDay,
                                        selectedDate === item.date && styles.activeWhiteText
                                    ]}>
                                        {item.day}
                                    </Text>
                                    <Text style={[
                                        styles.premiumNumber,
                                        selectedDate === item.date && styles.activeWhiteText
                                    ]}>
                                        {item.date}
                                    </Text>
                                    {item.isToday && (
                                        <View style={[styles.dotMarker, selectedDate === item.date && { backgroundColor: COLORS.white }]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Time Selection */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={18} color={COLORS.roseGold} />
                        <Text style={styles.sectionTitle}>Choose Time</Text>
                    </View>
                    <View style={styles.timeGrid}>
                        {TIMES.map((time, index) => (
                            <TouchableOpacity
                                key={`time-${index}`}
                                activeOpacity={0.7}
                                style={[
                                    styles.premiumTimeCard,
                                    selectedTime === time && styles.activePremiumTimeCard
                                ]}
                                onPress={() => {
                                    setSelectedTime(time);
                                    Keyboard.dismiss();
                                }}
                            >
                                <Text style={[
                                    styles.premiumTimeText,
                                    selectedTime === time && styles.activeWhiteText
                                ]}>
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* 5. Premium Action Footer */}
            <View style={styles.premiumFooter}>
                <TouchableOpacity
                    style={[styles.mainBtn, !isButtonEnabled && styles.mainBtnDisabled]}
                    activeOpacity={0.8}
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
                    <Text style={styles.mainBtnText}>
                        {isButtonEnabled ? 'Review Booking' : 'Complete details'}
                    </Text>
                    {isButtonEnabled && (
                        <Ionicons name="arrow-forward-outline" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
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
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.white,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.greyLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.black, letterSpacing: -0.5 },

    serviceSection: { paddingHorizontal: SPACING.lg, paddingTop: 10 },
    searchSection: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        zIndex: 5000, // Vital for suggestions to overlay everything
        backgroundColor: COLORS.white,
    },
    mainScroll: { flex: 1 },
    scrollPadding: { paddingHorizontal: SPACING.lg },

    miniServiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryBg + '30',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primaryBg + '50',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...SHADOWS.small
    },
    miniLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '700', marginBottom: 2 },
    miniName: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    miniPrice: { fontSize: 16, fontWeight: '900', color: COLORS.roseGold },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black },

    searchContainer: { minHeight: 60, zIndex: 5000 },
    googleInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    googleInput: {
        height: 48,
        fontSize: 14,
        color: COLORS.black,
        paddingLeft: 10,
        fontWeight: '500',
        flex: 1,
    },
    searchIconInner: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 12,
    },
    googleListView: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
        maxHeight: 250,
        zIndex: 9999,
    },
    googleRow: {
        padding: 15,
        backgroundColor: COLORS.white,
    },
    googleDescription: { fontSize: 13, color: COLORS.black },
    googleSeparator: { height: 1, backgroundColor: COLORS.greyLight },

    selectedLocationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.success,
        ...SHADOWS.small,
    },
    pillIcon: { marginRight: 10 },
    pillText: { flex: 1, fontSize: 13, color: COLORS.black, fontWeight: '600' },
    changeBtn: {
        backgroundColor: COLORS.greyLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    changeBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.roseGold },

    divider: { height: 1.5, backgroundColor: COLORS.greyLight, marginVertical: 20, opacity: 0.5 },

    dateScroll: { marginBottom: 25 },
    premiumDateCard: {
        width: 68,
        height: 80,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: COLORS.greyLight,
    },
    activePremiumDateCard: {
        backgroundColor: COLORS.roseGold,
        borderColor: COLORS.roseGold,
        ...SHADOWS.medium,
    },
    premiumDay: { fontSize: 11, color: COLORS.grey, fontWeight: '600' },
    premiumNumber: { fontSize: 20, color: COLORS.black, fontWeight: '800', marginTop: 2 },
    activeWhiteText: { color: COLORS.white },
    dotMarker: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.roseGold, marginTop: 4 },

    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    premiumTimeCard: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.greyLight,
        flex: 1,
        minWidth: '30%',
        alignItems: 'center',
    },
    activePremiumTimeCard: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black,
        ...SHADOWS.medium,
    },
    premiumTimeText: { fontSize: 13, fontWeight: '700', color: COLORS.black },

    premiumFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.greyLight,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    mainBtn: {
        backgroundColor: COLORS.roseGold,
        height: 56,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    mainBtnDisabled: { backgroundColor: '#E0E0E0', elevation: 0, shadowOpacity: 0 },
    mainBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});
