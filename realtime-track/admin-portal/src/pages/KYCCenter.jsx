import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Eye, AlertCircle, Clock, ExternalLink } from 'lucide-react';

export default function KYCCenter() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTech, setSelectedTech] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState('PENDING'); // 'PENDING' for KYC, 'VERIFIED' for Payouts

    useEffect(() => {
        fetchTechnicians();
    }, [viewMode]);

    const fetchTechnicians = async () => {
        setLoading(true);
        try {
            // If viewMode is VERIFIED, we actually want people who are KYC verified but Payout NOT verified
            const response = await axios.get(`http://127.0.0.1:4000/api/admin/technicians/verification-list`, {
                params: { status: viewMode }
            });
            if (response.data.success) {
                // For payout mode, filter for those with adminVerified false
                if (viewMode === 'VERIFIED') {
                    setTechnicians(response.data.technicians.filter(t => !t.verification?.adminVerified));
                } else {
                    setTechnicians(response.data.technicians);
                }
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId, status) => {
        if (status === 'REJECTED' && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }

        if (!window.confirm(`Are you sure you want to mark this KYC as ${status}?`)) return;

        setIsProcessing(true);
        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/technicians/${userId}/verify-kyc`, {
                status,
                reason: status === 'REJECTED' ? rejectionReason : null
            });

            if (response.data.success) {
                setSelectedTech(null);
                setRejectionReason('');
                fetchTechnicians();
            }
        } catch (error) {
            alert('Operation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayoutVerify = async (userId, isVerified) => {
        if (!window.confirm(`Are you sure you want to ${isVerified ? 'ENABLE' : 'DISABLE'} payouts for this technician?`)) return;

        setIsProcessing(true);
        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/technicians/${userId}/verify-payout`, {
                isVerified
            });

            if (response.data.success) {
                setSelectedTech(null);
                fetchTechnicians();
            }
        } catch (error) {
            alert('Payout verification failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Clock className="animate-spin text-blue-600 mr-2" /> Loading pending reviews...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-800">TRUST & SAFETY CENTER</h1>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setViewMode('PENDING')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'PENDING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        KYC Pending ({viewMode === 'PENDING' ? technicians.length : '...'})
                    </button>
                    <button
                        onClick={() => setViewMode('VERIFIED')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'VERIFIED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Payout Verification ({viewMode === 'VERIFIED' ? technicians.length : '...'})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List of Pending Technicians */}
                <div className="lg:col-span-4 space-y-4">
                    {technicians.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border-2 border-dashed border-slate-200">
                            <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
                            <p className="font-bold text-slate-600">All caught up!</p>
                            <p className="text-sm text-slate-400">No pending KYC requests at the moment.</p>
                        </div>
                    ) : (
                        technicians.map(tech => (
                            <button
                                key={tech._id}
                                onClick={() => setSelectedTech(tech)}
                                className={`w-full text-left p-4 rounded-3xl border-2 transition-all ${selectedTech?._id === tech._id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-white bg-white hover:border-slate-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-slate-900 uppercase">{tech.userId?.name || 'Unknown Tech'}</h3>
                                    <span className="text-xs bg-slate-200 px-2 py-1 rounded-md font-bold text-slate-600">
                                        ID: {tech._id.slice(-6)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-2">{tech.userId?.mobile}</p>
                                <div className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                    <Clock size={12} />
                                    Submitted {new Date(tech.verification?.submittedAt).toLocaleDateString()}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Document Viewer */}
                <div className="lg:col-span-8">
                    {selectedTech ? (
                        <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                            <div className="p-6 border-bottom bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{selectedTech.userId?.name}</h2>
                                    <p className="text-sm text-slate-500">Reviewing documentation for approval</p>
                                </div>
                                <div className="flex gap-2">
                                    {viewMode === 'PENDING' ? (
                                        <button
                                            onClick={() => handleVerify(selectedTech.userId._id, 'VERIFIED')}
                                            disabled={isProcessing}
                                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-emerald-700 flex items-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Approve KYC
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePayoutVerify(selectedTech.userId._id, true)}
                                            disabled={isProcessing}
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Approve Payouts
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <DocPreview label="Aadhaar Front" url={selectedTech.verification?.documents?.aadhaarFront?.url} />
                                    <DocPreview label="Aadhaar Back" url={selectedTech.verification?.documents?.aadhaarBack?.url} />
                                    <DocPreview label="PAN Card" url={selectedTech.verification?.documents?.panCard?.url} />
                                    <DocPreview label="Bank Proof" url={selectedTech.verification?.documents?.bankProof?.url} />
                                    <DocPreview label="Face Selfie" url={selectedTech.verification?.documents?.selfie?.url} />
                                </div>

                                <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                    <h4 className="font-black text-slate-800 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-red-500" />
                                        Rejection Actions
                                    </h4>
                                    <textarea
                                        placeholder="Reason for rejection (e.g. Blurred image, Name mismatch)..."
                                        className="w-full h-24 p-4 rounded-2xl border-2 border-slate-200 focus:border-red-500 outline-none text-sm"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleVerify(selectedTech.userId._id, 'REJECTED')}
                                        disabled={isProcessing || !rejectionReason}
                                        className="w-full bg-red-100 text-red-700 py-3 rounded-2xl font-bold hover:bg-red-200 disabled:opacity-50"
                                    >
                                        Reject Submission
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 h-full rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <Eye size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">Select a technician from the left to start review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DocPreview({ label, url }) {
    if (!url) return (
        <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                Not Provided
            </div>
        </div>
    );

    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}</label>
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink size={14} />
                </a>
            </div>
            <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm relative">
                <img src={url} alt={label} className="w-full h-full object-cover" />
                <button
                    onClick={() => window.open(url, '_blank')}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                    <Eye className="text-white" />
                </button>
            </div>
        </div>
    );
}
