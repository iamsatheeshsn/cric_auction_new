
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { ADMIN_MENU_ITEMS, ALL_ROLES, AVAILABLE_ACTIONS, ACTIONS } from '../../config/menuItems';
import { FiSave, FiEye, FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ActionIcon = ({ action, className }) => {
    switch (action) {
        case ACTIONS.VIEW: return <FiEye className={className} />;
        case ACTIONS.CREATE: return <FiPlus className={className} />;
        case ACTIONS.EDIT: return <FiEdit2 className={className} />;
        case ACTIONS.DELETE: return <FiTrash2 className={className} />;
        default: return null;
    }
};

const MenuPermissions = () => {
    const { permissions, updatePermissions } = useAuth();
    const [localPermissions, setLocalPermissions] = useState(permissions);
    const [activeRole, setActiveRole] = useState(ALL_ROLES[0]); // Default to ADMIN (index 0)

    useEffect(() => {
        setLocalPermissions(permissions);
    }, [permissions]);

    const getRoleActions = (role, itemId) => {
        const rolePerms = localPermissions[role];

        // Handle legacy array format
        if (Array.isArray(rolePerms)) {
            return rolePerms.includes(itemId) ? [ACTIONS.VIEW] : [];
        }

        // Handle new object format
        if (rolePerms && rolePerms[itemId]) {
            return rolePerms[itemId];
        }

        return [];
    };

    const handleActionToggle = (role, itemId, action) => {
        setLocalPermissions(prev => {
            const rolePerms = prev[role];
            let newRolePerms;

            // Normalize current item actions
            let currentActions = [];

            if (Array.isArray(rolePerms)) {
                const legacyMap = rolePerms.reduce((acc, id) => ({ ...acc, [id]: [ACTIONS.VIEW] }), {});
                newRolePerms = legacyMap;
                currentActions = newRolePerms[itemId] || [];
            } else {
                newRolePerms = { ...rolePerms };
                currentActions = newRolePerms[itemId] || [];
            }

            const hasAction = currentActions.includes(action);
            let updatedActions;

            if (hasAction) {
                updatedActions = currentActions.filter(a => a !== action);
                if (action === ACTIONS.VIEW) {
                    updatedActions = [];
                }
            } else {
                updatedActions = [...currentActions, action];
                if (!updatedActions.includes(ACTIONS.VIEW)) {
                    updatedActions.push(ACTIONS.VIEW);
                }
            }

            if (updatedActions.length > 0) {
                newRolePerms[itemId] = updatedActions;
            } else {
                delete newRolePerms[itemId];
            }

            return { ...prev, [role]: newRolePerms };
        });
    };

    const handleSave = () => {
        updatePermissions(localPermissions);
        toast.success("Permissions updated successfully!");
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 pb-32">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">Menu Permissions</h1>
                            <p className="text-slate-500 text-lg mt-2 font-medium">Configure detailed access controls for each user role.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-blue-200/50 transition-all active:scale-95 hover:-translate-y-0.5 border border-white/20"
                        >
                            <FiSave size={20} /> <span className="tracking-wide">SAVE CHANGES</span>
                        </button>
                    </div>

                    {/* Role Tabs */}
                    <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide px-4">
                        {ALL_ROLES.map(role => {
                            const isActive = activeRole === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setActiveRole(role)}
                                    className={`
                                        relative px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden
                                        ${isActive
                                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20 scale-100'
                                            : 'bg-white text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm border border-slate-100 hover:shadow-md'
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 skew-x-12 -translate-x-full animate-shimmer" />
                                    )}
                                    {role}
                                </button>
                            );
                        })}
                    </div>

                    {/* Permission Cards */}
                    <div className="space-y-8">
                        {activeRole === 'ADMIN' && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-5 rounded-2xl text-purple-800 text-sm flex items-center gap-4 mb-6 shadow-sm">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                                    <FiAlertCircle className="text-xl" />
                                </div>
                                <span className="font-medium"><strong>Critical:</strong> You are modifying Admin permissions. Ensure you do not accidentally remove your own access to this page.</span>
                            </div>
                        )}

                        {ADMIN_MENU_ITEMS.map(group => (
                            <div key={group.id} className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-white relative overflow-hidden group/card">
                                {/* Decorative background blob */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover/card:scale-110 transition-transform duration-700 pointer-events-none" />

                                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-5 relative z-10">
                                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-blue-600 shadow-inner">
                                        <group.icon size={24} />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-xl tracking-tight">{group.label}</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                                    {group.items.map(item => {
                                        const actions = getRoleActions(activeRole, item.id);
                                        const isAdmin = activeRole === 'ADMIN';

                                        // Determine which actions to show
                                        const visibleActions = item.availableActions
                                            ? AVAILABLE_ACTIONS.filter(a => item.availableActions.includes(a))
                                            : AVAILABLE_ACTIONS;

                                        return (
                                            <div key={item.id} className="bg-slate-50/50 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 border border-slate-100 hover:border-blue-100 group/item">
                                                <div className="flex items-center justify-between mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl transition-colors ${actions.includes(ACTIONS.VIEW) || isAdmin ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>
                                                            <item.icon size={18} />
                                                        </div>
                                                        <span className={`font-bold text-base ${actions.includes(ACTIONS.VIEW) || isAdmin ? 'text-slate-700' : 'text-slate-400 line-through decoration-slate-300'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                    {visibleActions.map(action => {
                                                        const isActive = actions.includes(action);

                                                        // Styles
                                                        let activeClass = 'text-slate-300 hover:bg-slate-50';
                                                        if (isActive) {
                                                            if (action === ACTIONS.VIEW) activeClass = 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100';
                                                            if (action === ACTIONS.CREATE) activeClass = 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100';
                                                            if (action === ACTIONS.EDIT) activeClass = 'bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100';
                                                            if (action === ACTIONS.DELETE) activeClass = 'bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-100';
                                                        }

                                                        const titles = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

                                                        return (
                                                            <button
                                                                key={action}
                                                                onClick={() => !isAdmin && handleActionToggle(activeRole, item.id, action)}
                                                                disabled={isAdmin}
                                                                title={titles[action]}
                                                                className={`
                                                                    flex-1 flex justify-center py-2.5 rounded-lg transition-all duration-200 
                                                                    ${activeClass} 
                                                                    ${isAdmin ? 'cursor-not-allowed opacity-60' : 'active:scale-95'}
                                                                `}
                                                            >
                                                                <ActionIcon action={action} className="w-4 h-4" />
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MenuPermissions;
