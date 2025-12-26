import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiLock, FiCheck, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Settings = () => {
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post('/auth/change-password', {
                userId: user.id,
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setMessage('Password updated successfully');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-deep-blue mb-2">Settings</h1>
                    <p className="text-gray-500 font-medium">Manage your account and preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Info Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-1"
                    >
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600 text-2xl">
                                <FiShield />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Security</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Keep your account secure by using a strong password. We recommend changing it periodically.
                            </p>
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Session</div>
                                <p className="text-sm font-medium text-gray-700">Logged in as Admin</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2"
                    >
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="border-b border-gray-100 p-6 bg-gray-50/50">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <FiLock className="text-blue-500" /> Change Password
                                </h3>
                            </div>

                            <div className="p-8">
                                {message && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                            <FiCheck className="text-sm" />
                                        </div>
                                        {message}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={passwords.oldPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwords.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwords.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-deep-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-900 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
