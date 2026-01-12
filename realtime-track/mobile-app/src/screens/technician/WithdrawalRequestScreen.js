import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';
import axios from 'axios';

export default function WithdrawalRequestScreen({ navigation }) {
    const [amount, setAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank' or 'upi'
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        branchName: ''
    });
    const [upiId, setUpiId] = useState('');
    const [walletInfo, setWalletInfo] = useState({ balance: 0, lockedAmount: 0, commissionDue: 0, kycVerified: false, adminVerified: false });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isIFSCValidating, setIsIFSCValidating] = useState(false);

    useEffect(() => {
        fetchWalletInfo();
    }, []);

    const fetchWalletInfo = async () => {
        try {
            const result = await technicianService.getWallet();
            const dashResult = await technicianService.getTechnicianDashboard();
            const userData = await technicianService.getUserData();

            if (result.success) {
                setWalletInfo({
                    balance: result.balance,
                    lockedAmount: result.lockedAmount || 0,
                    commissionDue: result.commissionDue,
                    kycVerified: result.kycVerified || false,
                    adminVerified: result.adminVerified || false
                });

                // Pre-fill bank details if available
                const existingBank = dashResult?.data?.wallet?.bankDetails || dashResult?.technician?.verification?.bankDetails || {};
                setBankDetails(prev => ({
                    ...prev,
                    ...existingBank,
                    accountHolderName: existingBank.accountHolderName || userData?.name || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching wallet info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIFSCChange = async (val) => {
        const code = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setBankDetails({ ...bankDetails, ifscCode: code });

        if (code.length === 11) {
            fetchBankInfo(code);
        }
    };

    const fetchBankInfo = async (ifsc) => {
        setIsIFSCValidating(true);
        try {
            const response = await axios.get(`https://ifsc.razorpay.com/${ifsc}`);
            if (response.data) {
                setBankDetails(prev => ({
                    ...prev,
                    bankName: response.data.BANK,
                    branchName: response.data.BRANCH
                }));
            }
        } catch (error) {
            console.log('IFSC lookup failed');
            setBankDetails(prev => ({
                ...prev,
                bankName: '',
                branchName: ''
            }));
        } finally {
            setIsIFSCValidating(false);
        }
    };

    const getValidationMessage = () => {
        const numAmount = parseFloat(amount);
        if (!amount) return 'Enter withdrawal amount';
        if (numAmount < 100) return 'Minimum withdrawal is ₹100';
        if (numAmount > walletInfo.balance) return 'Insufficient wallet balance';
        // KYC check removed to allow submission for admin verification
        if (walletInfo.commissionDue > 0) return 'Clear company dues first';

        if (payoutMethod === 'upi') {
            if (upiId.length < 3) return 'Enter UPI ID';
            if (!upiId.includes('@')) return 'Invalid UPI ID format (@ missing)';
        } else {
            if (bankDetails.accountNumber.length < 9) return 'Account number must be 9-18 digits';
            if (bankDetails.ifscCode.length !== 11) return 'IFSC must be 11 characters';
            if (bankDetails.accountHolderName.trim().length < 3) return 'Enter full account holder name';
        }
        return null;
    };

    const isFormValid = () => {
        return getValidationMessage() === null;
    };

    const handleSubmit = async () => {
        const msg = getValidationMessage();
        if (msg) {
            Alert.alert('Details Required', msg);
            return;
        }

        const withdrawalAmount = parseFloat(amount);
        setSubmitting(true);
        try {
            const payload = {
                amount: withdrawalAmount,
                payoutMethod,
                bankDetails: payoutMethod === 'bank' ? bankDetails : undefined,
                upiId: payoutMethod === 'upi' ? upiId : undefined
            };

            const enhancedResult = await technicianService.withdrawMoneyEnhanced(payload);

            if (enhancedResult.success) {
                Alert.alert(
                    'Request Submitted',
                    'Your payout request has been sent for verification. Status will update in 24-48h.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Submission Failed', enhancedResult.message || 'Check your details and try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to reach payment server.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.technicianPrimary} />
            </View>
        );
    }

    const canSubmit = isFormValid() && !submitting && walletInfo.commissionDue === 0 && walletInfo.kycVerified;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>REQUEST PAYOUT</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Warning Banner replacing Blocker */}
                    {(!walletInfo.kycVerified || !walletInfo.adminVerified || walletInfo.commissionDue > 0) && (
                        <View style={[styles.blockerCard, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '30' }]}>
                            <Ionicons name="information-circle-outline" size={32} color={COLORS.warning} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.blockerTitle, { color: COLORS.warning }]}>
                                    {!walletInfo.kycVerified ? 'KYC Required' :
                                        !walletInfo.adminVerified ? 'Payout Verification' :
                                            'Dues Pending'}
                                </Text>
                                <Text style={styles.blockerText}>
                                    {!walletInfo.kycVerified
                                        ? 'Please complete your KYC documents and wait for approval.'
                                        : !walletInfo.adminVerified
                                            ? 'Your account is being verified for payouts by Admin.'
                                            : `Clear Commission Dues (₹${walletInfo.commissionDue})`}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.summaryContainer}>
                        <View style={styles.balanceSummary}>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                            <Text style={styles.balanceValue}>₹{walletInfo.balance.toLocaleString()}</Text>
                        </View>
                        {walletInfo.lockedAmount > 0 && (
                            <View style={styles.lockedSummary}>
                                <Ionicons name="lock-closed" size={16} color={COLORS.grey} />
                                <Text style={styles.lockedText}>Processing: ₹{walletInfo.lockedAmount.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
                        <View style={styles.amountBox}>
                            <Text style={styles.currency}>₹</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.sectionTitle}>Payout Method</Text>
                        <View style={styles.methodToggle}>
                            <TouchableOpacity
                                style={[styles.methodBtn, payoutMethod === 'bank' && styles.activeMethod]}
                                onPress={() => setPayoutMethod('bank')}
                            >
                                <Ionicons name="business-outline" size={20} color={payoutMethod === 'bank' ? COLORS.white : COLORS.grey} />
                                <Text style={[styles.methodText, payoutMethod === 'bank' && styles.activeMethodText]}>Bank</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodBtn, payoutMethod === 'upi' && styles.activeMethod]}
                                onPress={() => setPayoutMethod('upi')}
                            >
                                <Ionicons name="send-outline" size={20} color={payoutMethod === 'upi' ? COLORS.white : COLORS.grey} />
                                <Text style={[styles.methodText, payoutMethod === 'upi' && styles.activeMethodText]}>UPI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {payoutMethod === 'upi' ? (
                        <View style={styles.inputSection}>
                            <Text style={styles.fieldLabel}>UPI ID (VPA)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="username@bank"
                                value={upiId}
                                onChangeText={setUpiId}
                                autoCapitalize="none"
                            />
                            <Text style={styles.hintText}>Example: 9876543210@ybl</Text>
                        </View>
                    ) : (
                        <View style={styles.inputSection}>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>IFSC Code</Text>
                                <View style={styles.ifscContainer}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="SBIN0001234"
                                        value={bankDetails.ifscCode}
                                        onChangeText={handleIFSCChange}
                                        autoCapitalize="characters"
                                        maxLength={11}
                                    />
                                    {isIFSCValidating && <ActivityIndicator size="small" color={COLORS.technicianPrimary} />}
                                </View>
                                {bankDetails.bankName ? (
                                    <Text style={styles.bankTag}>{bankDetails.bankName} - {bankDetails.branchName}</Text>
                                ) : null}
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Account Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your account number"
                                    value={bankDetails.accountNumber}
                                    onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text })}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Account Holder Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name as per Passbook"
                                    value={bankDetails.accountHolderName}
                                    onChangeText={(text) => setBankDetails({ ...bankDetails, accountHolderName: text })}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    {!canSubmit && (amount !== '' || isFormValid()) && (
                        <Text style={styles.validationText}>
                            {getValidationMessage() || 'Ready to submit'}
                        </Text>
                    )}
                    <TouchableOpacity
                        style={[styles.mainBtn, !canSubmit && styles.mainBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {submitting ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.mainBtnText}>SUBMIT PAYOUT REQUEST</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: SPACING.lg },
    blockerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.error + '10',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        gap: 15,
        borderWidth: 1,
        borderColor: COLORS.error + '20'
    },
    blockerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.error },
    blockerText: { fontSize: 13, color: COLORS.black, marginTop: 2 },
    balanceSummary: {
        backgroundColor: COLORS.technicianPrimary,
        borderRadius: 25,
        padding: 24,
        alignItems: 'center',
        marginBottom: 25,
        ...SHADOWS.medium
    },
    balanceLabel: { color: COLORS.white, opacity: 0.8, fontSize: 14, marginBottom: 5 },
    balanceValue: { color: COLORS.white, fontSize: 32, fontWeight: '900' },
    summaryContainer: { marginBottom: 25 },
    lockedSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.greyLight,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: -15,
        marginHorizontal: 40,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.greyLight
    },
    lockedText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
    inputSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 15 },
    amountBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.greyLight,
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 10
    },
    currency: { fontSize: 24, fontWeight: 'bold', color: COLORS.technicianPrimary, marginRight: 10 },
    amountInput: { flex: 1, fontSize: 32, fontWeight: '800', color: COLORS.black },
    methodToggle: { flexDirection: 'row', gap: 12 },
    methodBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 15,
        backgroundColor: COLORS.greyLight,
        gap: 10
    },
    activeMethod: { backgroundColor: COLORS.technicianPrimary },
    methodText: { fontWeight: 'bold', color: COLORS.grey },
    activeMethodText: { color: COLORS.white },
    fieldGroup: { marginBottom: 15 },
    fieldLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.grey, marginBottom: 8, marginLeft: 5 },
    input: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: COLORS.black,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    ifscContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bankTag: { fontSize: 12, color: COLORS.technicianPrimary, fontWeight: 'bold', marginTop: 5, marginLeft: 5 },
    hintText: { fontSize: 11, color: COLORS.grey, marginTop: 5, marginLeft: 5 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.greyLight },
    mainBtn: {
        backgroundColor: COLORS.technicianPrimary,
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        ...SHADOWS.medium
    },
    mainBtnDisabled: { backgroundColor: COLORS.grey, opacity: 0.5 },
    mainBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    validationText: { textAlign: 'center', color: COLORS.error, fontSize: 12, marginBottom: 10, fontWeight: '600' }
});
