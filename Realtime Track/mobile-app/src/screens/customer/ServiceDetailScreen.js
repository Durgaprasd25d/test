import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen({ route, navigation }) {
    const { service } = route.params;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Visual Header */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: service.image || 'https://images.unsplash.com/photo-1581092921461-7026814b713b?q=80&w=2070&auto=format&fit=crop' }}
                        style={styles.image}
                    />
                    <LinearGradient
                        colors={['rgba(15, 23, 42, 0.6)', 'transparent', 'rgba(15, 23, 42, 0.4)']}
                        style={styles.imageOverlay}
                    >
                        <SafeAreaView edges={['top']} style={styles.headerControls}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shareBtn}>
                                <Ionicons name="share-social-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </SafeAreaView>
                    </LinearGradient>
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    <View style={styles.dragIndicator} />

                    <View style={styles.topInfo}>
                        <View style={styles.titleArea}>
                            <Text style={styles.categoryLabel}>Professional Service</Text>
                            <Text style={styles.title}>{service.name}</Text>
                        </View>
                        <View style={styles.priceTag}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.priceValue}>{service.price}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                                <Ionicons name="time" size={20} color={COLORS.indigo} />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Duration</Text>
                                <Text style={styles.statValue}>{service.time}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}>
                                <Ionicons name="star" size={20} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Rating</Text>
                                <Text style={styles.statValue}>4.8 (120)</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>What's Included</Text>
                    <View style={styles.inclusionList}>
                        {[
                            'Full system diagnostic & health check',
                            'Deep filter and coil cleaning',
                            'Cooling gas pressure verification',
                            '90-day comprehensive service warranty'
                        ].map((item, index) => (
                            <View key={index} style={styles.inclusionItem}>
                                <View style={styles.checkIcon}>
                                    <Ionicons name="checkmark" size={16} color="#22c55e" />
                                </View>
                                <Text style={styles.inclusionText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>About Service</Text>
                    <Text style={styles.description}>
                        Experience our industry-leading {service.name} performed by background-verified experts.
                        We use professional-grade equipment and follow a 20-point checklist to ensure your AC delivers
                        maximum cooling efficiency and healthy air quality.
                    </Text>

                    {/* Features Grid */}
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureBox}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.indigo} />
                            <Text style={styles.featureText}>Verified Pros</Text>
                        </View>
                        <View style={styles.featureBox}>
                            <Ionicons name="flash-outline" size={24} color={COLORS.indigo} />
                            <Text style={styles.featureText}>Quick Setup</Text>
                        </View>
                        <View style={styles.featureBox}>
                            <Ionicons name="card-outline" size={24} color={COLORS.indigo} />
                            <Text style={styles.featureText}>Safe Pay</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Footer */}
            <View style={styles.footer}>
                <View style={styles.totalArea}>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalAmount}>₹{service.price}</Text>
                </View>
                <TouchableOpacity
                    style={styles.bookBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Schedule', { service })}
                >
                    <LinearGradient
                        colors={[COLORS.indigo, '#3730a3']}
                        style={styles.bookBtnGradient}
                    >
                        <Text style={styles.bookBtnText}>Schedule Now</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
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
    imageContainer: {
        width: '100%',
        height: 340,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%'
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    shareBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    content: {
        paddingTop: 12,
        paddingHorizontal: 24,
        backgroundColor: COLORS.premiumBg,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        marginTop: -40
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: COLORS.borderLight,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 25,
    },
    topInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.indigo,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.textMain,
        maxWidth: width * 0.6,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.indigo,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        ...SHADOWS.medium,
    },
    currency: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff'
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 20,
        marginBottom: 30,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: COLORS.borderLight,
        marginHorizontal: 15,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500'
    },
    statValue: {
        fontSize: 15,
        color: COLORS.textMain,
        fontWeight: '700'
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textMain,
        marginBottom: 16
    },
    inclusionList: {
        gap: 14,
        marginBottom: 30,
    },
    inclusionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inclusionText: {
        fontSize: 14,
        color: COLORS.textMain,
        fontWeight: '600',
        flex: 1,
    },
    description: {
        fontSize: 15,
        color: COLORS.textMuted,
        lineHeight: 24,
        marginBottom: 30
    },
    featuresGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    featureBox: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 18,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    featureText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMain,
        marginTop: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.heavy,
    },
    totalArea: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.textMain,
    },
    bookBtn: {
        flex: 1.5,
        height: 58,
        borderRadius: 18,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    bookBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    bookBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800'
    },
});

