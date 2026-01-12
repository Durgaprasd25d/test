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
    ShieldCheck
} from 'lucide-react';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Technicians', path: '/technicians', icon: Users },
        { name: 'KYC Verification', path: '/kyc', icon: ShieldCheck },
        { name: 'Payout Requests', path: '/payouts', icon: CreditCard },
        { name: 'Live Map', path: '/map', icon: MapPin },
        { name: 'Settings', path: '/settings', icon: Settings },
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
                        <h1 className="text-xl font-bold tracking-wider">ADMIN PORTAL</h1>
                    ) : (
                        <span className="font-bold text-xl">AP</span>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {isSidebarOpen && <span>{item.name}</span>}
                        </NavLink>
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
