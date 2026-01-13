
import { FiHome, FiGrid, FiUsers, FiAward, FiPieChart, FiActivity, FiList, FiTarget, FiCalendar, FiStar, FiSettings, FiLock, FiLogOut } from 'react-icons/fi';
import { FaTools } from 'react-icons/fa';

export const MENU_ITEMS = [
    {
        id: 'main',
        label: 'Main',
        icon: FiHome, // Storing component reference, Sidebar will render <item.icon />
        items: [
            { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: FiHome, availableActions: ['view'] },
            { id: 'calendar', path: '/calendar', label: 'Calendar', icon: FiCalendar, newTab: true, availableActions: ['view'] },
            { id: 'fanzone', path: '/fanzone', label: 'Fan Zone', icon: FiTarget, availableActions: ['view'] },
        ]
    },
    {
        id: 'auction',
        label: 'Auction Center',
        icon: FiGrid,
        items: [
            { id: 'auctions', path: '/auctions', label: 'Auctions', icon: FiGrid },
            { id: 'players', path: '/players', label: 'Players', icon: FiUsers },
            { id: 'watchlist', path: '/watchlist', label: 'My Watchlist', icon: FiStar, availableActions: ['view'] },
        ]
    },
    {
        id: 'data',
        label: 'Tournament Data',
        icon: FiAward,
        items: [
            { id: 'points', path: '/points', label: 'Points Table', icon: FiList, availableActions: ['view', 'edit'] },
            { id: 'history', path: '/history', label: 'Hall of Fame', icon: FiAward, newTab: true, availableActions: ['view'] },
        ]
    },
    {
        id: 'analysis',
        label: 'Analysis Center',
        icon: FiPieChart,
        items: [
            { id: 'stats', path: '/stats', label: 'Stats Hub', icon: FiActivity, availableActions: ['view'] },
            { id: 'analytics', path: '/analytics', label: 'Analytics', icon: FiPieChart, availableActions: ['view'] },
            { id: 'compare', path: '/compare', label: 'Play Comparison', icon: FiUsers, availableActions: ['view'] },
        ]
    },
    {
        id: 'utilities',
        label: 'Utilities',
        icon: FaTools,
        items: [
            { id: 'tools', path: '/tools', label: 'DLS Calculator', icon: FaTools, availableActions: ['view'] }
        ]
    }
];

export const ADMIN_MENU_ITEMS = [
    ...MENU_ITEMS,
    {
        id: 'settings_group',
        label: 'Settings & Tools',
        icon: FiSettings,
        items: [
            { id: 'settings', path: '/settings', label: 'Change Password', icon: FiLock, availableActions: ['view'] },
            { id: 'social_tools', path: '/social-tools', label: 'Social Studio', icon: FiSettings, availableActions: ['view'] },
            { id: 'sponsors', path: '/admin/sponsors', label: 'Sponsor Logos', icon: FiAward, availableActions: ['view'] },
            { id: 'menu_permissions', path: '/admin/permissions', label: 'Menu Permissions', icon: FiLock, availableActions: ['view'] }
        ]
    }
];

export const ALL_ROLES = ['ADMIN', 'AUCTIONEER', 'TEAM', 'SPECTATOR'];

export const ACTIONS = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete'
};

export const AVAILABLE_ACTIONS = Object.values(ACTIONS);

const ALL_ACCESS = [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE];
const READ_ONLY = [ACTIONS.VIEW];

export const DEFAULT_PERMISSIONS = {
    ADMIN: {
        main: READ_ONLY,
        dashboard: ALL_ACCESS,
        calendar: ALL_ACCESS,
        fanzone: ALL_ACCESS,
        auction: READ_ONLY,
        auctions: ALL_ACCESS,
        players: ALL_ACCESS,
        watchlist: ALL_ACCESS,
        data: READ_ONLY,
        points: ALL_ACCESS,
        history: ALL_ACCESS,
        analysis: READ_ONLY,
        stats: ALL_ACCESS,
        analytics: ALL_ACCESS,
        compare: ALL_ACCESS,
        utilities: READ_ONLY,
        tools: ALL_ACCESS,
        settings_group: READ_ONLY,
        settings: ALL_ACCESS,
        social_tools: ALL_ACCESS,
        sponsors: ALL_ACCESS,
        menu_permissions: ALL_ACCESS
    },
    AUCTIONEER: {
        main: READ_ONLY,
        dashboard: READ_ONLY,
        calendar: READ_ONLY,
        auction: READ_ONLY,
        auctions: ALL_ACCESS,
        players: ALL_ACCESS,
        data: READ_ONLY,
        points: READ_ONLY,
        utilities: READ_ONLY,
        tools: ALL_ACCESS
    },
    TEAM: {
        main: READ_ONLY,
        dashboard: READ_ONLY,
        calendar: READ_ONLY,
        auction: READ_ONLY,
        auctions: READ_ONLY,
        players: READ_ONLY,
        watchlist: ALL_ACCESS,
        data: READ_ONLY,
        points: READ_ONLY,
        analysis: READ_ONLY,
        stats: READ_ONLY,
        compare: READ_ONLY
    },
    SPECTATOR: {
        main: READ_ONLY,
        dashboard: READ_ONLY,
        calendar: READ_ONLY,
        fanzone: READ_ONLY,
        data: READ_ONLY,
        points: READ_ONLY,
        history: READ_ONLY
    }
};
