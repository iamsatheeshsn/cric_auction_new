import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PERMISSIONS } from '../config/menuItems';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedPermissions = localStorage.getItem('permissions');

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (e) {
                console.error("Failed to parse user", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }

        if (storedPermissions) {
            try {
                const parsed = JSON.parse(storedPermissions);
                // MIGRATION: If legacy array format, reset to defaults or migrate
                // For simplicity, if we detect an array structure for any role, we reset to new defaults to ensure full feature set.
                // A better approach would be to map Array -> Object with ['view'], but defaults are safer for now.
                const isLegacy = Object.values(parsed).some(val => Array.isArray(val));

                if (isLegacy) {
                    console.log("Legacy permissions detected, migrating to new structure...");
                    // We could migrate: each ID becomes { id: ['view'] }
                    // But let's just reset to DEFAULT_PERMISSIONS to give the new 'create/edit' capabilities immediately.
                    setPermissions(DEFAULT_PERMISSIONS);
                } else {
                    setPermissions(parsed);
                }
            } catch (e) {
                console.error("Failed to parse permissions", e);
                setPermissions(DEFAULT_PERMISSIONS);
            }
        }

        setLoading(false);
    }, []);

    const updatePermissions = (newPermissions) => {
        setPermissions(newPermissions);
        localStorage.setItem('permissions', JSON.stringify(newPermissions));
    };

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, permissions, updatePermissions }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
