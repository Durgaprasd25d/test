import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [activeJobs, setActiveJobs] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
        fetchActiveJobs();
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

    const fetchActiveJobs = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:4000/api/admin/active-jobs');
            if (response.data.success) {
                setActiveJobs(response.data.jobs.length);
            }
        } catch (error) {
            console.error('Error fetching active jobs:', error);
        }
    };

    const statCards = [
        { label: 'Total Customers', value: stats.users, icon: Users, color: 'bg-blue-500' },
        { label: 'Technicians', value: stats.technicians, icon: Briefcase, color: 'bg-indigo-500' },
        { label: 'Active Services', value: activeJobs, icon: Activity, color: 'bg-rose-500' },
        { label: 'Total Earnings', value: `₹${(stats.revenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: 'bg-emerald-500' },
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
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 cursor-pointer hover:border-blue-200 transition-colors group"
                    onClick={() => navigate('/map')}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Live Map Preview</h3>
                        <span className="text-xs text-blue-600 font-bold group-hover:underline">Open Full Map →</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200">
                        <Activity size={48} className="text-rose-500 mb-4 animate-pulse" />
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{activeJobs} Live Technicians</h4>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Currently tracking active service requests across the city.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
