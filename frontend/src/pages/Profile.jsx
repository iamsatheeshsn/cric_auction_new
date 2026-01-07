import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiUser, FiLock, FiActivity, FiSave, FiCamera, FiUploadCloud, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Profile = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [activeTab, setActiveTab] = useState('settings');
    const [activities, setActivities] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        display_name: user.display_name || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Image Upload State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivity();
        }
    }, [activeTab]);

    const fetchActivity = async () => {
        try {
            const res = await api.get(`/activity/${user.id}`);
            setActivities(res.data);
        } catch (error) {
            console.error("Failed to load activity", error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('userId', user.id);
            data.append('display_name', formData.display_name);

            if (selectedImage) {
                data.append('avatar', selectedImage);
            }

            // If we want to support URL still, we could, but let's prioritize file upload or keep existing
            // data.append('avatar', formData.avatar); // logic if we kept the text input

            const res = await api.post('/auth/update-profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update Local Storage
            const updatedUser = { ...user, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            toast.success("Profile Updated Successfully!");

            // Trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("New passwords do not match");
        }

        try {
            await api.post('/auth/change-password', {
                userId: user.id,
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            toast.success("Password Changed Successfully!");
            setFormData({ ...formData, oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        }
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-4xl mx-auto">

                    {/* Header Card */}
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
                        {/* Decorative Background */}
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 relative">
                            <div className="absolute inset-0 bg-pattern opacity-10"></div>
                        </div>

                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="flex items-end gap-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl text-gray-400">{getInitials(user.display_name || user.username)}</span>
                                            )}
                                        </div>

                                        {/* Camera Overlay */}
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="absolute bottom-1 right-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105"
                                            title="Change Avatar"
                                        >
                                            <FiCamera className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                            {user.display_name || user.username}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider rounded-full">
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                                {['settings', 'activity'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 px-4 text-sm font-medium transition-all relative ${activeTab === tab
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {tab === 'settings' ? 'Account Settings' : 'Activity History'}
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'settings' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column - Profile Info */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <FiUser className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h3>
                                            </div>

                                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Display Name
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={formData.display_name}
                                                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-400"
                                                            placeholder="How should we call you?"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Avatar
                                                    </label>
                                                    <div
                                                        onClick={() => fileInputRef.current.click()}
                                                        className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                            <FiUploadCloud className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Click to upload new image</p>
                                                        <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium transition-all transform active:scale-95">
                                                        <FiSave className="w-4 h-4" /> Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Right Column - Security */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                                    <FiLock className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Security</h3>
                                            </div>

                                            <form onSubmit={handleChangePassword} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                                    <input
                                                        type="password"
                                                        value={formData.oldPassword}
                                                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={formData.newPassword}
                                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                                    <input
                                                        type="password"
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                                        placeholder="••••••••"
                                                    />
                                                </div>

                                                <button type="submit" className="w-full mt-4 py-2.5 bg-gray-800 dark:bg-slate-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-slate-600 shadow-md transition-all font-medium">
                                                    Update Password
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                            <FiActivity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Track your account actions and modifications.</p>
                                        </div>
                                    </div>

                                    {activities.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FiActivity className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activity recorded.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                            {activities.map((log) => (
                                                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                        <FiActivity className="w-5 h-5" />
                                                    </div>

                                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                                            <div className="font-bold text-slate-900 dark:text-slate-200">{log.action}</div>
                                                            <time className="font-caveat font-medium text-indigo-500 text-xs">
                                                                {new Date(log.createdAt).toLocaleString()}
                                                            </time>
                                                        </div>
                                                        <div className="text-slate-500 dark:text-slate-400 text-sm">{log.details}</div>
                                                        {log.entity_type && (
                                                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-white">
                                                                {log.entity_type} #{log.entity_id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
