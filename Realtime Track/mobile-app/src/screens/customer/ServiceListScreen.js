import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SERVICES = {
    repair: [
        { id: 'r1', name: 'Gas Leak Fix', price: 1500, time: '2 hrs', image: 'https://images.unsplash.com/photo-1542013936693-884638332154?q=80&w=200&auto=format&fit=crop' },
        { id: 'r2', name: 'Cooling Issue', price: 800, time: '1 hr', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=200&auto=format&fit=crop' },
    ],
    service: [
        { id: 's1', name: 'Deep Cleaning', price: 1200, time: '1.5 hrs', image: 'https://images.unsplash.com/photo-1621905252507-b354bc2addcc?q=80&w=200&auto=format&fit=crop' },
        { id: 's2', name: 'Standard Checkup', price: 500, time: '30 mins', image: 'https://images.unsplash.com/photo-1590333746438-281fd6f966fd?q=80&w=200&auto=format&fit=crop' },
    ],
    install: [
        { id: 'i1', name: 'Unit Installation', price: 2500, time: '3 hrs', image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?q=80&w=200&auto=format&fit=crop' },
    ],
    emergency: [
        { id: 'e1', name: 'Fast Repair', price: 2000, time: '45 mins', image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=200&auto=format&fit=crop' },
    ]
};

export default function ServiceListScreen({ route, navigation }) {
    const { type } = route.params;
    const data = SERVICES[type] || [];

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.time}><Ionicons name="time-outline" size={12} /> {item.time}</Text>
                </View>
                <Text style={styles.price}>₹{item.price}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.roseGold} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.title}>{type.toUpperCase()} SERVICES</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No services available</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    title: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    list: { padding: SPACING.md },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
    },
    cardHeader: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: SPACING.md },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
    time: { fontSize: 12, color: COLORS.grey, marginTop: 4 },
    price: { fontSize: 16, fontWeight: '700', color: COLORS.roseGold },
    empty: { textAlign: 'center', marginTop: 100, color: COLORS.grey },
});
