import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiGrid, FiUsers, FiLogOut, FiSettings, FiActivity, FiPieChart, FiAward, FiSun, FiMoon, FiChevronDown, FiChevronUp, FiLock, FiX, FiList, FiTarget, FiStar, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { FaTools } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import Logo from './Logo';
import { MENU_ITEMS, ALL_ROLES } from '../config/menuItems';
import { useAuth } from '../context/AuthContext';
import { getVisibleMenuItems } from '../utils/permissionHelpers';

const Sidebar = ({ isOpen, onClose, showTicker, toggleTicker }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { currencyMode, setCurrencyMode } = useCurrency();
    const { user, logout, permissions } = useAuth(); // Get permissions
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [openGroups, setOpenGroups] = useState({
        main: false,
        auction: false,
        analysis: false,
        data: false,
        utilities: false
    });

    const toggleGroup = (group) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    // Calculate user role for admin check
    const userRole = (user?.role || 'SPECTATOR').toUpperCase();
    const currentRole = ALL_ROLES.includes(userRole) ? userRole : 'SPECTATOR';

    const visibleGroups = getVisibleMenuItems(user, permissions);

    useEffect(() => {
        const activeGroup = MENU_ITEMS.find(group =>
            group.items.some(item =>
                location.pathname.startsWith(item.path) ||
                (item.path === '/auctions' && location.pathname.includes('/auction-room'))
            )
        );

        if (activeGroup) {
            setOpenGroups(prev => ({
                ...prev,
                [activeGroup.id]: true
            }));
        }

        // Auto-open Settings for relevant paths
        const settingsPaths = ['/settings', '/social-tools', '/admin/permissions', '/admin/sponsors'];
        if (settingsPaths.some(path => location.pathname.startsWith(path))) {
            setIsSettingsOpen(true);
        }
    }, [location.pathname]);



    const handleLogout = () => {
        logout(); // Use context logout
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
                    {visibleGroups.map((group) => {
                        const isOpenGroup = openGroups[group.id];
                        // Check active based on sub items
                        const isActiveGroup = group.items.some(sub => location.pathname.startsWith(sub.path)) ||
                            (group.id === 'auction' && location.pathname.includes('/auction-room'));

                        return (
                            <div key={group.id} className="space-y-1">
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${isActiveGroup || isOpenGroup ? 'text-white bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl"><group.icon /></span>
                                        <span className="font-medium">{group.label}</span>
                                    </div>
                                    {isOpenGroup ? <FiChevronUp /> : <FiChevronDown />}
                                </button>

                                {isOpenGroup && (
                                    <div className="pl-12 space-y-1">
                                        {group.items.map(sub => {
                                            const isActive = location.pathname.startsWith(sub.path) ||
                                                (sub.path === '/auctions' && location.pathname.includes('/auction-room'));
                                            return (
                                                <Link
                                                    key={sub.id}
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
                                <Link to="/settings" onClick={() => onClose && onClose()} className={`flex items-center gap-4 w-full px-4 py-2.5 text-sm rounded-lg transition-all ${location.pathname === '/settings' ? 'text-gold font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    <FiLock className="text-lg" />
                                    <span>Change Password</span>
                                </Link>
                                <Link to="/social-tools" onClick={() => onClose && onClose()} className={`flex items-center gap-4 w-full px-4 py-2.5 text-sm rounded-lg transition-all ${location.pathname === '/social-tools' ? 'text-gold font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                    <FiSettings className="text-lg" />
                                    <span>Social Studio</span>
                                </Link>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {theme === 'dark' ? <FiSun className="text-lg text-yellow-400" /> : <FiMoon className="text-lg" />}
                                    <span>{theme === 'dark' ? 'Light Mode' : 'Stadium Mode'}</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const modes = ['INR', 'Standard', 'Points'];
                                        const nextIndex = (modes.indexOf(currencyMode) + 1) % modes.length;
                                        setCurrencyMode(modes[nextIndex]);
                                    }}
                                    className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <FiDollarSign className="text-lg text-green-400" />
                                    <span>Currency: {currencyMode}</span>
                                </button>
                                <button
                                    onClick={toggleTicker}
                                    className="flex items-center gap-4 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <FiActivity className={`text-lg transition-colors ${showTicker ? 'text-green-400' : 'text-gray-500'}`} />
                                    <span>{showTicker ? 'Hide Live Ticker' : 'Show Live Ticker'}</span>
                                </button>

                                {currentRole === 'ADMIN' && (
                                    <>
                                        <Link to="/admin/sponsors" onClick={() => onClose && onClose()} className={`flex items-center gap-4 w-full px-4 py-2.5 text-sm rounded-lg transition-all ${location.pathname === '/admin/sponsors' ? 'text-gold font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <FiAward className="text-lg" />
                                            <span>Sponsor Logos</span>
                                        </Link>
                                        <Link to="/admin/permissions" onClick={() => onClose && onClose()} className={`flex items-center gap-4 w-full px-4 py-2.5 text-sm rounded-lg transition-all ${location.pathname === '/admin/permissions' ? 'text-gold font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                            <FiLock className="text-lg" />
                                            <span>Menu Permissions</span>
                                        </Link>
                                    </>
                                )}
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
