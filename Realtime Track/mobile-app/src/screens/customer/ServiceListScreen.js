import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';

const { width } = Dimensions.get('window');

export default function ServiceListScreen({ route, navigation }) {
    const { type, categoryName } = route.params;
    const [services, setServices] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchServices();
    }, [type]);

    const fetchServices = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/category/${type}`);
            const result = await response.json();
            if (result.success) {
                setServices(result.data.services);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

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
                <Text style={styles.title}>{categoryName?.toUpperCase() || type?.toUpperCase()} SERVICES</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.roseGold} />
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No services available</Text>}
                />
            )}
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
