import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiUsers, FiLogOut, FiSettings, FiActivity, FiPieChart, FiAward, FiSun, FiMoon, FiChevronDown, FiChevronUp, FiLock, FiX, FiList, FiTarget, FiStar, FiCalendar } from 'react-icons/fi';
import { FaTools } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const Sidebar = ({ isOpen, onClose, showTicker, toggleTicker }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [openGroups, setOpenGroups] = useState({
        main: true, // Default open
        auction: false,
        analysis: false,
        data: false,
        utilities: false
    });

    const toggleGroup = (group) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const menuGroups = [
        {
            type: 'group',
            id: 'main',
            label: 'Main',
            icon: <FiHome />,
            items: [
                { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
                { path: '/calendar', label: 'Calendar', icon: <FiCalendar />, newTab: true },
                { path: '/fanzone', label: 'Fan Zone', icon: <FiTarget /> },
            ]
        },
        {
            type: 'group',
            id: 'auction',
            label: 'Auction Center',
            icon: <FiGrid />,
            items: [
                { path: '/auctions', label: 'Auctions', icon: <FiGrid /> },
                { path: '/players', label: 'Players', icon: <FiUsers /> },
                { path: '/watchlist', label: 'My Watchlist', icon: <FiStar /> },
            ]
        },
        {
            type: 'group',
            id: 'data',
            label: 'Tournament Data',
            icon: <FiAward />,
            items: [
                { path: '/points', label: 'Points Table', icon: <FiList /> },
                { path: '/history', label: 'Hall of Fame', icon: <FiAward />, newTab: true },
            ]
        },
        {
            type: 'group',
            id: 'analysis',
            label: 'Analysis Center',
            icon: <FiPieChart />,
            items: [
                { path: '/stats', label: 'Stats Hub', icon: <FiActivity /> },
                { path: '/analytics', label: 'Analytics', icon: <FiPieChart /> },
                { path: '/compare', label: 'Play Comparison', icon: <FiUsers /> },
            ]
        },
        {
            type: 'group',
            id: 'utilities',
            label: 'Utilities',
            icon: <FaTools />,
            items: [
                { path: '/tools', label: 'DLS Calculator', icon: <FaTools /> }
            ]
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-deep-blue text-white shadow-xl flex flex-col print:hidden h-full flex-shrink-0
                transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between border-b border-white/10 shrink-0">
                    <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Logo className="w-12 h-12" textClassName="text-xl font-bold" />
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuGroups.map((item, index) => {
                        if (item.type === 'link') {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link key={item.path} to={item.path} onClick={() => onClose && onClose()}>
                                    <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/10 text-gold border-r-4 border-gold' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}>
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                </Link>
                            );
                        } else if (item.type === 'group') {
                            const isOpenGroup = openGroups[item.id];
                            const isActiveGroup = item.items.some(sub => location.pathname.startsWith(sub.path));

                            return (
                                <div key={item.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(item.id)}
                                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${isActiveGroup || isOpenGroup ? 'text-white bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        {isOpenGroup ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>

                                    {isOpenGroup && (
                                        <div className="pl-12 space-y-1">
                                            {item.items.map(sub => {
                                                const isActive = location.pathname.startsWith(sub.path);
                                                return (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        onClick={() => onClose && onClose()}
                                                        target={sub.newTab ? "_blank" : undefined}
                                                        rel={sub.newTab ? "noopener noreferrer" : undefined}
                                                    >
                                                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'text-gold font-bold' : 'text-gray-400 hover:text-white'}`}>
                                                            <span>{sub.label}</span>
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }
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
                                <Link to="/settings" onClick={() => onClose && onClose()} className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <FiLock className="text-lg" />
                                    <span>Change Password</span>
                                </Link>
                                <Link to="/social-tools" onClick={() => onClose && onClose()} className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <FiSettings className="text-lg" />
                                    <span>Social Studio</span>
                                </Link>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {theme === 'dark' ? <FiSun className="text-lg text-yellow-400" /> : <FiMoon className="text-lg" />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                                <button
                                    onClick={toggleTicker}
                                    className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <FiActivity className={`text-lg transition-colors ${showTicker ? 'text-green-400' : 'text-gray-500'}`} />
                                    <span>{showTicker ? 'Hide Live Ticker' : 'Show Live Ticker'}</span>
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
        </>
    );
};

export default Sidebar;
