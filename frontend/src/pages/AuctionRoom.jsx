import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiUser, FiArrowRight, FiSkipForward, FiMonitor, FiActivity, FiDollarSign, FiUsers, FiCpu, FiInfo, FiExternalLink } from 'react-icons/fi';
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

const FireAnimation = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
    >
        <div className="text-center relative">
            <h1 className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 animate-pulse drop-shadow-2xl tracking-tighter">
                🔥 BIDDING WAR 🔥
            </h1>
            <p className="text-white font-bold text-2xl mt-4 text-shadow uppercase tracking-widest animate-bounce">Rapid Fire Bidding Detected!</p>
        </div>
    </motion.div>
);

const AuctionRoom = () => {
    const { auctionId } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocket();

    const [auction, setAuction] = useState(null);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [currentBidder, setCurrentBidder] = useState(null);

    // Filtered lists
    const [unsoldPlayers, setUnsoldPlayers] = useState([]);
    const [soldPlayers, setSoldPlayers] = useState([]);
    const [unsoldPassedPlayers, setUnsoldPassedPlayers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, status: null });

    const [viewMode, setViewMode] = useState(null); // 'sold', 'unsold', or null
    const [infoPlayer, setInfoPlayer] = useState(null);
    const [isSoldAnimation, setIsSoldAnimation] = useState(false);
    const [isBiddingWar, setIsBiddingWar] = useState(false);

    // Unsold Modal State
    const [unsoldPoolOpen, setUnsoldPoolOpen] = useState(false);
    const [revisitLoading, setRevisitLoading] = useState(null);
    const [selectedTeamViewer, setSelectedTeamViewer] = useState(null);

    const processingRef = useRef(false);

    // Timer Audio Refs
    const timerAudioRef = useRef(new Audio('/assets/sounds/timer.mp3'));

    useEffect(() => {
        // Configure continuous loop
        timerAudioRef.current.loop = true;
        timerAudioRef.current.volume = 0.3; // Background usage

        return () => {
            if (timerAudioRef.current) timerAudioRef.current.pause();
        };
    }, []);

    // Manage Background Sound
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const shouldPlay = !isMuted && auction && auction.status === 'Live' && currentPlayer && !isSoldAnimation;
        if (shouldPlay) {
            timerAudioRef.current.play().catch(e => console.warn("Autoplay prevented", e));
        } else {
            timerAudioRef.current.pause();
        }
    }, [auction, currentPlayer, isSoldAnimation, isMuted]);

    // Audio Helper
    const playSound = (type) => {
        if (isMuted) return;
        try {
            const sounds = {
                bid: '/assets/sounds/hammer.mp3',
                sold: '/assets/sounds/sold.mp3',
                unsold: '/assets/sounds/unsold.mp3'
            };
            const audio = new Audio(sounds[type]);
            // Low volume for bid, louder for events
            audio.volume = type === 'bid' ? 0.6 : 1.0;
            audio.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.error(e);
        }
    };
    // Bidding War Logic: Track bid times
    const lastBidsRef = useRef([]);

    useEffect(() => {
        loadData();
    }, [auctionId]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('bid_updated', (data) => {
            if (data.auctionId == auctionId) {
                // Determine if this is a new higher bid or a sync/undo
                // We only add to history if the new amount is STRICTLY GREATER than the last recorded bid
                setBidHistory(prev => {
                    const lastBid = prev.length > 0 ? prev[prev.length - 1].bid : 0;
                    if (data.amount > lastBid) {
                        // Find team
                        const bidder = teams.find(t => t.id == data.bidderId);
                        return [...prev, { bid: data.amount, bidder: bidder || null }];
                    }
                    return prev;
                });

                setCurrentBid(data.amount);
                const bidder = teams.find(t => t.id == data.bidderId);
                if (bidder) setCurrentBidder(bidder);

                // Sound Effect (Only for legitimate new bids or increases)
                if (data.amount > currentBid) {
                    new Audio('/assets/sounds/hammer.mp3').play().catch(() => { });

                    // Bidding War Detection
                    const now = Date.now();
                    lastBidsRef.current.push(now);
                    lastBidsRef.current = lastBidsRef.current.filter(t => now - t < 5000);

                    if (lastBidsRef.current.length >= 3) {
                        setIsBiddingWar(true);
                        if (window.warTimeout) clearTimeout(window.warTimeout);
                        window.warTimeout = setTimeout(() => setIsBiddingWar(false), 3000);
                    }
                }
            }
        });

        return () => {
            socket.off('bid_updated');
        };
    }, [socket, teams, auctionId, currentBid]); // Added currentBid dep for sound check

    const loadData = async () => {
        try {
            const [aucRes, plyRes, teamRes] = await Promise.all([
                api.get(`/auctions/${auctionId}`),
                api.get(`/players/auction/${auctionId}?limit=1000`),
                api.get(`/teams/auction/${auctionId}?limit=1000`)
            ]);

            const auctionData = aucRes.data;
            setAuction(auctionData);

            // Fetch live sync state
            if (auctionData.current_player_id) {
                // Assume this endpoint exists or logic handles it
            }
            if (auctionData.current_bid_amount) setCurrentBid(auctionData.current_bid_amount);
            if (auctionData.current_bidder_id) {
                // Set initial bidder will be resolved when teams set
            }

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

            // Sync Current Bidder if IDs loaded
            if (auctionData.current_bidder_id) {
                const b = allTeams.find(t => t.id == auctionData.current_bidder_id);
                if (b) setCurrentBidder(b);
            }

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

    // Removed manual addToHistory as socket handles it now
    const addToHistory = () => {
        // Keeps local optimistic updates if needed, but risky with socket race
        // setBidHistory(prev => [...prev, { bid: currentBid, bidder: currentBidder }]);
    };

    const handleUndo = () => {
        if (bidHistory.length === 0) return;

        // Remove the last bid from local history immediately
        // The previous state is actually the 2nd to last item, or base price if history has only 1 item
        const newHistory = bidHistory.slice(0, -1);
        setBidHistory(newHistory);

        const previousState = newHistory.length > 0 ? newHistory[newHistory.length - 1] : { bid: auction?.min_bid || 0, bidder: null };

        setCurrentBid(previousState.bid);
        setCurrentBidder(previousState.bidder);

        // Sync with server (Server will emit bid_updated, but our socket listener won't add it to history because amount is < old tip)
        syncLiveBid(previousState.bid, previousState.bidder?.id);
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
        // Optimistic update: We DON'T add to history here, we wait for socket
        // But we DO update current state for responsiveness
        const newBid = (parseInt(currentBid) || 0) + parseInt(amount);
        // setCurrentBid(newBid); // Optional: wait for socket for SOT, but UI lag might be annoying.
        // Better: Update UI optimistcally, but let History depend on Socket.

        // Actually, for instant feedback, let's just send request.
        // Wait, if we don't update currentBid, user can't click again fast.
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
            playSound('sold');
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
            playSound('unsold');
            await api.post(`/players/${currentPlayer.id}/unsold`, { auction_id: parseInt(auctionId) });
            setLastAction({ type: 'UNSOLD', player: currentPlayer });

            // Update lists
            setUnsoldPlayers(prev => prev.filter(p => p.id !== currentPlayer.id));
            setUnsoldPassedPlayers(prev => [currentPlayer, ...prev]);

            setCurrentPlayer(null);
            setSearchTerm('');
            toast.info("Player Unsold");
        } catch (error) {
            console.error("Unsold Error:", error);
            const msg = error.response?.data?.message || "Failed to mark unsold";
            toast.error(msg);
        }
    };

    const handleRevisit = async (playerId) => {
        setRevisitLoading(playerId);
        try {
            await api.put(`/players/${playerId}/revisit`, { auction_id: auctionId });
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
                    {isBiddingWar && <FireAnimation />}
                </AnimatePresence>

                {/* Top Stats Bar */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-3 sticky top-0 z-30 flex justify-between items-center shadow-sm gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                            <FiActivity size={20} />
                        </div>
                        <div className="min-w-0 hidden sm:block">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-0.5 truncate">Auction Arena</h2>
                            <p className="text-xs font-medium text-slate-500 truncate">{auction?.name}</p>
                        </div>
                        <button
                            onClick={() => setIsMuted(prev => !prev)}
                            className={`sm:hidden p-2 rounded-lg ${isMuted ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-200 shrink-0">
                        {[
                            { id: 'available', label: 'Avail', count: unsoldPlayers.length, color: 'blue' },
                            { id: 'sold', label: 'Sold', count: soldPlayers.length, color: 'green' },
                            { id: 'unsold', label: 'Skip', count: unsoldPassedPlayers.length, color: 'red' }
                        ].map(stat => (
                            <button
                                key={stat.id}
                                onClick={() => setViewMode(stat.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${stat.color === 'blue' ? 'hover:bg-blue-50 text-blue-600' :
                                    stat.color === 'green' ? 'hover:bg-green-50 text-green-600' :
                                        'hover:bg-red-50 text-red-500'
                                    }`}
                            >
                                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider opacity-70">{stat.label}</span>
                                <span className="text-sm font-black">{stat.count}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setIsMuted(prev => !prev)}
                            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${isMuted ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                            title={isMuted ? "Unmute Sound" : "Mute Sound"}
                        >
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={`/strategy?auctionId=${auctionId}`}
                            target="_blank"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-indigo-200 shadow-md hover:scale-105"
                            title="Strategy Board"
                        >
                            <FiExternalLink /> <span className="hidden xl:inline">Strategy</span>
                        </a>
                        <button
                            onClick={() => window.open(`/spectator/${auctionId}`, '_blank')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
                            title="Projector View"
                        >
                            <FiMonitor /> <span className="hidden 2xl:inline">Projector</span>
                        </button>
                        <button
                            onClick={() => setUnsoldPoolOpen(true)}
                            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl font-bold border border-gray-200 shadow-sm transition-all flex items-center gap-2 active:scale-95"
                            title="Unsold Pool"
                        >
                            <FiSkipForward /> <span className="hidden 2xl:inline">Pool</span>
                        </button>

                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        <div className="flex gap-1">
                            {auction?.status === 'Paused' ? (
                                <button onClick={() => handleStatusChange('Live')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-xl font-bold text-sm transition-colors" title="Resume">
                                    <span className="hidden md:inline">Resume</span> <span className="md:hidden">▶</span>
                                </button>
                            ) : (
                                <button onClick={() => handleStatusChange('Paused')} className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-2 rounded-xl font-bold text-sm transition-colors" title="Pause">
                                    <span className="hidden md:inline">Pause</span> <span className="md:hidden">⏸</span>
                                </button>
                            )}
                            <button onClick={() => handleStatusChange('Completed')} className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-2 rounded-xl font-bold text-sm transition-colors" title="End Auction">
                                <span className="hidden md:inline">End</span> <span className="md:hidden">⏹</span>
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
                                    <div className="bg-blue-50 p-6 rounded-full mb-8 shadow-inner relative group cursor-pointer hover:bg-blue-100 transition-colors"
                                        onClick={() => window.open(`/strategy?auctionId=${auctionId}`, '_blank')}>
                                        <FiUser size={48} className="text-blue-500" />
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                                            WAR ROOM
                                        </div>
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

                {selectedTeamViewer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm p-2 border border-blue-100">
                                        {selectedTeamViewer.image_path && <img src={getImageUrl(selectedTeamViewer.image_path)} className="w-full h-full object-contain" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">{selectedTeamViewer.name}</h2>
                                        <p className="text-slate-500 font-bold">{selectedTeamViewer.short_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTeamViewer(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto bg-slate-50 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-xs font-bold uppercase text-green-600 mb-1">Purse Remaining</p>
                                        <p className="text-2xl font-black text-slate-800">₹{selectedTeamViewer.purse_remaining.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold uppercase text-blue-600 mb-1">Squad Size</p>
                                        <p className="text-2xl font-black text-slate-800">{soldPlayers.filter(p => p.team_id === selectedTeamViewer.id || (p.Team?.id === selectedTeamViewer.id)).length} / {selectedTeamViewer.players_per_team}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <FiUsers className="text-blue-500" /> Squad List
                                    </h3>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                        {soldPlayers.filter(p => p.team_id === selectedTeamViewer.id || (p.Team?.id === selectedTeamViewer.id)).length === 0 ? (
                                            <div className="p-8 text-center text-gray-400 font-bold">No players bought yet</div>
                                        ) : (
                                            soldPlayers.filter(p => p.team_id === selectedTeamViewer.id || (p.Team?.id === selectedTeamViewer.id)).map(p => (
                                                <div key={p.id} className="p-3 border-b border-gray-50 last:border-0 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                        {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FiUser className="text-gray-300" /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-700 truncate">{p.name}</div>
                                                        <div className="text-xs text-slate-400">{p.role}</div>
                                                    </div>
                                                    <div className="font-bold text-green-600">₹{p.sold_price?.toLocaleString()}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <PlayerInfoModal player={infoPlayer} isOpen={!!infoPlayer} onClose={() => setInfoPlayer(null)} />
            </div>
        </div >
    );
};

export default AuctionRoom;
