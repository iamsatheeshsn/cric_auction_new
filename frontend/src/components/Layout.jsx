import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const location = useLocation();

    // Logic to determine header title from Sidebar menu items or fallback
    // Since Sidebar has the menuItems, we either duplicate them here for title lookup
    // or just assume a title based on path.
    // For simplicity and to match previous behavior, I will list the items here for title lookup only.
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/auctions', label: 'Auctions' },
        { path: '/stats', label: 'Stats Hub' },
        { path: '/analytics', label: 'Analytics' },
    ];

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 print:bg-white print:h-auto transition-colors duration-300">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 overflow-auto print:overflow-visible print:h-auto">
                <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center px-8 print:hidden transition-colors duration-300">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {menuItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-yellow-300 flex items-center justify-center text-deep-blue font-bold">
                            A
                        </div>
                        <span className="text-sm font-medium text-gray-600">Admin</span>
                    </div>
                </header>
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
