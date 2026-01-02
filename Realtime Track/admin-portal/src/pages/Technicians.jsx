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

    const verifyKYC = async (userId, verified) => {
        try {
            const response = await axios.post(`http://127.0.0.1:4000/api/admin/technicians/${userId}/verify-kyc`, {
                verified
            });
            if (response.data.success) {
                fetchTechnicians(); // Refresh
            }
        } catch (error) {
            alert('Failed to update verification status');
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
                    <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                        <Filter size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Technician</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Wallet</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">KYC Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
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
                                            <p className="text-xs text-red-500 font-medium">Due: ₹{tech.wallet?.commissionDue?.toLocaleString() || 0}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tech.documents?.kycVerified ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <UserCheck size={12} className="mr-1" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    <UserX size={12} className="mr-1" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {tech.documents?.kycVerified ? (
                                                    <button
                                                        onClick={() => verifyKYC(tech.userId?._id, false)}
                                                        className="text-xs font-bold text-red-600 hover:text-red-700"
                                                    >
                                                        Unverify
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => verifyKYC(tech.userId?._id, true)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700"
                                                    >
                                                        Verify KYC
                                                    </button>
                                                )}
                                                <button className="text-xs font-bold text-gray-500 hover:text-gray-700 ml-2">
                                                    View Details
                                                </button>
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
