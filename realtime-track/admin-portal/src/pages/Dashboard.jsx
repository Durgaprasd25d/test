import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Briefcase, IndianRupee, Activity } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        users: 0,
        technicians: 0,
        jobs: 0,
        completedJobs: 0,
        revenue: 0,
        commission: 0,
        wallets: 0,
        dues: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:4000/api/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Customers', value: stats.users, icon: Users, color: 'bg-blue-500' },
        { label: 'Technicians', value: stats.technicians, icon: Briefcase, color: 'bg-indigo-500' },
        { label: 'Total Earnings', value: `₹${(stats.revenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: 'bg-emerald-500' },
        { label: 'Commissions Due', value: `₹${(stats.dues / 1000).toFixed(1)}K`, icon: Activity, color: 'bg-amber-500' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                                <stat.icon size={24} className={`text-${stat.color.split('-')[1]}-600`} color="currentColor" />
                                {/* Note: Tailwind dynamic class interpolation might need full names, but Lucide handles color prop. 
                    Actually in v4, simplified classes. I will hardcode text colors for safety.
                */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Chart Placeholder
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Live Map Preview</h3>
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Map Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
}
