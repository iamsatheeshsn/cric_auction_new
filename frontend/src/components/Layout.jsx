import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { FiMenu } from 'react-icons/fi';
import Ticker from './Ticker';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/auctions', label: 'Auctions' },
        { path: '/stats', label: 'Stats Hub' },
        { path: '/analytics', label: 'Analytics' },
        { path: '/tools', label: 'Tools' },
        { path: '/profile', label: 'My Profile' },
    ];

    const [showTicker, setShowTicker] = useState(() => {
        return localStorage.getItem('showTicker') !== 'false';
    });

    const toggleTicker = () => {
        const newState = !showTicker;
        setShowTicker(newState);
        localStorage.setItem('showTicker', newState);
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 print:bg-white print:h-auto transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                showTicker={showTicker}
                toggleTicker={toggleTicker}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto print:overflow-visible print:h-auto w-full">
                <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center px-4 md:px-8 print:hidden transition-colors duration-300 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden"
                        >
                            <FiMenu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
                            {menuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <NotificationBell />

                        <Link to="/profile" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-yellow-300 flex items-center justify-center text-deep-blue font-bold">
                                    {(user.username || 'A').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-600 hidden sm:inline dark:text-gray-300">
                                {user.display_name || user.username || 'Admin'}
                            </span>
                        </Link>
                    </div>
                </header>
                <main className={`p-4 md:p-8 ${showTicker ? 'pb-16' : ''}`}>
                    {children}
                </main>
                {showTicker && <Ticker onClose={toggleTicker} />}
            </div>
        </div>
    );
};

export default Layout;
