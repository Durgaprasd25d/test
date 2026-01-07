import { Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import ToggleSwitch from '../../components/ToggleSwitch';
import JobCard from '../../components/JobCard';
import JobRequestSheet from '../../components/JobRequestSheet';
import technicianService from '../../services/technicianService';
import authService from '../../services/authService';
import config from '../../constants/config';
import technicianSocketService from '../../services/technicianSocketService';
import rideService from '../../services/rideService';
import ServicesListSheet from '../../components/ServicesListSheet';

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
    const [wallet, setWallet] = useState({ balance: 0, commissionDue: 0, codLimit: 500 });
    const [showServicesSheet, setShowServicesSheet] = useState(false);
    const [kycStatus, setKycStatus] = useState('LOADING');

    useEffect(() => {
        const initDashboard = async () => {
            const userData = await authService.getUser();
            setUser(userData);
            const userId = userData?.id || userData?._id;

            // Connect to socket for job notifications with userId for private rooms
            technicianSocketService.connect(userId, handleJobRequest, handleJobCancelled, handleSocketConnection, handleJobCompleted);

            loadDashboardData();
        };

        initDashboard();

        // Refresh data when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('🔄 Dashboard focused - refreshing data...');
            loadDashboardData();
        });

        return () => {
            unsubscribe();
            technicianSocketService.disconnect();
        };
    }, [navigation]);

    const handleSocketConnection = (status) => {
        console.log('Socket status:', status);
        setSocketConnected(status === 'connected');
    };

    const handleJobCancelled = (data) => {
        console.log('❌ Job cancelled handler:', data);

        // If the pending job in the modal is cancelled
        if (pendingJob && pendingJob.rideId === data.rideId) {
            setShowJobModal(false);
            setPendingJob(null);
            Alert.alert('Job Cancelled', 'The customer has cancelled this job request.');
        }

        // If the active job is cancelled
        if (activeJob && activeJob.id === data.rideId) {
            setActiveJob(null);
            loadDashboardData();
            Alert.alert('Active Job Cancelled', 'Your current job has been cancelled by the customer.');
        }

        // Always refresh the dashboard data to ensure consistency
        loadDashboardData();
    };

    const handleJobCompleted = (data) => {
        console.log('✅ Job completed handler:', data);
        if (activeJob && activeJob.id === data.rideId) {
            setActiveJob(null);
            loadDashboardData();
        }
    };

    const handleJobRequest = (jobData) => {
        console.log('📋 New job request:', jobData);

        // Uber-style filtering: Don't show COD jobs if over limit
        if (jobData.paymentMethod === 'COD' && wallet.commissionDue >= wallet.codLimit) {
            console.log('🛑 COD job filtered out due to high dues (₹' + wallet.commissionDue + ')');
            return;
        }

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

    const handleDeclineJob = () => {
        setShowJobModal(false);
        setPendingJob(null);
    };

    const handleAcceptFromList = async (job) => {
        setShowServicesSheet(false);

        try {
            const technicianData = await authService.getUser();
            const driverId = technicianData?.id || technicianData?._id;

            const response = await fetch(`${config.BACKEND_URL}/api/ride/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rideId: job.rideId,
                    driverId: driverId
                })
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert('Success', 'Job accepted successfully!');
                loadDashboardData(); // Refresh dashboard data
            } else {
                Alert.alert('Error', result.error || result.message || 'Failed to accept job');
            }
        } catch (error) {
            console.error('Accept job error:', error);
            Alert.alert('Error', 'Failed to accept job');
        }
    };

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    const loadDashboardData = async () => {
        try {
            const userId = user?.id || user?._id;
            const response = await technicianService.getTechnicianDashboard(userId);

            if (response.success) {
                setTodayEarnings(response.data.todayEarnings);
                setCompletedJobs(response.data.completedJobs);
                setActiveJob(response.data.activeJob);
                setIsOnline(response.data.isOnline);
                setWallet(response.data.wallet);
            }

            // Also load KYC status
            const kycRes = await technicianService.getKYCStatus();
            if (kycRes.success) {
                setKycStatus(kycRes.kycStatus);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnline = async (value) => {
        if (value && kycStatus !== 'VERIFIED') {
            Alert.alert(
                "KYC Verification Required",
                "Please complete your KYC and wait for admin approval before going online.",
                [
                    { text: "Complete KYC", onPress: () => navigation.navigate('TechnicianProfile') },
                    { text: "Later", style: "cancel" }
                ]
            );
            return;
        }

        try {
            const result = await technicianService.updateOnlineStatus(value);
            if (result.success) {
                setIsOnline(value);
            }
        } catch (error) {
            console.error('Toggle online error:', error);
            Alert.alert('Error', 'Failed to update status');
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
                {kycStatus !== 'VERIFIED' ? (
                    <View style={styles.restrictedContainer}>
                        <View style={styles.kycMissingCard}>
                            <View style={styles.kycIconContainer}>
                                <Ionicons
                                    name={kycStatus === 'REJECTED' ? "alert-circle" : kycStatus === 'PENDING' ? "time" : "shield-checkmark"}
                                    size={40}
                                    color={kycStatus === 'REJECTED' ? COLORS.error : kycStatus === 'PENDING' ? COLORS.warning : COLORS.technicianPrimary}
                                />
                            </View>
                            <Text style={styles.kycTitle}>
                                {kycStatus === 'REJECTED' ? 'KYC Rejected' : kycStatus === 'PENDING' ? 'Verification Pending' : 'KYC Required'}
                            </Text>
                            <Text style={styles.kycDesc}>
                                {kycStatus === 'REJECTED'
                                    ? 'Some documents were rejected. Please re-upload them in your profile.'
                                    : kycStatus === 'PENDING'
                                        ? 'Your documents are under review. This usually takes 24-48 hours.'
                                        : 'Please complete your KYC verification to start accepting jobs and earning.'}
                            </Text>
                            <TouchableOpacity
                                style={styles.kycBtn}
                                onPress={() => navigation.navigate('TechnicianProfile')}
                            >
                                <Text style={styles.kycBtnText}>GO TO PROFILE / KYC</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Account Actions</Text>
                        </View>
                        <View style={styles.actionGrid}>
                            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicianProfile')}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="person-outline" size={24} color={COLORS.technicianPrimary} />
                                </View>
                                <Text style={styles.actionText}>Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionCard, { opacity: 0.5 }]} disabled>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="wallet-outline" size={24} color={COLORS.grey} />
                                </View>
                                <Text style={[styles.actionText, { color: COLORS.grey }]}>Wallet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {/* COD Limit Warning */}
                        {wallet.commissionDue >= wallet.codLimit && (
                            <View style={styles.warningBanner}>
                                <Ionicons name="warning" size={20} color={COLORS.white} />
                                <Text style={styles.warningText}>
                                    COD Jobs Disabled! Clear ₹{wallet.commissionDue} dues to resume.
                                </Text>
                            </View>
                        )}

                        {wallet.commissionDue > 0 && wallet.commissionDue < wallet.codLimit && (
                            <View style={[styles.warningBanner, { backgroundColor: COLORS.warning }]}>
                                <Ionicons name="information-circle" size={20} color={COLORS.white} />
                                <Text style={styles.warningText}>
                                    ₹{wallet.commissionDue} pending commission. Limit: ₹{wallet.codLimit}
                                </Text>
                            </View>
                        )}
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

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TechnicianHistory')}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="list-outline" size={24} color={COLORS.technicianPrimary} />
                                </View>
                                <Text style={styles.actionText}>View All</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} onPress={() => setShowServicesSheet(true)}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="briefcase-outline" size={24} color={COLORS.technicianPrimary} />
                                </View>
                                <Text style={styles.actionText}>Services</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
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
                        </View>

                        <TouchableOpacity style={[styles.actionCard, { width: '100%', marginTop: 12, flexDirection: 'row', justifyContent: 'flex-start' }]} onPress={() => navigation.navigate('TechnicianProfile')}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="person-outline" size={24} color={COLORS.technicianPrimary} />
                            </View>
                            <Text style={[styles.actionText, { marginLeft: 15 }]}>Detailed Profile Settings</Text>
                        </TouchableOpacity>
                    </>
                )}

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

            {/* Floating Active Job Button */}
            {activeJob && (
                <TouchableOpacity
                    style={styles.floatingActiveBtn}
                    onPress={() => navigation.navigate('TechnicianNavigation', {
                        rideId: activeJob.id,
                        destination: activeJob.pickup,
                        serviceType: activeJob.serviceType
                    })}
                >
                    <View style={styles.floatingContent}>
                        <View style={styles.floatingIcon}>
                            <Ionicons name="navigate" size={24} color={COLORS.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.floatingStatus}>ONGOING SERVICE</Text>
                            <Text style={styles.floatingTitle} numberOfLines={1}>
                                {activeJob.serviceType.toUpperCase()} • {activeJob.pickup?.address || 'Location'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
            )}

            {/* Job Request Bottom Sheet */}
            <JobRequestSheet
                visible={showJobModal}
                jobData={pendingJob}
                onAccept={handleAcceptJob}
                onReject={handleDeclineJob}
            />

            {/* Services List Bottom Sheet */}
            <ServicesListSheet
                visible={showServicesSheet}
                onClose={() => setShowServicesSheet(false)}
                technicianId={user?.id || user?._id}
                onAcceptJob={handleAcceptFromList}
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
    logoutText: { fontSize: 16, fontWeight: 'bold', color: COLORS.error },
    restrictedContainer: { flex: 1, paddingTop: SPACING.md },
    kycMissingCard: {
        backgroundColor: COLORS.white,
        borderRadius: 30,
        padding: 25,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.technicianAccent,
        ...SHADOWS.medium,
        marginBottom: 30
    },
    kycIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.technicianBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    kycTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, marginBottom: 8 },
    kycDesc: { fontSize: 14, color: COLORS.grey, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    kycBtn: {
        backgroundColor: COLORS.technicianPrimary,
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 15,
        ...SHADOWS.small
    },
    kycBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.error,
        marginBottom: SPACING.lg,
        gap: 10,
    },
    warningText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    floatingActiveBtn: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 20,
        padding: 15,
        ...SHADOWS.large,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    floatingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    floatingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingStatus: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.white,
        opacity: 0.8,
        letterSpacing: 1,
    },
    floatingTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.white,
        marginTop: 2,
    },
});
