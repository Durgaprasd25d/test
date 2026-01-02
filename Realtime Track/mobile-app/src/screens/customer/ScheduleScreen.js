import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Keyboard, Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';

const { width } = Dimensions.get('window');

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
        setAddress(newAddress);
        Keyboard.dismiss();
    };

    const isButtonEnabled = address && address.description && selectedDate && selectedTime;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[COLORS.slate, COLORS.slateLight]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Schedule Service</Text>
                        <View style={{ width: 44 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.mainScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.scrollContent}
            >
                {/* Service Summary Item */}
                <View style={styles.summaryCard}>
                    <View style={styles.serviceIconContainer}>
                        <Ionicons name="construct" size={22} color={COLORS.indigo} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceCategory}>SELECTED PACKAGE</Text>
                        <Text style={styles.serviceName}>{service.name}</Text>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>₹{service.price}</Text>
                    </View>
                </View>

                {/* Location Picker */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Service Location</Text>
                </View>

                {address ? (
                    <View style={styles.selectedLocationCard}>
                        <View style={styles.locationIconCircle}>
                            <Ionicons name="location" size={22} color={COLORS.indigo} />
                        </View>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.locationLabel}>Delivering to</Text>
                            <Text style={styles.locationText} numberOfLines={2}>{address.description}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.changeBtn}
                            onPress={() => setAddress(null)}
                        >
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.searchWrapper}>
                        <GooglePlacesAutocomplete
                            ref={googleRef}
                            placeholder='Enter your service address...'
                            minLength={2}
                            onPress={handlePlaceSelect}
                            onFail={(error) => console.error("Google Places Error: ", error)}
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
                                separator: styles.googleSeparator,
                                description: { color: COLORS.textMain, fontWeight: '500' },
                                poweredContainer: { display: 'none' }
                            }}
                            fetchDetails={true}
                            enablePoweredByContainer={false}
                            nearbyPlacesAPI="GooglePlacesSearch"
                            debounce={400}
                            listEmptyComponent={() => (
                                <View style={{ padding: 15, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>No matching locations found</Text>
                                </View>
                            )}
                            renderDescription={row => row.description || row.vicinity}
                            renderLeftButton={() => (
                                <View style={styles.searchIcon}>
                                    <Ionicons name="search" size={20} color={COLORS.textMuted} />
                                </View>
                            )}
                        />
                    </View>
                )}

                <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                    <Text style={styles.sectionTitle}>Select Date</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateList}
                >
                    {DATES.map((item, index) => {
                        const isSelected = selectedDate === item.date;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                                onPress={() => setSelectedDate(item.date)}
                            >
                                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{item.day}</Text>
                                <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>{item.date}</Text>
                                {item.isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: '#fff' }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                    <Text style={styles.sectionTitle}>Available Slots</Text>
                </View>

                <View style={styles.timeGrid}>
                    {TIMES.map((time, index) => {
                        const isSelected = selectedTime === time;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                style={[styles.timeChip, isSelected && styles.timeChipActive]}
                                onPress={() => setSelectedTime(time)}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={16}
                                    color={isSelected ? '#fff' : COLORS.textMuted}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>{time}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmBtn, !isButtonEnabled && styles.confirmBtnDisabled]}
                    activeOpacity={0.8}
                    disabled={!isButtonEnabled}
                    onPress={() => {
                        navigation.navigate('BookingSummary', {
                            service,
                            date: selectedDate,
                            time: selectedTime,
                            address
                        });
                    }}
                >
                    <LinearGradient
                        colors={isButtonEnabled ? [COLORS.indigo, '#3730a3'] : ['#e2e8f0', '#e2e8f0']}
                        style={styles.gradientBtn}
                    >
                        <Text style={[styles.confirmBtnText, !isButtonEnabled && { color: COLORS.textMuted }]}>
                            {isButtonEnabled ? 'Review & Book' : 'Complete Details'}
                        </Text>
                        {isButtonEnabled && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.premiumBg
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.medium,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainScroll: {
        flex: 1
    },
    scrollContent: {
        padding: 24,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 35,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.light,
    },
    serviceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceCategory: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 1,
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '900',
        color: COLORS.textMain,
    },
    priceTag: {
        backgroundColor: COLORS.slate,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    priceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    sectionHeader: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: COLORS.textMain,
    },
    selectedLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: COLORS.indigo,
        ...SHADOWS.small,
    },
    locationIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locationLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.indigo,
        marginBottom: 4,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textMain,
        lineHeight: 18,
    },
    changeBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    changeBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.indigo,
    },
    searchWrapper: {
        zIndex: 1000,
        minHeight: 56,
    },
    googleInputContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    googleInput: {
        height: 52,
        fontSize: 14,
        color: COLORS.textMain,
        fontWeight: '600',
    },
    searchIcon: {
        marginRight: 8,
    },
    googleListView: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 8,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    googleRow: {
        padding: 16,
    },
    googleSeparator: {
        height: 1,
        backgroundColor: COLORS.borderLight,
    },
    dateList: {
        paddingHorizontal: 4,
        gap: 12,
    },
    dateCard: {
        width: 68,
        height: 84,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        ...SHADOWS.light,
    },
    dateCardActive: {
        backgroundColor: COLORS.slate,
        borderColor: COLORS.slate,
        ...SHADOWS.medium,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    dayTextActive: {
        color: 'rgba(255,255,255,0.7)',
    },
    dateText: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.textMain,
    },
    dateTextActive: {
        color: '#fff',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.indigo,
        marginTop: 6,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 4,
    },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        minWidth: (width - 60) / 3,
        justifyContent: 'center',
    },
    timeChipActive: {
        backgroundColor: COLORS.indigo,
        borderColor: COLORS.indigo,
        ...SHADOWS.small,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    timeTextActive: {
        color: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    confirmBtn: {
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    confirmBtnDisabled: {
        ...SHADOWS.none,
    },
    gradientBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
});

