import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import rideService from '../../services/rideService';

const PREMIUM_COLORS = {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    success: '#22c55e',
    slate: '#0f172a',
    background: '#f8fafc',
    white: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
};

export default function ReceiptScreen({ route, navigation }) {
    const { rideId } = route.params;
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const receiptRef = useRef();

    useEffect(() => {
        fetchReceiptData();
    }, []);

    const fetchReceiptData = async () => {
        setLoading(true);
        const result = await rideService.getReceipt(rideId);
        if (result.success) {
            setReceiptData(result.data);
        } else {
            Alert.alert('Error', result.error || 'Failed to load receipt');
        }
        setLoading(false);
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);

            // Capture the receipt as image
            const uri = await receiptRef.current.capture();

            // Save to file system
            const filename = `receipt_${receiptData.bookingId}_${Date.now()}.png`;
            const fileUri = FileSystem.documentDirectory + filename;

            await FileSystem.moveAsync({
                from: uri,
                to: fileUri
            });

            // Share the file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Receipt'
                });
            } else {
                Alert.alert('Success', 'Receipt saved successfully!');
            }

            setDownloading(false);
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download receipt');
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!receiptData) return;

        const message = `
🧾 Receipt - ${receiptData.company.name}

Service: ${receiptData.serviceType?.toUpperCase() || 'AC'} SERVICE
Booking ID: #${receiptData.bookingId?.substring(0, 10).toUpperCase()}
Date: ${new Date(receiptData.bookingDate).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
BILLING DETAILS
━━━━━━━━━━━━━━━━━━━━
Service Charge: ₹${receiptData.billing.serviceCharge}
Platform Fee: ₹${receiptData.billing.platformFee}
GST (${receiptData.billing.gstPercentage}%): ₹${receiptData.billing.gst}

Total Amount: ₹${receiptData.billing.totalAmount}
━━━━━━━━━━━━━━━━━━━━

Payment: ${receiptData.payment.method} - ${receiptData.payment.status}
Location: ${receiptData.location || 'N/A'}

${receiptData.company.website}
        `.trim();

        try {
            await Share.share({ message });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={PREMIUM_COLORS.primary} />
                    <Text style={styles.loaderText}>Generating receipt...</Text>
                </View>
            </View>
        );
    }

    if (!receiptData) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loaderContainer}>
                    <Ionicons name="document-text-outline" size={60} color={PREMIUM_COLORS.textMuted} />
                    <Text style={styles.errorText}>Receipt not found</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={PREMIUM_COLORS.textMain} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerTitle}>Receipt</Text>
                            <Text style={styles.headerSub}>Tax Invoice</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.downloadBtn}
                            onPress={handleDownload}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color={PREMIUM_COLORS.primary} />
                            ) : (
                                <Ionicons name="download-outline" size={24} color={PREMIUM_COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Thermal Receipt for Capture */}
                <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1.0 }}>
                    <View style={styles.thermalReceipt}>
                        {/* Header */}
                        <View style={styles.thermalHeader}>
                            <Text style={styles.thermalCompanyName}>{receiptData.company.name}</Text>
                            <Text style={styles.thermalSubtext}>Service Receipt</Text>
                            <Text style={styles.thermalSubtext}>{receiptData.company.website}</Text>
                            <Text style={styles.thermalSubtext}>{receiptData.company.phone}</Text>
                        </View>

                        <Text style={styles.thermalDivider}>{'='.repeat(40)}</Text>

                        {/* Booking Details */}
                        <View style={styles.thermalSection}>
                            <Text style={styles.thermalLabel}>Receipt No: #{receiptData.bookingId?.substring(0, 12).toUpperCase()}</Text>
                            <Text style={styles.thermalLabel}>
                                Date: {new Date(receiptData.bookingDate).toLocaleString('en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                            <Text style={styles.thermalLabel}>Service: {receiptData.serviceType?.toUpperCase()}</Text>
                        </View>

                        <Text style={styles.thermalDivider}>{'-'.repeat(40)}</Text>

                        {/* Customer Info */}
                        {receiptData.customer?.name && (
                            <>
                                <View style={styles.thermalSection}>
                                    <Text style={styles.thermalLabel}>Customer: {receiptData.customer.name}</Text>
                                    <Text style={styles.thermalLabel}>Phone: {receiptData.customer.phone}</Text>
                                    <Text style={styles.thermalLabel} numberOfLines={2}>Location: {receiptData.location}</Text>
                                </View>
                                <Text style={styles.thermalDivider}>{'-'.repeat(40)}</Text>
                            </>
                        )}

                        {/* Billing */}
                        <View style={styles.thermalSection}>
                            <View style={styles.thermalRow}>
                                <Text style={styles.thermalItem}>Service Charge</Text>
                                <Text style={styles.thermalPrice}>₹ {receiptData.billing.serviceCharge}</Text>
                            </View>
                            <View style={styles.thermalRow}>
                                <Text style={styles.thermalItem}>Platform Fee</Text>
                                <Text style={styles.thermalPrice}>₹ {receiptData.billing.platformFee}</Text>
                            </View>
                            <View style={styles.thermalRow}>
                                <Text style={styles.thermalItem}>GST ({receiptData.billing.gstPercentage}%)</Text>
                                <Text style={styles.thermalPrice}>₹ {receiptData.billing.gst}</Text>
                            </View>
                        </View>

                        <Text style={styles.thermalDivider}>{'='.repeat(40)}</Text>

                        {/* Total */}
                        <View style={styles.thermalTotal}>
                            <Text style={styles.thermalTotalLabel}>TOTAL AMOUNT</Text>
                            <Text style={styles.thermalTotalValue}>₹ {receiptData.billing.totalAmount}</Text>
                        </View>

                        <Text style={styles.thermalDivider}>{'='.repeat(40)}</Text>

                        {/* Payment Info */}
                        <View style={styles.thermalSection}>
                            <Text style={styles.thermalLabel}>Payment: {receiptData.payment.method}</Text>
                            <Text style={styles.thermalLabel}>Status: {receiptData.payment.status}</Text>
                            {receiptData.payment.transactionId && (
                                <Text style={styles.thermalLabel} numberOfLines={1}>
                                    Txn ID: {receiptData.payment.transactionId.substring(0, 24)}
                                </Text>
                            )}
                        </View>

                        <Text style={styles.thermalDivider}>{'-'.repeat(40)}</Text>

                        {/* QR Code */}
                        <View style={styles.thermalQR}>
                            <QRCode
                                value={receiptData.company.website}
                                size={100}
                                color="#000000"
                                backgroundColor="#ffffff"
                            />
                            <Text style={styles.thermalQRText}>Scan for more info</Text>
                        </View>

                        {/* Footer */}
                        <View style={styles.thermalFooter}>
                            <Text style={styles.thermalFooterText}>Thank you for choosing {receiptData.company.name}</Text>
                            <Text style={styles.thermalFooterText}>Visit: {receiptData.company.website}</Text>
                            <Text style={styles.thermalFooterText}>━━━━━━━━━━━━━━━━━━━━</Text>
                        </View>
                    </View>
                </ViewShot>

                {/* Action Buttons */}
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownload}
                    activeOpacity={0.8}
                    disabled={downloading}
                >
                    <LinearGradient
                        colors={[PREMIUM_COLORS.primary, PREMIUM_COLORS.secondary]}
                        style={styles.downloadGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {downloading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="download" size={20} color={COLORS.white} />
                                <Text style={styles.downloadButtonText}>Download Receipt</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    activeOpacity={0.8}
                >
                    <Ionicons name="share-social-outline" size={18} color={PREMIUM_COLORS.primary} />
                    <Text style={styles.shareButtonText}>Share as Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.homeButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PREMIUM_COLORS.background,
    },
    header: {
        paddingBottom: 20,
        ...SHADOWS.light,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: PREMIUM_COLORS.textMain,
        fontSize: 20,
        fontWeight: '900',
    },
    headerSub: {
        color: PREMIUM_COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    // Thermal Receipt Styles
    thermalReceipt: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    thermalHeader: {
        alignItems: 'center',
        marginBottom: 15,
    },
    thermalCompanyName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
    },
    thermalSubtext: {
        fontSize: 12,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
        marginTop: 2,
    },
    thermalDivider: {
        fontSize: 10,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginVertical: 8,
        textAlign: 'center',
    },
    thermalSection: {
        marginVertical: 8,
    },
    thermalLabel: {
        fontSize: 12,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 4,
    },
    thermalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    thermalItem: {
        fontSize: 12,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        flex: 1,
    },
    thermalPrice: {
        fontSize: 12,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontWeight: 'bold',
    },
    thermalTotal: {
        alignItems: 'center',
        marginVertical: 10,
    },
    thermalTotalLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 4,
    },
    thermalTotalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    thermalQR: {
        alignItems: 'center',
        marginVertical: 15,
    },
    thermalQRText: {
        fontSize: 10,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 8,
    },
    thermalFooter: {
        alignItems: 'center',
        marginTop: 10,
    },
    thermalFooterText: {
        fontSize: 10,
        color: '#000000',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
        marginBottom: 2,
    },

    // Action Buttons
    downloadButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 12,
        ...SHADOWS.medium,
    },
    downloadGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    downloadButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    shareButton: {
        height: 60,
        borderRadius: 18,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: PREMIUM_COLORS.primary,
    },
    homeButton: {
        height: 60,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: PREMIUM_COLORS.textMain,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 16,
        fontSize: 14,
        color: PREMIUM_COLORS.textMuted,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: PREMIUM_COLORS.textMuted,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: PREMIUM_COLORS.primary,
        borderRadius: 12,
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
