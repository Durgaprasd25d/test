import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen({ route, navigation }) {
    const { service } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image / Header */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: service.image }} style={styles.image} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{service.name}</Text>
                        <Text style={styles.price}>₹{service.price}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={18} color={COLORS.roseGold} />
                            <Text style={styles.metaText}>{service.time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={18} color={COLORS.gold} />
                            <Text style={styles.metaText}>4.8 (120 reviews)</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>What's Included</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}><Ionicons name="checkmark-circle" color={COLORS.success} /> Full system diagnostic</Text>
                        <Text style={styles.bulletItem}><Ionicons name="checkmark-circle" color={COLORS.success} /> Deep filter cleaning</Text>
                        <Text style={styles.bulletItem}><Ionicons name="checkmark-circle" color={COLORS.success} /> Cooling gas level check</Text>
                        <Text style={styles.bulletItem}><Ionicons name="checkmark-circle" color={COLORS.success} /> 90 days service warranty</Text>
                    </View>

                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>
                        Our premium {service.name} ensures your AC runs at peak efficiency. We use high-quality tools and certified technicians to provide a hassle-free experience.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => navigation.navigate('Schedule', { service })}
                >
                    <Text style={styles.bookBtnText}>Schedule Service</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    imageContainer: { width: '100%', height: 300 },
    image: { width: '100%', height: '100%' },
    backBtn: { position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    content: { padding: SPACING.xl, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
    price: { fontSize: 24, fontWeight: '900', color: COLORS.roseGold },
    metaRow: { flexDirection: 'row', gap: SPACING.xl, marginBottom: SPACING.xl },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 14, color: COLORS.grey, fontWeight: '500' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginTop: SPACING.lg, marginBottom: SPACING.md },
    bulletList: { gap: 10 },
    bulletItem: { fontSize: 15, color: COLORS.black, opacity: 0.8 },
    description: { fontSize: 14, color: COLORS.grey, lineHeight: 22, marginBottom: 40 },
    footer: { padding: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.greyLight, backgroundColor: COLORS.white },
    bookBtn: { backgroundColor: COLORS.roseGold, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
    bookBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
