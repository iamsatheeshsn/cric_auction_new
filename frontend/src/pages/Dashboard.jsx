import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiActivity, FiUsers, FiDollarSign, FiBriefcase, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import { DonutChart, BarChart } from '../components/SimpleCharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (val) => {
        if (!val) return '₹0';
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your auctions and performance</p>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Players Sold"
                            value={stats?.charts?.playerStatus?.Sold || 0}
                            subText={`/ ${stats?.counts?.players} Total`}
                            icon={FiUsers}
                            colorClass="text-blue-600 dark:text-blue-400"
                            borderClass="border-blue-500"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Active Teams"
                            value={stats?.counts?.teams || 0}
                            icon={FiBriefcase}
                            colorClass="text-purple-600 dark:text-purple-400"
                            borderClass="border-purple-500"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatsCard
                            title="Total Auctions"
                            value={stats?.counts?.auctions || 0}
                            icon={FiActivity}
                            colorClass="text-orange-600 dark:text-orange-400"
                            borderClass="border-orange-500"
                        />
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Role Distribution Chart */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <FiUsers className="text-deep-blue dark:text-blue-400" />
                            Player Roles
                        </h3>
                        <div className="flex justify-center">
                            <DonutChart data={stats?.charts?.roles} size={220} />
                        </div>
                    </motion.div>

                    {/* Tournament Progress Chart */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <FiActivity className="text-deep-blue dark:text-blue-400" />
                            Tournament Progress
                        </h3>
                        <div className="flex justify-center">
                            <DonutChart data={stats?.charts?.matchStats} size={220} />
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activity / Quick Actions (Optional placeholder for future expansion) */}
                {stats?.recentAuctions?.length > 0 && (
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent Auctions</h3>
                        <div className="space-y-3">
                            {stats.recentAuctions.map(auction => (
                                <div key={auction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{auction.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(auction.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${auction.status === 'Live' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {auction.status || 'Draft'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </motion.div>
        </Layout>
    );
};

export default Dashboard;
