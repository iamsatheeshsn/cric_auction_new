import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiUsers, FiLogOut, FiSettings, FiActivity, FiPieChart, FiAward } from 'react-icons/fi';
import Logo from './Logo';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/auctions', label: 'Auctions', icon: <FiGrid /> },
        { path: '/points', label: 'Points Table', icon: <FiAward /> },
        { path: '/compare', label: 'Play Comparison', icon: <FiUsers /> },
        { path: '/stats', label: 'Stats Hub', icon: <FiActivity /> },
        { path: '/analytics', label: 'Analytics', icon: <FiPieChart /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="w-64 bg-deep-blue text-white shadow-xl flex flex-col print:hidden h-full flex-shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
                <Logo className="w-12 h-12" textClassName="text-2xl font-bold" />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link key={item.path} to={item.path}>
                            <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/10 text-gold border-r-4 border-gold' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}>
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 shrink-0">
                <Link to="/settings" className="flex items-center gap-4 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <FiSettings className="text-xl" />
                    <span className="font-medium">Settings</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all mt-2">
                    <FiLogOut className="text-xl" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
