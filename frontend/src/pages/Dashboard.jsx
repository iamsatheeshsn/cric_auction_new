import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { FiActivity, FiUsers, FiDollarSign, FiBriefcase, FiCalendar, FiRefreshCw } from 'react-icons/fi';
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            title="Total Spent"
                            value={formatCurrency(stats?.counts?.totalSpent || 0)}
                            icon={FiDollarSign}
                            colorClass="text-green-600 dark:text-green-400"
                            borderClass="border-green-500"
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
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-white/5 transition-all hover:shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FiUsers className="text-deep-blue dark:text-blue-400" />
                                Player Roles
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">Distribution</span>
                        </div>
                        <div className="flex justify-center h-64 items-center">
                            {stats?.charts?.roles?.length > 0 ? (
                                <DonutChart data={stats?.charts?.roles} size={220} />
                            ) : (
                                <p className="text-gray-400">No data available</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Tournament Progress Chart */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-white/5 transition-all hover:shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FiActivity className="text-deep-blue dark:text-blue-400" />
                                Match Status
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">Overview</span>
                        </div>
                        <div className="flex justify-center h-64 items-center">
                            {stats?.charts?.matchStats?.length > 0 ? (
                                <DonutChart data={stats?.charts?.matchStats} size={220} />
                            ) : (
                                <p className="text-gray-400">No matches scheduled</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activity / Quick Actions */}
                {stats?.recentAuctions?.length > 0 && (
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <FiCalendar className="text-indigo-500" />
                            Recent Auctions
                        </h3>
                        <div className="space-y-4">
                            {stats.recentAuctions.map((auction, idx) => (
                                <div key={auction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-white hover:shadow-md dark:hover:bg-white/10 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${idx % 2 === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
                                            {auction.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white text-sm group-hover:text-deep-blue dark:group-hover:text-blue-400 transition-colors">{auction.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(auction.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold border ${auction.status === 'Live' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30 animate-pulse' :
                                            auction.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30' :
                                                'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-700'
                                            }`}>
                                            {auction.status || 'Draft'}
                                        </span>
                                        <Link to={`/auction/${auction.id}/transfer-window`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Transfer Window">
                                            <FiRefreshCw size={14} />
                                        </Link>
                                    </div>
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
