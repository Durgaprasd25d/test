import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Shuffle,
    Search,
    Filter,
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:4000/api/admin';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ credit: 0, debit: 0, settlement: 0 });
    const [viewMode, setViewMode] = useState('internal'); // 'internal' or 'razorpay'

    // Filters & Pagination
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchTransactions();
    }, [pagination.page, filters, viewMode]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            if (viewMode === 'internal') {
                const params = {
                    page: pagination.page,
                    limit: 15,
                    ...filters
                };
                const res = await axios.get(`${API_BASE}/transactions`, {
                    params,
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });

                if (res.data.success) {
                    setTransactions(res.data.transactions);
                    setPagination(prev => ({
                        ...prev,
                        pages: res.data.pagination.pages,
                        total: res.data.pagination.total
                    }));

                    const localStats = res.data.transactions.reduce((acc, t) => {
                        acc[t.type] = (acc[t.type] || 0) + (t.amount || 0);
                        return acc;
                    }, { credit: 0, debit: 0, settlement: 0 });
                    setStats(localStats);
                }
            } else {
                // Razorpay Direct Sync
                const res = await axios.get(`${API_BASE}/razorpay/payments`, {
                    params: { count: 30 },
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                if (res.data.success) {
                    const mapped = res.data.payments.map(p => ({
                        _id: p.id,
                        description: p.description || `Payment via ${p.method}`,
                        technician: { name: p.email, mobile: p.contact },
                        type: 'credit',
                        amount: p.amount / 100, // paise to rupees
                        status: p.status === 'captured' ? 'completed' : p.status,
                        createdAt: new Date(p.created_at * 1000),
                        metadata: {
                            transactionId: p.id,
                            paymentMethod: 'Razorpay',
                            fee: p.fee / 100,
                            tax: p.tax / 100
                        }
                    }));
                    setTransactions(mapped);
                    setPagination(prev => ({ ...prev, pages: 1, total: mapped.length }));
                }
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'credit': return <ArrowDownLeft className="text-emerald-500" size={18} />;
            case 'debit': return <ArrowUpRight className="text-rose-500" size={18} />;
            case 'settlement': return <Shuffle className="text-blue-500" size={18} />;
            default: return <CreditCard size={18} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold uppercase tracking-wider"><CheckCircle2 size={12} /> Success</span>;
            case 'pending': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold uppercase tracking-wider"><Clock size={12} /> Pending</span>;
            case 'failed': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[11px] font-bold uppercase tracking-wider"><AlertCircle size={12} /> Failed</span>;
            default: return status;
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Financial Ledger</h2>
                    <p className="text-slate-500 text-sm">Real-time monitoring of all platform transactions</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-2xl mr-4">
                        <button
                            onClick={() => setViewMode('internal')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'internal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Internal Ledger
                        </button>
                        <button
                            onClick={() => setViewMode('razorpay')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'razorpay' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Live Razorpay
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all">
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => fetchTransactions()}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-all"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Credits</span>
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ArrowDownLeft size={20} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 line-clamp-1">₹{stats.credit.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-400 mt-2">Earnings & Reversals</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Withdrawals</span>
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><ArrowUpRight size={20} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 line-clamp-1">₹{stats.debit.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-400 mt-2">Technician Payouts</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settlements</span>
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Shuffle size={20} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 line-clamp-1">₹{stats.settlement.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-400 mt-2">Admin Adjustments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by description or transaction ID..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-600 font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                            <option value="settlement">Settlement</option>
                        </select>
                        <select
                            className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-600 font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Success</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0"
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <span className="text-slate-300">to</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0"
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-50 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                                        <CreditCard size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-medium">No transactions found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{t.description}</span>
                                                <span className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                                                    ID: {t.metadata?.transactionId || t._id.slice(-10).toUpperCase()}
                                                    {t.metadata?.paymentMethod === 'Razorpay' && (
                                                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-bold">RZP</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700">{t.technician?.name || 'N/A'}</span>
                                                <span className="text-[10px] text-slate-400">{t.technician?.mobile || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(t.type)}
                                                <span className="text-xs font-bold text-slate-600 capitalize">{t.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-sm font-black ${t.type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {t.type === 'debit' ? '-' : '+'}₹{t.amount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 flex justify-center">
                                            {getStatusBadge(t.status)}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-700">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                        Showing <b>{transactions.length}</b> of <b>{pagination.total}</b> transactions
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPagination({ ...pagination, page: p })}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${pagination.page === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-slate-500'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
