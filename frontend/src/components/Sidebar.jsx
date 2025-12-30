import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiUsers, FiLogOut, FiSettings, FiActivity, FiPieChart, FiAward, FiSun, FiMoon, FiChevronDown, FiChevronUp, FiLock } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/auctions', label: 'Auctions', icon: <FiGrid /> },
        { path: '/players', label: 'Players', icon: <FiUsers /> },
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
        <div className="w-72 bg-deep-blue text-white shadow-xl flex flex-col print:hidden h-full flex-shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
                <Logo className="w-12 h-12" textClassName="text-xl font-bold" />
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

            <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
                {/* Settings Menu */}
                <div>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${isSettingsOpen ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-4">
                            <FiSettings className="text-xl" />
                            <span className="font-medium">Settings</span>
                        </div>
                        {isSettingsOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>

                    {isSettingsOpen && (
                        <div className="mt-2 space-y-1 pl-4">
                            <Link to="/settings" className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                <FiLock className="text-lg" />
                                <span>Change Password</span>
                            </Link>
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                                {theme === 'dark' ? <FiSun className="text-lg text-yellow-400" /> : <FiMoon className="text-lg" />}
                                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all mt-2">
                    <FiLogOut className="text-xl" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
