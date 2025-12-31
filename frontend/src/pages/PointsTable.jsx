import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft, FiFilter, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

const PointsTable = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(id || '');

    useEffect(() => {
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (selectedAuction) {
            fetchPointsTable(selectedAuction);
        }
    }, [selectedAuction]);

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

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50/50 -m-8 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/auctions')} className="group p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                            <FiArrowLeft className="text-gray-400 group-hover:text-blue-600 transition-colors" size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Points Table</h1>
                            <p className="text-gray-500 font-medium flex items-center gap-2">
                                <FiTrendingUp className="text-blue-500" /> Tournament Standings
                            </p>
                        </div>
                    </div>

                    {/* Auction Selector */}
                    <div className="relative group">
                        <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors z-10" />
                        <select
                            value={selectedAuction}
                            onChange={handleAuctionChange}
                            className="pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-bold min-w-[240px] appearance-none shadow-sm hover:shadow-md transition-all cursor-pointer relative z-0"
                        >
                            <option value="" disabled>Select Auction</option>
                            {auctions.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                        <p className="text-gray-400 font-medium animate-pulse">Calculating Stats...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden border border-gray-100"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-left">
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-16 text-center">Pos</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-auto">Team</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-20">Played</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-20 text-green-400">Won</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-20 text-red-400">Lost</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-20 text-gray-400">N/R</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-24 bg-slate-800">Points</th>
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-28">NRR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {standings.length > 0 ? (
                                        standings.map((team, index) => {
                                            const isQualifying = index < 4;
                                            return (
                                                <tr
                                                    key={team.id}
                                                    className={`group transition-all hover:bg-blue-50/30 ${isQualifying ? 'bg-gradient-to-r from-green-50/30 to-transparent' : ''}`}
                                                >
                                                    <td className="px-4 py-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm transition-transform group-hover:scale-110 ${isQualifying ? 'bg-green-500 text-white shadow-green-200' : 'bg-gray-100 text-gray-400'}`}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-white border border-gray-100 p-1 shadow-sm overflow-hidden">
                                                                {team.Team?.image_path ? (
                                                                    <img src={`http://localhost:5000/${team.Team.image_path}`} className="w-full h-full object-cover rounded-lg" alt="" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-[10px] bg-gray-50 rounded-lg">
                                                                        {team.Team?.short_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors">{team.Team?.name}</h3>
                                                                    {isQualifying && <FiCheckCircle className="text-green-500" size={12} title="Qualification Spot" />}
                                                                </div>
                                                                {team.Team?.owner_name && <p className="text-[10px] text-gray-400 font-medium">Owner: {team.Team.owner_name}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="font-bold text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">{team.played}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="font-bold text-xs text-green-600">{team.won}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="font-bold text-xs text-red-500">{team.lost}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className="font-bold text-xs text-gray-400">{team.no_result + team.tied}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center bg-gray-50/50 group-hover:bg-blue-50/20 transition-colors">
                                                        <span className="font-black text-lg text-slate-900 tracking-tight">{team.points}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${team.nrr >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                                            {team.nrr > 0 ? '+' : ''}{parseFloat(team.nrr).toFixed(3)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                                                        <FiFilter size={32} />
                                                    </div>
                                                    <p className="text-lg font-medium">No standings available yet.</p>
                                                    <p className="text-sm opacity-60">Matches will appear here once they start.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default PointsTable;
