import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, ShoppingBag } from 'lucide-react';

function Navigation() {
    const location = useLocation();

    return (
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="glass-card rounded-full px-6 py-3 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${location.pathname === '/'
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <Home className="w-5 h-5" />
                        <span className="hidden sm:inline">Todo</span>
                    </Link>

                    <Link
                        to="/game"
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${location.pathname === '/game'
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <Gamepad2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Race Game</span>
                    </Link>

                    <Link
                        to="/shop"
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${location.pathname === '/shop'
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="hidden sm:inline">Shop</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
