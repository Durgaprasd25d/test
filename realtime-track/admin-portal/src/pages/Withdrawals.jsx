import { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export default function Withdrawals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:4000/api/admin/withdrawals?status=${filter}`);
            if (response.data.success) {
                setRequests(response.data.withdrawals);
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        const note = prompt('Enter admin note (optional):');
        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/withdrawals/${id}/status`, {
                status,
                adminNote: note
            });
            if (response.data.success) {
                fetchRequests();
            }
        } catch (error) {
            alert('Action failed');
        }
    };

    const markPaid = async (id) => {
        const txId = prompt('Enter Transaction ID / Reference:');
        if (!txId) return;

        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/withdrawals/${id}/mark-paid`, {
                transactionId: txId
            });
            if (response.data.success) {
                fetchRequests();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Payout processing failed');
        }
    };

    const processAutomatedPayout = async (id) => {
        if (!window.confirm('Initiate real money transfer via RazorpayX?')) return;

        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/payout/process-payout`, {
                withdrawalId: id
            });
            if (response.data.success) {
                alert('Payout initiated! Transaction ID: ' + response.data.payoutId);
                fetchRequests();
            }
        } catch (error) {
            alert('Automated Payout Failed: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Payout Requests</h2>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {['pending', 'approved', 'completed', 'rejected'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {s.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500">
                        Loading requests...
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500">
                        No {filter} requests found.
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-colors">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${req.payoutMethod === 'upi' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">₹{req.amount.toLocaleString()}</h3>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        {req.technician?.userId?.name || req.technician?.name} ({req.technician?.userId?.mobile || req.technician?.mobile})
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${req.technician?.verification?.kycVerified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            KYC: {req.technician?.verification?.kycStatus || 'UNKNOWN'}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${req.technician?.verification?.adminVerified ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            PAYOUT ACCESS: {req.technician?.verification?.adminVerified ? 'VERIFIED' : 'PENDING'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Requested on {new Date(req.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex-1 max-w-sm px-6 border-l border-r border-gray-50 flex flex-col justify-center">
                                {req.payoutMethod === 'upi' ? (
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">UPI ID</p>
                                        <p className="text-sm font-mono text-slate-800">{req.upiId}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Bank Details</p>
                                        <p className="text-sm font-medium text-slate-800">{req.bankDetails?.accountHolderName}</p>
                                        <p className="text-xs text-gray-600">A/C: {req.bankDetails?.accountNumber} | IFSC: {req.bankDetails?.ifscCode}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {req.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateStatus(req._id, 'approved')}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                            title="Approve Request"
                                        >
                                            <CheckCircle size={24} />
                                        </button>
                                        <button
                                            onClick={() => updateStatus(req._id, 'rejected')}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Reject Request"
                                        >
                                            <XCircle size={24} />
                                        </button>
                                    </>
                                )}

                                {req.status === 'approved' && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => processAutomatedPayout(req._id)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                                        >
                                            Process RazorpayX
                                        </button>
                                        <button
                                            onClick={() => markPaid(req._id)}
                                            className="text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50"
                                        >
                                            Mark Manual
                                        </button>
                                    </div>
                                )}

                                {(req.status === 'completed' || req.status === 'rejected') && (
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Processed At</p>
                                        <p className="text-sm text-slate-600 font-medium">{new Date(req.processedAt || req.updatedAt).toLocaleDateString()}</p>
                                        {req.transactionId && <p className="text-[10px] text-gray-400">Ref: {req.transactionId}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
