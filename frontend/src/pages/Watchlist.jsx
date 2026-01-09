import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiUser, FiSmartphone, FiTrash2, FiSearch, FiStar, FiActivity, FiArrowLeft } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';

const Watchlist = () => {
    const { user } = useAuth();
    const { formatCurrency } = useCurrency();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 6;

    useEffect(() => {
        if (user) {
            fetchInWatchlist();
        }
    }, [user, currentPage]); // Re-fetch on page change

    const fetchInWatchlist = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/watchlist/${user.id}?page=${currentPage}&limit=${limit}`);
            setPlayers(res.data.players || []);
            setTotalPages(res.data.totalPages || 1);
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
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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

                                            <div className="flex flex-col gap-1 mt-2 w-full px-2">
                                                {/* Role Badge */}
                                                <div className="flex justify-center">
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${getRoleBadgeStyle(player.role)}`}>
                                                        {player.role}
                                                    </span>
                                                </div>

                                                {/* Auction Specific Badges */}
                                                {player.auctions && player.auctions.length > 0 ? (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        {player.auctions.map((auc, idx) => (
                                                            <div key={idx} className="flex flex-col gap-1 bg-gray-50 p-2 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        {auc.auction_image ? (
                                                                            <img src={`http://localhost:5000/${auc.auction_image.replace(/\\/g, '/')}`} className="w-5 h-5 object-contain rounded-full bg-white border border-gray-100" title={auc.auction_name} />
                                                                        ) : (
                                                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">A</div>
                                                                        )}
                                                                        <span className="text-xs font-bold text-gray-700 truncate" title={auc.auction_name}>{auc.auction_name}</span>
                                                                    </div>

                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${auc.status === 'Sold' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                        auc.status === 'Unsold' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                                        }`}>
                                                                        {auc.status}
                                                                    </span>
                                                                </div>

                                                                {(auc.status === 'Sold' || auc.team) && (
                                                                    <div className="flex items-center justify-between pl-7">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {auc.team_image ? (
                                                                                <img src={`http://localhost:5000/${auc.team_image.replace(/\\/g, '/')}`} className="w-5 h-5 object-contain" title={auc.team} />
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-gray-400">Team</span>
                                                                            )}
                                                                            <span className="text-xs font-semibold text-gray-800">{auc.team || 'Unknown'}</span>
                                                                        </div>
                                                                        {auc.sold_price > 0 && (
                                                                            <span className="text-xs font-mono font-bold text-emerald-600">{formatCurrency(auc.sold_price)}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center mt-1">
                                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Running in Global Pool</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-4 text-[10px] text-gray-500">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                <span>Age:</span>
                                                <span className="font-semibold text-gray-700">
                                                    {player.dob ? Math.floor((new Date() - new Date(player.dob)) / 31557600000) + ' Yrs' : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                <span>Mobile:</span>
                                                <span className="font-semibold text-gray-700 truncate max-w-[80px]" title={player.mobile_number}>{player.mobile_number || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                <span>Batting:</span>
                                                <span className="font-semibold text-gray-700 truncate max-w-[70px]" title={player.batting_type}>{player.batting_type || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                <span>Bowling:</span>
                                                <span className="font-semibold text-gray-700 truncate max-w-[70px]" title={player.bowling_type}>{player.bowling_type || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
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
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {!loading && players.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center mt-10 gap-3 items-center pb-10">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm items-center">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
                        >
                            <FiArrowLeft className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Watchlist;
