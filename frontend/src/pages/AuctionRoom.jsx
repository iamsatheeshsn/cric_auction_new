import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiUser, FiArrowRight, FiSkipForward, FiMonitor, FiActivity, FiDollarSign, FiUsers, FiCpu, FiInfo } from 'react-icons/fi';
import api from '../api/axios';
import { getAuctionAdvice } from '../utils/AIModel';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerInfoModal from '../components/PlayerInfoModal';

// Enhanced Celebration Component
const SoldCelebration = () => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none bg-black/20 backdrop-blur-sm"
    >
        <motion.div
            animate={{
                rotate: [-5, 5, -5],
                scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="p-12 rounded-3xl bg-white shadow-2xl border-4 border-green-500 transform -rotate-6"
        >
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 drop-shadow-sm">
                SOLD!
            </h1>
        </motion.div>
    </motion.div>
);

const AuctionRoom = () => {
    const { auctionId } = useParams();
    const navigate = useNavigate();

    const [auction, setAuction] = useState(null);
    const [players, setPlayers] = useState([]); // All players
    const [teams, setTeams] = useState([]);

    const [soldPlayers, setSoldPlayers] = useState([]);
    const [unsoldPassedPlayers, setUnsoldPassedPlayers] = useState([]); // passed/unsold
    const [viewMode, setViewMode] = useState(null); // 'available', 'sold', 'unsold'

    const [unsoldPlayers, setUnsoldPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);

    const [currentBidder, setCurrentBidder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // UI States
    const [isSoldAnimation, setIsSoldAnimation] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, status: null });
    const [infoPlayer, setInfoPlayer] = useState(null);
    const [unsoldPoolOpen, setUnsoldPoolOpen] = useState(false);
    const [revisitLoading, setRevisitLoading] = useState(null);
    const [selectedTeamViewer, setSelectedTeamViewer] = useState(null);

    const processingRef = useRef(false);

    useEffect(() => {
        loadData();
    }, [auctionId]);

    const loadData = async () => {
        try {
            const [aucRes, plyRes, teamRes] = await Promise.all([
                api.get(`/auctions/${auctionId}`),
                api.get(`/players/auction/${auctionId}?limit=1000`),
                api.get(`/teams/auction/${auctionId}?limit=1000`)
            ]);

            const auctionData = aucRes.data;
            setAuction(auctionData);

            // Auto-Start Auction logic
            if (auctionData.status === 'Upcoming' && !processingRef.current) {
                processingRef.current = true;
                try {
                    await api.put(`/auctions/${auctionId}`, { status: 'Live' });
                    setAuction(prev => ({ ...prev, status: 'Live' }));
                    toast.success("Auction Started! 🔴 Live Now");
                } catch (err) {
                    console.error("Failed to auto-start", err);
                }
            }

            const allPlayers = plyRes.data.players || [];
            const allTeams = teamRes.data.teams || [];

            setPlayers(allPlayers);
            setTeams(allTeams);

            setUnsoldPlayers(allPlayers.filter(p => p.status === 'Available').sort((a, b) => a.id - b.id));
            setSoldPlayers(allPlayers.filter(p => p.status === 'Sold').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            setUnsoldPassedPlayers(allPlayers.filter(p => p.status === 'Unsold').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));

        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load auction data");
        }
    };

    const handleStatusChange = (newStatus) => {
        setStatusModal({ isOpen: true, status: newStatus });
    };

    const executeStatusChange = async () => {
        const newStatus = statusModal.status;
        if (!newStatus) return;

        try {
            await api.put(`/auctions/${auctionId}`, { status: newStatus });
            setAuction(prev => ({ ...prev, status: newStatus }));
            toast.success(`Auction ${newStatus}`);
            if (newStatus === 'Completed') {
                navigate('/auctions');
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
        setStatusModal({ isOpen: false, status: null });
    };

    // Filtered Players Logic
    const filteredUnsoldPlayers = unsoldPlayers.filter(p => {
        if (!searchTerm) return false;
        if (!isNaN(searchTerm) && searchTerm.trim() !== '') {
            return p.order_id === parseInt(searchTerm);
        }
        return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const [bidHistory, setBidHistory] = useState([]);

    const addToHistory = () => {
        setBidHistory(prev => [...prev, { bid: currentBid, bidder: currentBidder }]);
    };

    const handleUndo = () => {
        if (bidHistory.length === 0) return;
        const lastState = bidHistory[bidHistory.length - 1];
        setCurrentBid(lastState.bid);
        setCurrentBidder(lastState.bidder);
        setBidHistory(prev => prev.slice(0, -1));
        syncLiveBid(lastState.bid, lastState.bidder?.id);
    };

    const startPlayerAuction = async (player) => {
        setCurrentPlayer(player);
        setCurrentBid(auction?.min_bid || 0);
        setCurrentBidder(null);
        setBidHistory([]);
        try {
            await api.put(`/auctions/${auctionId}/current-player`, { playerId: player.id });
        } catch (err) {
            console.error("Failed to sync player", err);
        }
    };

    const syncLiveBid = async (amount, bidderId) => {
        try {
            await api.put(`/auctions/${auctionId}/live-bid`, { amount, bidderId });
        } catch (error) {
            console.error("Failed to sync live bid", error);
        }
    };

    const handleBidIncrease = async (amount) => {
        addToHistory();
        const newBid = (parseInt(currentBid) || 0) + parseInt(amount);
        setCurrentBid(newBid);
        await syncLiveBid(newBid, currentBidder?.id);
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
    };

    const handleSell = async (teamId) => {
        if (!currentPlayer) return;
        try {
            setIsSoldAnimation(true);
            setTimeout(async () => {
                await api.post(`/players/${currentPlayer.id}/sold`, {
                    team_id: teamId,
                    sod_price: currentBid
                });
                await loadData();
                setCurrentPlayer(null);
                setIsSoldAnimation(false);
            }, 1500);
        } catch (error) {
            alert(error.response?.data?.message || "Sale failed!");
            setIsSoldAnimation(false);
        }
    };

    const handleUnsold = async () => {
        if (!currentPlayer) return;
        try {
            await api.post(`/players/${currentPlayer.id}/unsold`);
            setCurrentPlayer(null);
            await loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRevisit = async (playerId) => {
        setRevisitLoading(playerId);
        try {
            await api.put(`/players/${playerId}/revisit`);
            toast.success("Player returned to Upcoming pool!");
            loadData();
            setUnsoldPoolOpen(false);
        } catch (error) {
            console.error("Revisit error:", error);
            toast.error("Failed to bring player back");
        } finally {
            setRevisitLoading(null);
        }
    };

    const skipPlayer = async () => {
        setCurrentPlayer(null);
        try {
            await api.put(`/auctions/${auctionId}/current-player`, { playerId: null });
        } catch (err) {
            console.error("Failed to sync skip", err);
        }
    };

    if (!auction) return <div className="h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-bold">Loading Arena...</div>;

    const PlayerListModal = ({ title, players, onClose, colorClass }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            >
                <div className={`p-6 ${colorClass} text-white flex justify-between items-center bg-gradient-to-r from-transparent to-white/10`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <FiUsers className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">{title} <span className="text-white/60 text-lg font-medium ml-2">{players.length}</span></h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.map(p => (
                            <motion.div
                                layoutId={p.id}
                                key={p.id}
                                onClick={() => setInfoPlayer(p)}
                                className="group relative bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-500" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0 group-hover:border-blue-200 transition-colors">
                                        {p.image_path ? (
                                            <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><FiUser size={24} /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{p.role}</p>
                                        {p.Team && <div className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Sold: {p.Team.short_name}</div>}
                                        {p.sold_price > 0 && <span className="ml-2 text-xs text-gray-500">₹{p.sold_price.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {players.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <FiUser size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">No players in this category</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );

    const TeamDetailsModal = ({ team, onClose }) => {
        const teamPlayers = soldPlayers.filter(p =>
            (p.team_id && p.team_id == team.id) || (p.Team?.id && p.Team.id == team.id)
        );

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
                >
                    <div className="relative bg-gradient-to-r from-deep-blue to-blue-900 text-white p-8">
                        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 transform scale-150">
                            {team.image_path && <img src={getImageUrl(team.image_path)} className="w-48 h-48 object-contain" />}
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-xl">
                                    {team.image_path ? <img src={getImageUrl(team.image_path)} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><FiUsers size={32} /></div>}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black mb-3 tracking-tight">{team.name}</h1>
                                    <div className="flex gap-3">
                                        <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Remaining</p>
                                            <p className="text-xl font-bold font-mono">₹{team.purse_remaining.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Squad</p>
                                            <p className="text-xl font-bold font-mono">{teamPlayers.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FiUsers className="text-blue-600" /> Squad Composition
                        </h3>
                        {teamPlayers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teamPlayers.map(p => (
                                    <div key={p.id} onClick={() => setInfoPlayer(p)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 cursor-pointer group">
                                        <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 group-hover:border-blue-300 transition-colors">
                                            {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><FiUser /></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{p.name}</div>
                                            <div className="text-xs text-gray-500 font-medium mb-1">{p.role}</div>
                                            <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block border border-green-100">
                                                ₹{p.sold_price.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 border-3 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <FiUser size={24} />
                                </div>
                                <p className="text-gray-400 font-medium">No players purchased yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <AnimatePresence>
                    {selectedTeamViewer && <TeamDetailsModal team={selectedTeamViewer} onClose={() => setSelectedTeamViewer(null)} />}
                    {viewMode === 'available' && <PlayerListModal title="Available Players" players={unsoldPlayers} onClose={() => setViewMode(null)} colorClass="bg-blue-600" />}
                    {viewMode === 'sold' && <PlayerListModal title="Sold Players" players={soldPlayers} onClose={() => setViewMode(null)} colorClass="bg-green-600" />}
                    {viewMode === 'unsold' && <PlayerListModal title="Unsold Players" players={unsoldPassedPlayers} onClose={() => setViewMode(null)} colorClass="bg-red-500" />}
                    {isSoldAnimation && <SoldCelebration />}
                </AnimatePresence>

                {/* Top Stats Bar */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FiActivity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Auction Arena</h2>
                            <p className="text-sm font-medium text-slate-500">{auction?.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200">
                        {[
                            { id: 'available', label: 'Available', count: unsoldPlayers.length, color: 'blue' },
                            { id: 'sold', label: 'Sold', count: soldPlayers.length, color: 'green' },
                            { id: 'unsold', label: 'UNSOLD', count: unsoldPassedPlayers.length, color: 'red' }
                        ].map(stat => (
                            <button
                                key={stat.id}
                                onClick={() => setViewMode(stat.id)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${stat.color === 'blue' ? 'hover:bg-blue-50 text-blue-600' :
                                    stat.color === 'green' ? 'hover:bg-green-50 text-green-600' :
                                        'hover:bg-red-50 text-red-500'
                                    }`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</span>
                                <span className="text-xl font-black">{stat.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open(`/spectator/${auctionId}`, '_blank')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <FiMonitor /> <span className="hidden sm:inline">Projector</span>
                        </button>
                        <button
                            onClick={() => setUnsoldPoolOpen(true)}
                            className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold border border-gray-200 shadow-sm transition-all flex items-center gap-2 active:scale-95"
                        >
                            <FiSkipForward /> <span className="hidden sm:inline">Pool</span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 mx-2"></div>

                        <div className="flex gap-2">
                            {auction?.status === 'Paused' ? (
                                <button onClick={() => handleStatusChange('Live')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                                    ▶ Resume
                                </button>
                            ) : (
                                <button onClick={() => handleStatusChange('Paused')} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                                    ⏸ Pause
                                </button>
                            )}
                            <button onClick={() => handleStatusChange('Completed')} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                                ⏹ End
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 gap-6 overflow-hidden p-6">
                    {/* LEFT: Player Spotlight Area */}
                    <div className="flex-1 bg-white rounded-3xl shadow-xl border border-white/40 flex flex-col relative overflow-hidden ring-1 ring-black/5">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {currentPlayer ? (
                                <div className="h-full flex flex-col">
                                    <div className="flex gap-8 items-start h-full">
                                        {/* Player Card Image */}
                                        <div className="w-5/12 h-full max-h-[600px] relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 group">
                                            {currentPlayer.image_path ? (
                                                <img src={getImageUrl(currentPlayer.image_path)} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600"><FiUser size={96} /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                                <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-lg uppercase tracking-wider">
                                                    {currentPlayer.role}
                                                </div>
                                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight uppercase italic tracking-tighter drop-shadow-lg break-words">
                                                    {currentPlayer.name}
                                                </h2>
                                                <div className="flex gap-4 mt-4">
                                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Age</p>
                                                        <p className="text-xl font-bold text-white">
                                                            {currentPlayer.dob ? new Date().getFullYear() - new Date(currentPlayer.dob).getFullYear() : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">ID</p>
                                                        <p className="text-xl font-bold text-white">#{currentPlayer.order_id || currentPlayer.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bidding Controls */}
                                        <div className="flex-1 flex flex-col justify-center gap-8 py-4">



                                            <div className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5"><FiDollarSign size={120} /></div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Current Bid Amount</p>
                                                <div className="flex items-baseline gap-4 relative z-10">
                                                    <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 tracking-tighter">
                                                        ₹{(currentBid || 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                {currentBidder ? (
                                                    <div className="mt-4 flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden p-0.5">
                                                            {currentBidder.image_path && <img src={getImageUrl(currentBidder.image_path)} className="w-full h-full object-contain rounded-full" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Held By</p>
                                                            <p className="text-lg font-bold text-blue-900 leading-none">{currentBidder.short_name}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 inline-block px-4 py-2 bg-gray-100 rounded-xl text-gray-400 text-sm font-bold">
                                                        Waiting for opening bid...
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {bidHistory.length > 0 && (
                                                    <button
                                                        onClick={handleUndo}
                                                        className="col-span-2 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                        Undo Last Bid
                                                    </button>
                                                )}

                                                <button
                                                    onClick={handleUnsold}
                                                    className="py-4 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-2xl font-black text-lg transition-all shadow-sm hover:shadow-md active:scale-95 uppercase tracking-wide"
                                                >
                                                    Unsold
                                                </button>
                                                <button
                                                    onClick={() => handleBidIncrease(auction?.bid_increase_by || 100)}
                                                    disabled={!currentBidder}
                                                    className={`py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${!currentBidder
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                                                        : 'bg-gradient-to-r from-deep-blue to-blue-700 text-white hover:shadow-blue-200 hover:scale-[1.02]'
                                                        }`}
                                                >
                                                    <FiArrowRight /> Bid +{auction?.bid_increase_by || 100}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Search State */
                                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
                                    <div className="bg-blue-50 p-6 rounded-full mb-8 shadow-inner">
                                        <FiUser size={48} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">Select Next Player</h2>
                                    <p className="text-slate-400 text-lg mb-10">Search by ID or Name to begin the bidding process</p>

                                    <div className="w-full relative group z-20">
                                        <input
                                            type="text"
                                            placeholder="Type PID (e.g. 24) or Name..."
                                            className="w-full py-5 px-8 pl-14 rounded-2xl bg-white border-2 border-slate-100 text-xl font-bold text-slate-700 shadow-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 placeholder:font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>

                                        {/* Dropdown Results */}
                                        {filteredUnsoldPlayers.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                                                {filteredUnsoldPlayers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => startPlayerAuction(p)}
                                                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-4 group border border-transparent hover:border-slate-100"
                                                    >
                                                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                            {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUser /></div>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-bold text-slate-700 group-hover:text-blue-600">{p.name}</h4>
                                                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md group-hover:bg-blue-100 group-hover:text-blue-600">ID: {p.order_id}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{p.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Teams Panel */}
                    <div className="w-[400px] flex flex-col gap-4">

                        {/* AI Advisor Panel */}
                        {currentBidder && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 shadow-lg border border-white/20 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10"><FiCpu size={60} /></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                                            <FiCpu className="text-cyan-300" />
                                        </div>
                                        <span className="font-bold text-xs uppercase tracking-widest text-indigo-200">Auction IQ Advisor</span>
                                    </div>

                                    {(() => {
                                        // Calculate Advice for Current Bidder
                                        const advice = getAuctionAdvice(
                                            currentBidder,
                                            // Pass sold players for this team
                                            soldPlayers.filter(p => p.team_id === currentBidder.id || (p.Team?.id === currentBidder.id)),
                                            unsoldPlayers,
                                            teams,
                                            soldPlayers,
                                            auction
                                        );
                                        return (
                                            <>
                                                <p className="font-medium text-sm leading-relaxed mb-3">"{advice?.message}"</p>
                                                <div className="bg-black/20 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm border border-white/10">
                                                    <div className="flex items-center gap-1 cursor-help" title="Estimated max bid to ensure you can fill all remaining squad slots">
                                                        <span className="text-xs text-indigo-200 font-bold uppercase">AI Bid Cap</span>
                                                        <FiInfo className="text-indigo-300 text-xs" />
                                                    </div>
                                                    <span className="font-mono font-bold text-cyan-300">₹{advice?.suggestedBidLimit?.toLocaleString()}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        )}

                        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-white/40 flex flex-col relative overflow-hidden ring-1 ring-black/5 flex-shrink-0">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
                                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                                    <FiCheckCircle className="text-green-500" /> Active Teams
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${currentBidder?.id === team.id
                                            ? 'bg-green-50/50 border-green-500 shadow-green-100 shadow-lg scale-[1.02] z-10'
                                            : !currentPlayer
                                                ? 'bg-white border-transparent hover:border-gray-200'
                                                : team.purse_remaining < currentBid
                                                    ? 'bg-gray-50 border-transparent opacity-50 grayscale'
                                                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 p-1 flex-shrink-0">
                                                {team.image_path && <img src={getImageUrl(team.image_path)} className="w-full h-full object-contain rounded-full" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0">
                                                        <h4 className={`font-black text-lg truncate ${currentBidder?.id === team.id ? 'text-green-800' : 'text-slate-800'}`}>
                                                            {team.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{team.short_name}</span>
                                                            <span>•</span>
                                                            <span className="text-slate-400">₹{team.purse_remaining.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {currentBidder?.id === team.id && (
                                                <span className="bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse ml-2 flex-shrink-0">Lead</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedTeamViewer(team)}
                                                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                                            >
                                                View
                                            </button>
                                            {currentPlayer && team.purse_remaining >= currentBid && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (currentBidder?.id === team.id) {
                                                            handleSell(team.id);
                                                        } else {
                                                            addToHistory();
                                                            setCurrentBidder(team);
                                                            syncLiveBid(currentBid, team.id);
                                                        }
                                                    }}
                                                    className={`flex-[2] py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm ${currentBidder?.id === team.id
                                                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:scale-105'
                                                        }`}
                                                >
                                                    {currentBidder?.id === team.id ? 'Confirm Sold' : 'Bid Now'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={statusModal.isOpen}
                    onClose={() => setStatusModal({ isOpen: false, status: null })}
                    onConfirm={executeStatusChange}
                    title={`Mark as ${statusModal.status}`}
                    message={`Are you sure you want to change the auction status to ${statusModal.status}?`}
                    confirmText="Yes, Change It"
                    confirmButtonClass="bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                />

                {/* Unsold Pool */}
                {unsoldPoolOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-black text-slate-800">Unsold Pool</h2>
                                <button onClick={() => setUnsoldPoolOpen(false)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                                {unsoldPassedPlayers.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">No unsold players</div>
                                ) : (
                                    <div className="space-y-3">
                                        {unsoldPassedPlayers.map(p => (
                                            <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                                    {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><FiUser /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-700 truncate">{p.name}</h4>
                                                    <p className="text-xs text-slate-400">{p.role}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRevisit(p.id)}
                                                    disabled={revisitLoading === p.id}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                                >
                                                    Return
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                <PlayerInfoModal player={infoPlayer} isOpen={!!infoPlayer} onClose={() => setInfoPlayer(null)} />
            </div>
        </div >
    );
};

export default AuctionRoom;
