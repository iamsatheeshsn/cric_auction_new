import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiUser, FiSmartphone, FiTrash2, FiSearch, FiStar, FiActivity } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const Watchlist = () => {
    const { user } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) {
            fetchInWatchlist();
        }
    }, [user]);

    const fetchInWatchlist = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/watchlist/${user.id}`);
            setPlayers(res.data.players || []);
        } catch (error) {
            console.error("Failed to fetch watchlist", error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWatchlist = async (e, player) => {
        e.stopPropagation();
        try {
            await api.delete(`/watchlist/${player.id}`, { data: { user_id: user.id } });
            setPlayers(prev => prev.filter(p => p.id !== player.id));
            toast.success("Removed from watchlist");
        } catch (error) {
            console.error("Failed to remove", error);
            toast.error("Failed to remove from watchlist");
        }
    };

    const getRoleGradient = (role) => {
        switch (role?.toLowerCase()) {
            case 'batsman': return 'from-blue-500 to-cyan-400';
            case 'bowler': return 'from-emerald-500 to-teal-400';
            case 'all rounder': return 'from-purple-500 to-indigo-400';
            case 'wicket keeper': return 'from-orange-500 to-amber-400';
            default: return 'from-gray-500 to-slate-400';
        }
    };

    const getRoleBadgeStyle = (role) => {
        switch (role?.toLowerCase()) {
            case 'batsman': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'bowler': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'all rounder': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'wicket keeper': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.Team && p.Team.short_name.toLowerCase().includes(search.toLowerCase()))
    );

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
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        },
        exit: { scale: 0.9, opacity: 0 }
    };

    return (
        <Layout>
            <div className="min-h-screen">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight"
                        >
                            My Watchlist
                        </motion.h1>
                        <motion.p
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 mt-2 font-medium"
                        >
                            Track your favorite players and their auction status.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative w-full md:w-96"
                    >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <FiSearch className="text-xl" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or team..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium text-gray-700"
                        />
                    </motion.div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-deep-blue"></div>
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 text-center"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <FiStar className="text-4xl text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Watchlist is Empty</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Start marking players as favorites from the main list to keep track of their auction journey here.
                        </p>
                        <Link
                            to="/players"
                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                        >
                            <FiUser /> Browse Players
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filteredPlayers.map(player => (
                                <motion.div
                                    key={player.id}
                                    variants={itemVariants}
                                    layout
                                    exit="exit"
                                    className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
                                >
                                    {/* Top Background Gradient based on Role */}
                                    <div className={`h-24 bg-gradient-to-r ${getRoleGradient(player.role)} opacity-10 group-hover:opacity-20 transition-opacity`} />

                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => removeFromWatchlist(e, player)}
                                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                                        title="Remove from Watchlist"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>

                                    {/* Content Container */}
                                    <div className="px-5 pb-5 -mt-12 relative">
                                        {/* Player Image & Name */}
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg rotate-3 group-hover:rotate-0 transition-all duration-500 mb-4">
                                                <div className="w-full h-full rounded-xl overflow-hidden bg-gray-50 relative">
                                                    {player.image_path ? (
                                                        <img
                                                            src={`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`}
                                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                            alt={player.name}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <FiUser size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                                {player.name}
                                            </h3>

                                            <div className="flex flex-wrap gap-2 justify-center mt-2">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${getRoleBadgeStyle(player.role)}`}>
                                                    {player.role}
                                                </span>
                                                {player.Team && (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border border-gray-200 bg-gray-50 text-gray-600">
                                                        {player.Team.short_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 mt-6 mb-4">
                                            <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100 group-hover:border-gray-200 transition-colors">
                                                <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Mat</div>
                                                <div className="font-bold text-gray-800">{player.stats?.matches || 0}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100 group-hover:border-gray-200 transition-colors">
                                                <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Run</div>
                                                <div className="font-bold text-gray-800">{player.stats?.runs || 0}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100 group-hover:border-gray-200 transition-colors">
                                                <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Wkt</div>
                                                <div className="font-bold text-gray-800">{player.stats?.wickets || 0}</div>
                                            </div>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs font-medium">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <FiSmartphone className="text-gray-400" />
                                                <span className="group-hover:text-gray-700 transition-colors">{player.mobile_number || 'N/A'}</span>
                                            </div>

                                            {player.sold_price ? (
                                                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    <FiActivity />
                                                    <span>₹{player.sold_price.toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 bg-gray-50 px-2 py-1 rounded-lg opacity-0">
                                                    {/* Placeholder to keep layout consistent or remove entirely */}
                                                    -
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default Watchlist;
