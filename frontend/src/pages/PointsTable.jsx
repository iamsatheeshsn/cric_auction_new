import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft, FiFilter, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import ShareCardModal from '../components/social/ShareCardModal';
import PointsTableCard from '../components/social/templates/PointsTableCard';
import { FiShare2 } from 'react-icons/fi';

const PointsTable = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(id || '');

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [allFixturesCompleted, setAllFixturesCompleted] = useState(false);

    useEffect(() => {
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (selectedAuction) {
            fetchPointsTable(selectedAuction);
            fetchFixturesStatus(selectedAuction);
        }
    }, [selectedAuction]);

    const fetchFixturesStatus = async (auctionId) => {
        try {
            const res = await api.get(`/fixtures/${auctionId}`);
            const fixtures = res.data;
            if (fixtures && fixtures.length > 0) {
                const allCompleted = fixtures.every(f => f.status === 'Completed');
                setAllFixturesCompleted(allCompleted);
            } else {
                // If no fixtures exist, we can't say it's completed in terms of "all matches done"
                setAllFixturesCompleted(false);
            }
        } catch (error) {
            console.error("Failed to load fixtures status", error);
            setAllFixturesCompleted(false);
        }
    };

    const fetchAuctions = async () => {
        try {
            const res = await api.get('/auctions');
            const list = res.data.auctions || res.data;
            setAuctions(list);

            if (!selectedAuction && list.length > 0) {
                const active = list.find(a => a.status === 'Live' || a.status === 'Completed') || list[0];
                setSelectedAuction(active.id);
            }
        } catch (error) {
            console.error("Failed to load auctions", error);
        }
    };

    const fetchPointsTable = async (auctionId) => {
        setLoading(true);
        try {
            const response = await api.get(`/tournament/auction/${auctionId}/points`);
            setStandings(response.data);
        } catch (error) {
            console.error('Error fetching points table:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuctionChange = (e) => {
        const newId = e.target.value;
        setSelectedAuction(newId);
        navigate(`/auction/${newId}/points`);
    };

    // Calculate derived state
    // Calculate derived state
    // Calculate derived state
    const currentAuction = auctions.find(a => String(a.id) === String(selectedAuction));

    // Flexible check: Show Qualifiers ONLY if all fixtures are strictly completed
    const showQualifiers = allFixturesCompleted;

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex-1">
                            <motion.button
                                whileHover={{ x: -4 }}
                                onClick={() => navigate('/auctions')}
                                className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-medium mb-4 transition-colors"
                            >
                                <FiArrowLeft /> Back to Auctions
                            </motion.button>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                                Points Table <span className="text-blue-600">.</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                                <FiTrendingUp className="text-blue-500" />
                                Live Tournament Standings
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            {/* Auction Selector */}
                            <div className="relative group min-w-[260px]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors z-10">
                                    <FiFilter size={18} />
                                </div>
                                <select
                                    value={selectedAuction}
                                    onChange={handleAuctionChange}
                                    className="w-full pl-12 pr-10 py-4 bg-white border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-700 font-bold appearance-none shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-sm"
                                >
                                    <option value="" disabled>Select Tournament</option>
                                    {auctions.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                            </div>

                            {/* Share Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsShareModalOpen(true)}
                                disabled={loading || standings.length === 0}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                <FiShare2 size={18} />
                                <span className="hidden sm:inline">Share Table</span>
                                <span className="sm:hidden">Share</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="max-w-7xl mx-auto h-96 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 font-medium animate-pulse">Computing Standings...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl mx-auto"
                    >
                        {standings.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {/* Table Headers (Desktop) */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <div className="col-span-1 text-center">Pos</div>
                                    <div className="col-span-4 pl-2">Team</div>
                                    <div className="col-span-1 text-center">P</div>
                                    <div className="col-span-1 text-center">W</div>
                                    <div className="col-span-1 text-center">L</div>
                                    <div className="col-span-1 text-center">N/R</div>
                                    <div className="col-span-1 text-center">Pts</div>
                                    <div className="col-span-2 text-right pr-4">NRR</div>
                                </div>

                                {/* Floating Rows */}
                                {standings.map((team, index) => {
                                    const isQualifying = showQualifiers && index < 4;
                                    return (
                                        <motion.div
                                            key={team.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`relative overflow-hidden group bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:py-5 md:px-6 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-100 transition-all duration-300 ${isQualifying ? 'ring-1 ring-emerald-500/10' : ''}`}
                                        >
                                            {/* Qualifier Indicator Strip */}
                                            {isQualifying && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>}

                                            <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                                                {/* Rank */}
                                                <div className="col-span-2 md:col-span-1 flex justify-center">
                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm md:text-base shadow-inner ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-slate-100 text-slate-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                                                isQualifying ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Team Info */}
                                                <div className="col-span-10 md:col-span-4 flex items-center gap-4 pl-2">
                                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                                                        {team.Team?.image_path ? (
                                                            <img src={`http://localhost:5000/${team.Team.image_path}`} className="w-full h-full object-cover rounded-lg" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">
                                                                {team.Team?.short_name?.slice(0, 2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-slate-800 text-sm md:text-lg truncate group-hover:text-blue-600 transition-colors">
                                                            {team.Team?.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 font-medium truncate flex items-center gap-1">
                                                            {team.Team?.short_name}
                                                            {team.Team?.owner_name && <span className="hidden sm:inline">• {team.Team.owner_name}</span>}
                                                            {isQualifying && <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 rounded ml-2"><FiCheckCircle size={10} /> Q</span>}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stats (Desktop: Grid, Mobile: Hidden/Simplified) */}
                                                {/* Desktop View */}
                                                <div className="hidden md:block col-span-1 text-center font-bold text-slate-600">{team.played}</div>
                                                <div className="hidden md:block col-span-1 text-center font-bold text-emerald-600">{team.won}</div>
                                                <div className="hidden md:block col-span-1 text-center font-bold text-rose-500">{team.lost}</div>
                                                <div className="hidden md:block col-span-1 text-center font-bold text-slate-400">{team.no_result + team.tied}</div>

                                                <div className="hidden md:block col-span-1 text-center">
                                                    <span className="font-black text-slate-900 text-xl">{team.points}</span>
                                                </div>

                                                <div className="hidden md:block col-span-2 text-right font-mono font-medium text-slate-500 pr-4">
                                                    <span className={`${team.nrr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {team.nrr > 0 ? '+' : ''}{parseFloat(team.nrr).toFixed(3)}
                                                    </span>
                                                </div>

                                                {/* Mobile View - Compact Stats Row */}
                                                <div className="col-span-12 md:hidden flex justify-between items-center bg-slate-50/50 rounded-lg p-3 mt-2">
                                                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                                                        <span>P: <b className="text-slate-800">{team.played}</b></span>
                                                        <span>W: <b className="text-emerald-600">{team.won}</b></span>
                                                        <span>L: <b className="text-rose-500">{team.lost}</b></span>
                                                        <span>NR: <b>{team.no_result + team.tied}</b></span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs font-mono font-bold ${team.nrr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {team.nrr > 0 ? '+' : ''}{parseFloat(team.nrr).toFixed(3)}
                                                        </span>
                                                        <span className="bg-slate-900 text-white text-sm font-bold px-2.5 py-1 rounded-md min-w-[32px] text-center">
                                                            {team.points}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] p-16 text-center shadow-sm border border-slate-100">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiFilter className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Standings Data</h3>
                                <p className="text-slate-500">Matches need to be played to generate the points table.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Legend / Info Footer */}
                {!loading && standings.length > 0 && (
                    <div className="max-w-7xl mx-auto mt-8 flex flex-wrap gap-4 justify-center md:justify-start text-xs font-medium text-slate-400">
                        {showQualifiers && (
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Top 4 Qualify</span>
                        )}
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Win (+2)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Loss (0)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> No Result (+1)</span>
                    </div>
                )}
            </div>

            {/* Share Card Modal */}
            <ShareCardModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title="Share Points Table"
            >
                <PointsTableCard
                    data={{
                        matchTitle: currentAuction?.name || 'Tournament Standings',
                        date: new Date().toLocaleDateString(),
                        showQualifiers: showQualifiers,
                        standings: standings.map(t => ({
                            pos: standings.indexOf(t) + 1,
                            team: t.Team?.name || t.Team?.short_name || 'Team',
                            logo: t.Team?.image_path,
                            p: t.played,
                            w: t.won,
                            l: t.lost,
                            pts: t.points,
                            nrr: parseFloat(t.nrr).toFixed(3)
                        }))
                    }}
                />
            </ShareCardModal>
        </Layout>
    );
};

export default PointsTable;
