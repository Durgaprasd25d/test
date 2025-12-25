import { Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import ToggleSwitch from '../../components/ToggleSwitch';
import JobCard from '../../components/JobCard';
import JobRequestModal from '../../components/JobRequestModal';
import technicianService from '../../services/technicianService';
import authService from '../../services/authService';
import technicianSocketService from '../../services/technicianSocketService';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

export default function TechnicianDashboardScreen({ navigation }) {
    const [isOnline, setIsOnline] = useState(false);
    const [user, setUser] = useState(null);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [completedJobs, setCompletedJobs] = useState(0);
    const [activeJob, setActiveJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socketConnected, setSocketConnected] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [pendingJob, setPendingJob] = useState(null);

    useEffect(() => {
        loadUser();
        loadDashboardData();

        // Connect to socket for job notifications
        technicianSocketService.connect(handleJobRequest, handleSocketConnection);

        return () => {
            technicianSocketService.disconnect();
        };
    }, []);

    const handleSocketConnection = (status) => {
        console.log('Socket status:', status);
        setSocketConnected(status === 'connected');
    };

    const handleJobRequest = (jobData) => {
        console.log('📋 New job request:', jobData);
        setPendingJob(jobData);
        setShowJobModal(true);
    };

    const handleAcceptJob = async () => {
        setShowJobModal(false);

        if (!pendingJob || !pendingJob.rideId) {
            Alert.alert('Error', 'Invalid job data');
            return;
        }

        console.log('🎯 Accepting job:', pendingJob.rideId);

        try {
            // Get technician ID
            const technicianData = await authService.getUser();
            const driverId = technicianData?.id || technicianData?._id;

            console.log('📞 Calling accept API - rideId:', pendingJob.rideId, 'driverId:', driverId);

            // CRITICAL: Call backend to accept job (this triggers ride:accepted event)
            const response = await fetch(`${config.BACKEND_URL}/api/ride/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rideId: pendingJob.rideId,
                    driverId: driverId
                })
            });

            const result = await response.json();
            console.log('✅ Accept job response:', result);

            if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to accept job');
                return;
            }

            // Now navigate to navigation screen
            navigation.navigate('TechnicianNavigation', {
                rideId: pendingJob.rideId,
                destination: pendingJob.pickup,
                serviceType: pendingJob.serviceType
            });

            setPendingJob(null);
        } catch (error) {
            console.error('❌ Accept job error:', error);
            Alert.alert('Error', 'Failed to accept job. Please try again.');
        }
    };

    const handleRejectJob = () => {
        setShowJobModal(false);
        setPendingJob(null);
    };

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    const loadDashboardData = async () => {
        try {
            const result = await technicianService.getTechnicianDashboard();
            if (result.success) {
                setTodayEarnings(result.data.todayEarnings);
                setCompletedJobs(result.data.completedJobs);
                setActiveJob(result.data.activeJob);
                setIsOnline(result.data.isOnline);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnline = async (newStatus) => {
        setIsOnline(newStatus);
        const result = await technicianService.updateOnlineStatus(newStatus);
        if (!result.success) {
            // Revert on error
            setIsOnline(!newStatus);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.name}>{user?.name || 'Technician'}</Text>
                </View>
                <ToggleSwitch
                    value={isOnline}
                    onValueChange={handleToggleOnline}
                    label={isOnline ? "Online" : "Offline"}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Earnings Card */}
                <View style={styles.earningsCard}>
                    <View style={styles.earningsHeader}>
                        <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
                        <Text style={styles.earningsLabel}>Today's Earnings</Text>
                    </View>
                    <Text style={styles.earningsAmount}>₹{todayEarnings.toLocaleString()}</Text>
                    <View style={styles.earningsFooter}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Jobs Done</Text>
                            <Text style={styles.statValue}>{completedJobs}/10</Text>
                        </View>
                        <View style={styles.dividerV} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Target</Text>
                            <Text style={styles.statValue}>₹5,000</Text>
                        </View>
                    </View>
                </View>

                {/* Active Job */}
                {activeJob && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Job</Text>
                        </View>
                        <JobCard
                            job={activeJob}
                            onPress={() => navigation.navigate('JobDetails', { job: activeJob })}
                        />
                    </>
                )}

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Service Deliveries</Text>
                    <Text style={styles.sectionSubtitle}>{completedJobs}/10 target</Text>
                </View>

                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicianHistory')}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="list-outline" size={24} color={COLORS.technicianPrimary} />
                        </View>
                        <Text style={styles.actionText}>View All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="bar-chart-outline" size={24} color={COLORS.technicianPrimary} />
                        </View>
                        <Text style={styles.actionText}>Analytics</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicianWallet')}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="wallet-outline" size={24} color={COLORS.technicianPrimary} />
                        </View>
                        <Text style={styles.actionText}>Wallet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicianProfile')}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="person-outline" size={24} color={COLORS.technicianPrimary} />
                        </View>
                        <Text style={styles.actionText}>Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={async () => {
                        await authService.logout();
                        navigation.replace('Auth');
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Job Request Modal */}
            <JobRequestModal
                visible={showJobModal}
                jobData={pendingJob}
                onAccept={handleAcceptJob}
                onReject={handleRejectJob}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
    },
    greeting: { fontSize: 14, color: COLORS.grey },
    name: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginTop: 2 },
    scrollContent: { padding: SPACING.lg, paddingBottom: 40 },
    earningsCard: {
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 25,
        padding: SPACING.xl,
        ...SHADOWS.medium,
        marginBottom: SPACING.xl,
    },
    earningsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    earningsLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
    earningsAmount: { fontSize: 40, fontWeight: '900', color: COLORS.white, marginBottom: 20 },
    earningsFooter: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, padding: 15 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: COLORS.white, opacity: 0.8 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
    dividerV: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
    sectionSubtitle: { fontSize: 13, color: COLORS.grey },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: SPACING.xl },
    actionCard: {
        width: (width - SPACING.lg * 2 - 12) / 2,
        backgroundColor: COLORS.technicianBg,
        borderRadius: 20,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.technicianAccent,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    actionText: { fontSize: 14, fontWeight: '600', color: COLORS.technicianDark },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: SPACING.md,
        marginTop: SPACING.lg,
    },
    logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.error },
});
