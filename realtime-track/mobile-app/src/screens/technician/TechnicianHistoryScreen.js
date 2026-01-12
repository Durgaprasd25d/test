import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../../components/JobCard';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';

const MOCK_HISTORY = [
    { id: '1', serviceType: 'AC Repair', location: 'Model Town', status: 'completed', earnings: 960, date: '25 Dec' },
    { id: '2', serviceType: 'AC Service', location: 'Civil Lines', status: 'completed', earnings: 1200, date: '24 Dec' },
    { id: '3', serviceType: 'Installation', location: 'Saket', status: 'completed', earnings: 2400, date: '23 Dec' },
];

export default function TechnicianHistoryScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const result = await technicianService.getJobHistory();
        if (result.success) {
            setJobs(result.jobs || MOCK_HISTORY);
        }
        setLoading(false);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>JOB HISTORY</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={60} color={COLORS.grey} />
            <Text style={styles.emptyText}>No jobs completed yet</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={jobs}
                renderItem={({ item }) => <JobCard job={item} style={{ marginBottom: SPACING.md }} />}
                keyExtractor={(item, index) => item._id || item.id || index.toString()}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                stickyHeaderIndices={[0]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
        backgroundColor: COLORS.white,
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    list: { padding: SPACING.lg, paddingTop: 0 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, color: COLORS.grey, marginTop: 12 },
});
