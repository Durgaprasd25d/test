import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import config from '../../constants/config';
import technicianService from '../../services/technicianService';

const DOCUMENT_TYPES = [
    { id: 'aadhaarFront', label: 'Aadhaar Card - Front', icon: 'card-outline' },
    { id: 'aadhaarBack', label: 'Aadhaar Card - Back', icon: 'card-outline' },
    { id: 'panCard', label: 'PAN Card', icon: 'newspaper-outline' },
    { id: 'bankProof', label: 'Bank Passbook / Cheque', icon: 'business-outline' },
    { id: 'selfie', label: 'Selfie with Face Visible', icon: 'person-outline', isSelfie: true }
];

export default function KYCScreen({ navigation }) {
    const [kycData, setKycData] = useState({
        aadhaarFront: { url: '', publicId: '', uploading: false },
        aadhaarBack: { url: '', publicId: '', uploading: false },
        panCard: { url: '', publicId: '', uploading: false },
        bankProof: { url: '', publicId: '', uploading: false },
        selfie: { url: '', publicId: '', uploading: false }
    });
    const [status, setStatus] = useState('NOT_STARTED'); // 'NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await technicianService.getKYCStatus();
            if (res.success) {
                setStatus(res.kycStatus);
                setRejectionReason(res.rejectionReason || '');
                if (res.documents) {
                    const updatedKyc = { ...kycData };
                    Object.keys(res.documents).forEach(key => {
                        if (res.documents[key]) {
                            updatedKyc[key] = {
                                url: res.documents[key].url || '',
                                publicId: res.documents[key].publicId || '',
                                uploading: false
                            };
                        }
                    });
                    setKycData(updatedKyc);
                }
            }
        } catch (error) {
            console.error('Error fetching KYC status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async (docId, isSelfie = false) => {
        if (status === 'PENDING' || status === 'VERIFIED') return;

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow camera access to upload documents.");
            return;
        }

        let result;
        if (isSelfie) {
            result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
        } else {
            // Option to choose between library and camera
            Alert.alert(
                "Upload Document",
                "Choose an option",
                [
                    { text: "Camera", onPress: () => takePhoto(docId) },
                    { text: "Gallery", onPress: () => pickFromGallery(docId) },
                    { text: "Cancel", style: "cancel" }
                ]
            );
            return;
        }

        if (!result.canceled) {
            uploadToCloudinary(docId, result.assets[0].uri);
        }
    };

    const takePhoto = async (docId) => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.6,
        });
        if (!result.canceled) uploadToCloudinary(docId, result.assets[0].uri);
    };

    const pickFromGallery = async (docId) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.6,
        });
        if (!result.canceled) uploadToCloudinary(docId, result.assets[0].uri);
    };

    const uploadToCloudinary = async (docId, uri) => {
        setKycData(prev => ({
            ...prev,
            [docId]: { ...prev[docId], uploading: true }
        }));

        try {
            const data = new FormData();

            // On React Native, the file object in FormData needs these 3 properties
            data.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: `${docId}.jpg`
            });
            data.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);
            data.append('cloud_name', config.CLOUDINARY_CLOUD_NAME);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.secure_url) {
                setKycData(prev => ({
                    ...prev,
                    [docId]: {
                        url: result.secure_url,
                        publicId: result.public_id,
                        uploading: false
                    }
                }));
            } else {
                console.error('Cloudinary Error:', result);
                const errorMsg = result.error?.message || 'Upload failed';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Upload catch error:', error);
            Alert.alert("Upload Error", `Failed to upload image: ${error.message}. Please try again.`);
            setKycData(prev => ({
                ...prev,
                [docId]: { ...prev[docId], uploading: false }
            }));
        }
    };

    const handleSubmit = async () => {
        const missingDocs = DOCUMENT_TYPES.filter(doc => !kycData[doc.id].url);
        if (missingDocs.length > 0) {
            Alert.alert("Documents Missing", "Please upload all required documents before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                documents: {
                    aadhaarFront: { url: kycData.aadhaarFront.url, publicId: kycData.aadhaarFront.publicId },
                    aadhaarBack: { url: kycData.aadhaarBack.url, publicId: kycData.aadhaarBack.publicId },
                    panCard: { url: kycData.panCard.url, publicId: kycData.panCard.publicId },
                    bankProof: { url: kycData.bankProof.url, publicId: kycData.bankProof.publicId },
                    selfie: { url: kycData.selfie.url, publicId: kycData.selfie.publicId }
                }
            };

            const res = await technicianService.submitKYC(payload);
            if (res.success) {
                Alert.alert(
                    "Submitted",
                    "Your documents have been sent for verification. This usually takes 24-48 hours.",
                    [{ text: "OK", onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert("Error", res.error || "Submission failed");
            }
        } catch (error) {
            Alert.alert("Error", "Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.technicianPrimary} />
            </View>
        );
    }

    const isLocked = status === 'PENDING' || status === 'VERIFIED';
    const allUploaded = DOCUMENT_TYPES.every(doc => kycData[doc.id].url);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC DOCUMENTS</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {status === 'REJECTED' && (
                    <View style={styles.rejectionBox}>
                        <Ionicons name="warning" size={20} color={COLORS.error} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rejectionTitle}>KYC Rejected</Text>
                            <Text style={styles.rejectionText}>{rejectionReason || 'Please re-upload and submit again.'}</Text>
                        </View>
                    </View>
                )}

                {status === 'PENDING' && (
                    <View style={[styles.statusBox, { backgroundColor: COLORS.warning + '15' }]}>
                        <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                        <Text style={[styles.statusText, { color: COLORS.warning }]}>Verification in progress...</Text>
                    </View>
                )}

                {status === 'VERIFIED' && (
                    <View style={[styles.statusBox, { backgroundColor: COLORS.success + '15' }]}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={[styles.statusText, { color: COLORS.success }]}>Account Verified</Text>
                    </View>
                )}

                <Text style={styles.mainTitle}>Verification Photos</Text>
                <Text style={styles.subTitle}>Upload clear photos for faster approval.</Text>

                <View style={styles.docList}>
                    {DOCUMENT_TYPES.map((doc) => (
                        <View key={doc.id} style={styles.docItem}>
                            <View style={styles.docLabelContainer}>
                                <Ionicons name={doc.icon} size={20} color={COLORS.grey} />
                                <Text style={styles.docLabel}>{doc.label}</Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.uploadBox,
                                    kycData[doc.id].url && styles.uploadedBox,
                                    isLocked && styles.disabledBox
                                ]}
                                onPress={() => handlePickImage(doc.id, doc.isSelfie)}
                                disabled={isLocked || kycData[doc.id].uploading}
                            >
                                {kycData[doc.id].uploading ? (
                                    <ActivityIndicator color={COLORS.technicianPrimary} />
                                ) : kycData[doc.id].url ? (
                                    <View style={styles.previewContainer}>
                                        <Image source={{ uri: kycData[doc.id].url }} style={styles.preview} />
                                        {!isLocked && (
                                            <View style={styles.editOverlay}>
                                                <Ionicons name="camera" size={20} color={COLORS.white} />
                                                <Text style={styles.editText}>Change</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.emptyBox}>
                                        <Ionicons name="cloud-upload-outline" size={32} color={COLORS.grey} />
                                        <Text style={styles.uploadText}>Tap to Upload</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {!isLocked && (
                    <TouchableOpacity
                        style={[styles.submitBtn, (!allUploaded || isSubmitting) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={!allUploaded || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.submitBtnText}>SUBMIT FOR VERIFICATION</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.greyLight },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, letterSpacing: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: SPACING.lg },
    mainTitle: { fontSize: 22, fontWeight: '900', color: COLORS.black, marginTop: 10 },
    subTitle: { fontSize: 14, color: COLORS.grey, marginBottom: 25 },
    docList: { gap: 20 },
    docItem: { gap: 10 },
    docLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 5 },
    docLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.black },
    uploadBox: { height: 160, borderRadius: 20, backgroundColor: COLORS.greyLight, borderStyle: 'dashed', borderWidth: 1.5, borderColor: COLORS.grey, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadedBox: { borderStyle: 'solid', borderColor: COLORS.technicianPrimary + '30' },
    disabledBox: { opacity: 0.8 },
    previewContainer: { width: '100%', height: '100%' },
    preview: { width: '100%', height: '100%', resizeMode: 'cover' },
    emptyBox: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 12, color: COLORS.grey, fontWeight: 'bold' },
    editOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    editText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
    rejectionBox: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.error + '10', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.error + '20' },
    rejectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.error },
    rejectionText: { fontSize: 13, color: COLORS.black, marginTop: 2 },
    statusBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 20 },
    statusText: { fontSize: 14, fontWeight: 'bold' },
    submitBtn: { backgroundColor: COLORS.technicianPrimary, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 30, ...SHADOWS.medium },
    submitBtnDisabled: { backgroundColor: COLORS.grey, opacity: 0.5 },
    submitBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
