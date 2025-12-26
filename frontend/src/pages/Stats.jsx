import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiAward, FiTarget, FiActivity, FiTrendingUp, FiFilter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Stats = () => {
    const [stats, setStats] = useState({ batters: [], bowlers: [], mvp: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('runs'); // runs, wickets, mvp

    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState('');

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const res = await api.get('/auctions');
                if (res.data.auctions && res.data.auctions.length > 0) {
                    setAuctions(res.data.auctions);
                    setSelectedAuction(res.data.auctions[0].id);
                }
            } catch (err) {
                console.error("Failed to load auctions", err);
            }
        };
        fetchAuctions();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedAuction) return;
            setLoading(true); // Show loading when switching
            try {
                const res = await api.get(`/stats/leaderboard?auctionId=${selectedAuction}`);
                setStats(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedAuction]);

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/60?text=Player';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-deep-blue"></div>
            </div>
        </Layout>
    );

    const renderLeaderboard = (data, type) => {
        if (!data || data.length === 0) return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <FiActivity className="text-4xl text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium">No stats available yet.</p>
            </motion.div>
        );

        const top3 = data.slice(0, 3);
        const rest = data.slice(3);

        const getValue = (item) => {
            if (type === 'runs') return item.total_runs;
            if (type === 'wickets') return item.total_wickets;
            if (type === 'mvp') return item.points;
            return 0;
        };

        const getSubValue = (item) => {
            if (type === 'runs') return `${item.balls_faced} balls`;
            if (type === 'wickets') return `${item.balls_bowled} balls`;
            if (type === 'mvp') return '';
            return '';
        };

        const getPlayer = (item) => {
            if (type === 'mvp') return item;
            return type === 'runs' ? item.Striker : item.Bowler;
        };

        return (
            <div className="space-y-12">
                {/* Podium Section */}
                <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-10 mb-16 mt-8 perspective-1000">

                    {/* 2nd Place (Silver) */}
                    {top3[1] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="order-2 md:order-1 flex flex-col items-center group"
                        >
                            <div className="relative mb-[-25px] z-20">
                                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-gray-300 to-gray-400 shadow-xl">
                                    <img src={getImageUrl(getPlayer(top3[1])?.image_path || getPlayer(top3[1])?.image)} className="w-full h-full object-cover rounded-full border-4 border-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-gray-600 text-white w-8 h-8 flex items-center justify-center font-bold rounded-full border-2 border-white shadow-lg text-sm">2</div>
                            </div>
                            <div className="bg-white w-full md:w-48 pt-10 pb-6 px-4 rounded-2xl text-center shadow-lg border-t-8 border-gray-400 relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-gray-50 to-transparent opacity-50"></div>
                                <h3 className="font-bold text-gray-800 text-lg truncate">{getPlayer(top3[1])?.name}</h3>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">{getPlayer(top3[1])?.Team?.name}</p>
                                <div className="bg-gray-50 rounded-lg py-2 mx-2">
                                    <p className="text-3xl font-black text-gray-700 leading-none">{getValue(top3[1])}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{type === 'runs' ? 'Runs' : type === 'wickets' ? 'Wickets' : 'Points'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 1st Place (Gold) */}
                    {top3[0] && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="order-1 md:order-2 flex flex-col items-center z-30"
                        >
                            <div className="relative mb-[-35px] z-20">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 text-5xl drop-shadow-lg filter">
                                    <FiAward />
                                </div>
                                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-2xl ring-4 ring-yellow-100/50">
                                    <img src={getImageUrl(getPlayer(top3[0])?.image_path || getPlayer(top3[0])?.image)} className="w-full h-full object-cover rounded-full border-4 border-white" />
                                </div>
                                <div className="absolute -bottom-3 -right-0 bg-yellow-500 text-white w-10 h-10 flex items-center justify-center font-bold text-xl rounded-full border-4 border-white shadow-lg">1</div>
                            </div>
                            <div className="bg-gradient-to-b from-yellow-50 via-white to-white w-full md:w-56 pt-14 pb-8 px-4 rounded-3xl text-center shadow-2xl border-t-8 border-yellow-400 relative overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                <h3 className="font-black text-gray-900 text-xl truncate">{getPlayer(top3[0])?.name}</h3>
                                <p className="text-yellow-700 text-xs font-bold uppercase tracking-wider mb-4">{getPlayer(top3[0])?.Team?.name}</p>

                                <div className="bg-yellow-100/30 rounded-xl py-3 mx-2 border border-yellow-100">
                                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-500 leading-none">{getValue(top3[0])}</p>
                                    <p className="text-[10px] text-yellow-600 font-black uppercase mt-1 tracking-[0.2em]">{type === 'runs' ? 'Runs' : type === 'wickets' ? 'Wickets' : 'Points'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* 3rd Place (Bronze) */}
                    {top3[2] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="order-3 flex flex-col items-center group"
                        >
                            <div className="relative mb-[-25px] z-20">
                                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-orange-300 to-orange-500 shadow-xl">
                                    <img src={getImageUrl(getPlayer(top3[2])?.image_path || getPlayer(top3[2])?.image)} className="w-full h-full object-cover rounded-full border-4 border-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white w-8 h-8 flex items-center justify-center font-bold rounded-full border-2 border-white shadow-lg text-sm">3</div>
                            </div>
                            <div className="bg-white w-full md:w-48 pt-10 pb-6 px-4 rounded-2xl text-center shadow-lg border-t-8 border-orange-400 relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-300">
                                <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-orange-50 to-transparent opacity-50"></div>
                                <h3 className="font-bold text-gray-800 text-lg truncate">{getPlayer(top3[2])?.name}</h3>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">{getPlayer(top3[2])?.Team?.name}</p>
                                <div className="bg-orange-50/50 rounded-lg py-2 mx-2">
                                    <p className="text-3xl font-black text-gray-700 leading-none">{getValue(top3[2])}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{type === 'runs' ? 'Runs' : type === 'wickets' ? 'Wickets' : 'Points'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* List View */}
                {rest.length > 0 && (
                    <div className="w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 pl-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-20">Rank</th>
                                        <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player Info</th>
                                        <th className="p-4 pr-8 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{type === 'runs' ? 'Runs' : type === 'wickets' ? 'Wickets' : 'Points'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rest.map((item, index) => (
                                        <motion.tr
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.05 }}
                                            key={index}
                                            className="hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <td className="p-4 pl-6">
                                                <span className="font-bold text-gray-400 text-lg group-hover:text-deep-blue transition-colors">#{index + 4}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-transparent group-hover:border-deep-blue/20 transition-all shadow-sm">
                                                        <img src={getImageUrl(getPlayer(item)?.image_path || getPlayer(item)?.image)} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-base">{getPlayer(item)?.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{getPlayer(item)?.Team?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 pr-8 text-right">
                                                <p className="font-black text-gray-800 text-xl">{getValue(item)}</p>
                                                {getSubValue(item) && <p className="text-xs text-gray-400 font-medium">{getSubValue(item)}</p>}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const tabClass = (tab, color) => `
        relative px-8 py-3 rounded-full font-bold transition-all duration-300 outline-none
        ${activeTab === tab ? 'text-white shadow-lg scale-105' : 'text-gray-500 hover:text-gray-800 hover:bg-white'}
        ${activeTab === tab && color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-red-500' : ''}
        ${activeTab === tab && color === 'purple' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : ''}
        ${activeTab === tab && color === 'green' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : ''}
    `;

    return (
        <Layout>
            <div className="mb-12 text-center space-y-4">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-deep-blue to-purple-800"
                >
                    Tournament Leaders
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 font-medium text-lg"
                >
                    Celebrating the top performers of the season
                </motion.p>
            </div>

            {/* Auction Selector */}
            <div className="flex justify-center mb-8">
                <div className="relative w-full md:w-80">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium text-gray-700"
                        value={selectedAuction}
                        onChange={(e) => setSelectedAuction(e.target.value)}
                    >
                        {auctions.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({new Date(a.auction_date).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex justify-center mb-16">
                <div className="bg-gray-100/80 p-1.5 rounded-full inline-flex shadow-inner backdrop-blur-sm">
                    <button onClick={() => setActiveTab('runs')} className={tabClass('runs', 'orange')}>
                        <span className="flex items-center gap-2 text-sm md:text-base"><FiTrendingUp /> Top Run Scorers</span>
                    </button>
                    <button onClick={() => setActiveTab('wickets')} className={tabClass('wickets', 'purple')}>
                        <span className="flex items-center gap-2 text-sm md:text-base"><FiTarget /> Top Wicket Takers</span>
                    </button>
                    <button onClick={() => setActiveTab('mvp')} className={tabClass('mvp', 'green')}>
                        <span className="flex items-center gap-2 text-sm md:text-base"><FiAward /> MVP Table</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode='wait'>
                {activeTab === 'runs' && (
                    <motion.div
                        key="runs"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderLeaderboard(stats.batters, 'runs')}
                    </motion.div>
                )}

                {activeTab === 'wickets' && (
                    <motion.div
                        key="wickets"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderLeaderboard(stats.bowlers, 'wickets')}
                    </motion.div>
                )}

                {activeTab === 'mvp' && (
                    <motion.div
                        key="mvp"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderLeaderboard(stats.mvp, 'mvp')}
                    </motion.div>
                )}
            </AnimatePresence>

        </Layout>
    );
};

export default Stats;
