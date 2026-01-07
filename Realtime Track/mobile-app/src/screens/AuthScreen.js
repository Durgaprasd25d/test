import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import authService from '../services/authService';
import Logo from '../components/Logo';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
    const [authMode, setAuthMode] = useState('password');
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [role, setRole] = useState('customer');

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const otpInputs = useRef([]);

    const handleSendOtp = async () => {
        if (phoneNumber.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
            return;
        }

        if (isRegistering && !name) {
            Alert.alert('Name Required', 'Please enter your name for registration');
            return;
        }

        setLoading(true);
        try {
            const fullPhoneNumber = `+91${phoneNumber}`;
            const result = await authService.signInWithPhoneNumber(fullPhoneNumber);

            if (result.success) {
                setConfirmation(result.confirmation);
                setIsOtpSent(true);
                setLoading(false);
            } else {
                setLoading(false);
                Alert.alert('Error', result.error || 'Failed to send OTP');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', error.message || 'Failed to send OTP.');
        }
    };

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputs.current[index + 1].focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
            return;
        }
        setLoading(true);
        try {
            const result = await authService.verifyOTP(
                confirmation,
                otpCode,
                isRegistering ? name : null,
                isRegistering ? role : null
            );

            if (result.success) {
                setLoading(false);
                const userRole = result.user?.role || role;
                navigation.replace(userRole === 'technician' ? 'TechnicianDashboard' : 'Home');
            } else {
                setLoading(false);
                Alert.alert('Verification Failed', result.error || 'Incorrect or expired OTP.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'OTP Verification failed.');
        }
    };

    const handlePasswordAction = async () => {
        if (phoneNumber.length < 10) return Alert.alert('Invalid Number', 'Enter 10-digit mobile number');
        if (password.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters');

        setLoading(true);
        try {
            let result;
            if (isRegistering) {
                if (!name) { setLoading(false); return Alert.alert('Name Required', 'Please enter your name'); }
                result = await authService.register({ mobile: phoneNumber, password, name, role });
            } else {
                result = await authService.login(phoneNumber, password);
            }

            if (result.success) {
                setLoading(false);
                const userRole = result.user?.role || role;
                navigation.replace(userRole === 'technician' ? 'TechnicianDashboard' : 'Home');
            } else {
                setLoading(false);
                Alert.alert('Auth Error', result.error);
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={COLORS.roseGoldGradient} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.header}>
                                <Logo size={width * 0.35} color={COLORS.white} />
                                <Text style={styles.brandName}>ZYRO AC</Text>
                                <Text style={styles.tagline}>PREMIUM EVERY DAY</Text>
                            </View>

                            <View style={styles.card}>
                                {!isOtpSent ? (
                                    <>
                                        <View style={styles.tabContainer}>
                                            <TouchableOpacity
                                                style={[styles.tab, authMode === 'password' && styles.activeTab]}
                                                onPress={() => {
                                                    setAuthMode('password');
                                                    setIsOtpSent(false);
                                                }}
                                            >
                                                <Text style={[styles.tabText, authMode === 'password' && styles.activeTabText]}>PASSWORD</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.tab, authMode === 'otp' && styles.activeTab]}
                                                onPress={() => {
                                                    setAuthMode('otp');
                                                    setIsOtpSent(false);
                                                }}
                                            >
                                                <Text style={[styles.tabText, authMode === 'otp' && styles.activeTabText]}>PHONE OTP</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.inputSection}>
                                            {isRegistering && (
                                                <View style={styles.inputWrapper}>
                                                    <Ionicons name="person-outline" size={20} color={COLORS.roseGold} style={styles.icon} />
                                                    <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                                                </View>
                                            )}

                                            {isRegistering && (
                                                <View style={{ marginTop: 12, marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, paddingLeft: 4 }}>
                                                        Select Role
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 1, flexDirection: 'row', alignItems: 'center',
                                                                justifyContent: 'center', gap: 8, padding: 14,
                                                                borderRadius: 12, borderWidth: 2,
                                                                borderColor: role === 'customer' ? '#8D5159' : '#DDD',
                                                                backgroundColor: role === 'customer' ? '#8D5159' : '#FFF',
                                                            }}
                                                            onPress={() => setRole('customer')}
                                                        >
                                                            <Ionicons name="people-outline" size={22}
                                                                color={role === 'customer' ? '#FFF' : '#8D5159'} />
                                                            <Text style={{
                                                                fontSize: 14, fontWeight: '600',
                                                                color: role === 'customer' ? '#FFF' : '#8D5159'
                                                            }}>
                                                                Customer
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={{
                                                                flex: 1, flexDirection: 'row', alignItems: 'center',
                                                                justifyContent: 'center', gap: 8, padding: 14,
                                                                borderRadius: 12, borderWidth: 2,
                                                                borderColor: role === 'technician' ? '#8D5159' : '#DDD',
                                                                backgroundColor: role === 'technician' ? '#8D5159' : '#FFF',
                                                            }}
                                                            onPress={() => setRole('technician')}
                                                        >
                                                            <Ionicons name="construct-outline" size={22}
                                                                color={role === 'technician' ? '#FFF' : '#8D5159'} />
                                                            <Text style={{
                                                                fontSize: 14, fontWeight: '600',
                                                                color: role === 'technician' ? '#FFF' : '#8D5159'
                                                            }}>
                                                                Technician
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}

                                            <View style={styles.inputWrapper}>
                                                <Ionicons name="call-outline" size={20} color={COLORS.roseGold} style={styles.icon} />
                                                <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10} />
                                            </View>

                                            {authMode === 'password' && (
                                                <View style={styles.inputWrapper}>
                                                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.roseGold} style={styles.icon} />
                                                    <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
                                                </View>
                                            )}

                                            <TouchableOpacity
                                                style={styles.mainBtn}
                                                onPress={authMode === 'password' ? handlePasswordAction : handleSendOtp}
                                                disabled={loading}
                                            >
                                                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                                                    <Text style={styles.btnText}>
                                                        {authMode === 'password'
                                                            ? (isRegistering ? 'REGISTER' : 'LOGIN')
                                                            : (isRegistering ? 'REGISTER VIA OTP' : 'SEND OTP')}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                                                <Text style={styles.switchText}>{isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.otpSection}>
                                        <Text style={styles.otpTitle}>Verify OTP</Text>
                                        <Text style={styles.otpSubtitle}>Enter the 6-digit code sent to +91 {phoneNumber}</Text>
                                        <View style={styles.otpContainer}>
                                            {otp.map((digit, idx) => (
                                                <TextInput
                                                    key={idx}
                                                    ref={el => otpInputs.current[idx] = el}
                                                    style={styles.otpInput}
                                                    maxLength={1}
                                                    keyboardType="number-pad"
                                                    value={digit}
                                                    onChangeText={(v) => handleOtpChange(v, idx)}
                                                />
                                            ))}
                                        </View>
                                        <TouchableOpacity style={styles.mainBtn} onPress={handleVerifyOtp} disabled={loading}>
                                            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>VERIFY & CONTINUE</Text>}
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                                            <Text style={styles.switchText}>Change Phone Number</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
    header: { alignItems: 'center', marginBottom: height * 0.05 },
    brandName: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginTop: SPACING.sm, letterSpacing: 4 },
    tagline: { fontSize: 12, color: COLORS.white, opacity: 0.9, letterSpacing: 2 },
    card: { backgroundColor: COLORS.white, borderRadius: 30, padding: SPACING.xl, ...SHADOWS.heavy },
    tabContainer: { flexDirection: 'row', marginBottom: SPACING.xl, backgroundColor: COLORS.greyLight, borderRadius: 15, padding: 4 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: COLORS.white, ...SHADOWS.light },
    tabText: { fontSize: 13, fontWeight: '700', color: COLORS.grey },
    activeTabText: { color: COLORS.roseGold },
    inputSection: { gap: SPACING.md },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greyLight, borderRadius: 15, paddingHorizontal: SPACING.md, height: 56 },
    icon: { marginRight: SPACING.sm },
    input: { flex: 1, fontSize: 16, color: COLORS.black, fontWeight: '500' },
    mainBtn: { backgroundColor: COLORS.roseGold, height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, ...SHADOWS.medium },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    switchText: { textAlign: 'center', marginTop: SPACING.lg, color: COLORS.roseGold, fontWeight: '600', fontSize: 14 },
    otpSection: { alignItems: 'center' },
    otpTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black, marginBottom: SPACING.xs },
    otpSubtitle: { fontSize: 14, color: COLORS.grey, marginBottom: SPACING.xl, textAlign: 'center' },
    otpContainer: { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl },
    otpInput: { width: 40, height: 50, backgroundColor: COLORS.greyLight, borderRadius: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: COLORS.roseGold, borderWidth: 1, borderColor: COLORS.greyMedium },
});
