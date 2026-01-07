import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Search, Filter } from 'lucide-react';

export default function Technicians() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:4000/api/admin/technicians');
            if (response.data.success) {
                setTechnicians(response.data.technicians);
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKycVerify = async (userId, status) => {
        if (status === 'REJECTED') {
            const reason = window.prompt('Reason for rejection:');
            if (!reason) return;
            await submitVerification(userId, 'verify-kyc', { status, reason });
        } else {
            if (!window.confirm('Approve KYC documents?')) return;
            await submitVerification(userId, 'verify-kyc', { status });
        }
    };

    const handlePayoutVerify = async (userId, isVerified) => {
        if (!window.confirm(`Are you sure you want to ${isVerified ? 'ENABLE' : 'DISABLE'} payouts?`)) return;
        await submitVerification(userId, 'verify-payout', { isVerified });
    };

    const submitVerification = async (userId, endpoint, data) => {
        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/technicians/${userId}/${endpoint}`, data);
            if (response.data.success) {
                fetchTechnicians(); // Refresh
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    const filteredTechs = technicians.filter(t =>
        t.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userId?.mobile?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Technician Management</h2>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search name or mobile..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                        <Filter size={20} className="text-gray-600" />
                    </button> */}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">TECHNICIAN</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">CONTACT</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">WALLET</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">KYC STATUS</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">PAYOUTS</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 font-black">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading technicians...</td>
                                </tr>
                            ) : filteredTechs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No technicians found.</td>
                                </tr>
                            ) : (
                                filteredTechs.map((tech) => (
                                    <tr key={tech._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                    {tech.userId?.name?.charAt(0) || 'T'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{tech.userId?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500">ID: {tech.userId?._id?.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700">{tech.userId?.mobile}</p>
                                            <p className="text-xs text-gray-400">Joined: {new Date(tech.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-emerald-600">₹{tech.wallet?.balance?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-slate-500 font-medium">Locked: ₹{tech.wallet?.lockedAmount?.toLocaleString() || 0}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tech.verification?.kycStatus === 'VERIFIED' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    Verified
                                                </span>
                                            ) : tech.verification?.kycStatus === 'PENDING' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                                    Pending Rev.
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                                    {tech.verification?.kycStatus || 'Not Started'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tech.verification?.adminVerified ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                                    Enabled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                                    Locked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {tech.verification?.kycStatus !== 'VERIFIED' && (
                                                    <button
                                                        onClick={() => handleKycVerify(tech.userId?._id, 'VERIFIED')}
                                                        className="text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 text-center"
                                                    >
                                                        Approve KYC
                                                    </button>
                                                )}
                                                {tech.verification?.kycStatus === 'VERIFIED' && !tech.verification?.adminVerified && (
                                                    <button
                                                        onClick={() => handlePayoutVerify(tech.userId?._id, true)}
                                                        className="text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md border border-blue-200 text-center"
                                                    >
                                                        Unlock Payout
                                                    </button>
                                                )}
                                                {tech.verification?.adminVerified && (
                                                    <button
                                                        onClick={() => handlePayoutVerify(tech.userId?._id, false)}
                                                        className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 px-2 py-1 rounded-md border border-red-100 text-center"
                                                    >
                                                        Lock Payout
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
