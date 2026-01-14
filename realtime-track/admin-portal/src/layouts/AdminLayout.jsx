import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MapPin,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck, Briefcase
} from 'lucide-react';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    const navSections = [
        {
            label: 'Operations',
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
                { name: 'Live Map', path: '/map', icon: MapPin },
            ]
        },
        {
            label: 'Management',
            items: [
                { name: 'Technicians', path: '/technicians', icon: Users },
                { name: 'KYC Center', path: '/kyc', icon: ShieldCheck },
                { name: 'Service Catalog', path: '/services', icon: Briefcase },
            ]
        },
        {
            label: 'Accounting',
            items: [
                { name: 'Transaction Ledger', path: '/transactions', icon: CreditCard },
                { name: 'Payout Requests', path: '/payouts', icon: CreditCard },
            ]
        },
        {
            label: 'Infrastucture',
            items: [
                { name: 'System Settings', path: '/settings', icon: Settings },
            ]
        }
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
                    } hidden md:flex flex-col`}
            >
                <div className="h-16 flex items-center justify-center border-b border-slate-700">
                    {isSidebarOpen ? (
                        <h2 className="text-xl font-bold tracking-wider text-blue-400">ZYRO <span className="text-white">ADMIN</span></h2>
                    ) : (
                        <span className="font-bold text-xl text-blue-400">ZA</span>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-8 overflow-y-auto custom-scrollbar">
                    {navSections.map((section) => (
                        <div key={section.label} className="space-y-2">
                            {isSidebarOpen && (
                                <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                                    {section.label}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`
                                        }
                                    >
                                        <item.icon size={18} className={`${isSidebarOpen ? '' : 'mx-auto'}`} />
                                        {isSidebarOpen && <span className="text-sm font-semibold">{item.name}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-slate-800 transition-colors ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">Super Admin</span>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
