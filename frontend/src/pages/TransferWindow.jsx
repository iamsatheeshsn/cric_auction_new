import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiArrowRight, FiCheck, FiX, FiFilter, FiSearch, FiDollarSign, FiRepeat, FiUser } from 'react-icons/fi';

const TransferWindow = () => {
    const { auctionId } = useParams();
    const [activeTab, setActiveTab] = useState('market'); // 'market', 'requests'

    // Data State
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [auctionDetails, setAuctionDetails] = useState(null);

    // Market Pagination
    const [players, setPlayers] = useState([]);

    // Requests Pagination (Client-side)
    const [trades, setTrades] = useState([]);
    const [requestsPage, setRequestsPage] = useState(1);
    const requestsPerPage = 5;

    const [myTeamId, setMyTeamId] = useState(null);

    // Modal State
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedTargetPlayer, setSelectedTargetPlayer] = useState(null);
    const [selectedMyPlayer, setSelectedMyPlayer] = useState(null);
    const [offerAmount, setOfferAmount] = useState('');
    const [tradeNotes, setTradeNotes] = useState('');

    useEffect(() => {
        fetchData();
        fetchTrades();
    }, [auctionId]);



    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, playersRes, auctionRes] = await Promise.all([
                api.get(`/teams/auction/${auctionId}`),
                api.get(`/players/auction/${auctionId}?limit=1000`),
                api.get(`/auctions/${auctionId}`)
            ]);
            setTeams(teamsRes.data.teams || []);
            setPlayers(playersRes.data.players || []);
            setAuctionDetails(auctionRes.data);

            if (teamsRes.data.teams && teamsRes.data.teams.length > 0 && !myTeamId) {
                setMyTeamId(teamsRes.data.teams[0].id);
            }
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrades = async () => {
        try {
            const res = await api.get(`/trades/${auctionId}`);
            setTrades(res.data);
        } catch (error) {
            console.error("Error loading trades", error);
        }
    };

    const handleInitiateTrade = async () => {
        if (!selectedTargetPlayer || !selectedMyPlayer) return;

        // Validation Logic
        const myTeam = teams.find(t => t.id === myTeamId);
        const myPurse = Number(myTeam?.purse_remaining || 0);
        // Budget Impact Logic matches User Expectation:
        // New Balance = Current Purse + Value of Player Out (Refund) - Value of Player In (Cost) - Cash Offer (Extra)
        const myPlayerValue = Number(selectedMyPlayer.sold_price || 0);
        const targetPlayerValue = Number(selectedTargetPlayer.sold_price || 0);
        const offer = Number(offerAmount || 0);

        const netImpact = myPlayerValue - targetPlayerValue - offer;
        const potentialBalance = myPurse + netImpact;

        // Check 1: Do I have enough funds?
        if (potentialBalance < 0) {
            toast.error(`Insufficient funds! This trade results in a balance of ₹${potentialBalance.toLocaleString('en-IN')}`);
            return;
        }

        // Check 2: Does it exceed total team cap? (Implicitly covered by balance check if balance is correct, but let's be safe)
        // Actually, "Total Spent" cap check is: (Total - Purse) + Cost - Refund + Offer <= Cap ???
        // Easier: Current Purse >= Needed.
        // If potentialBalance is positive, we are good on the "Not going bankrupt" front.

        // Ensure "Spending Cap" check if needed. (Points Per Team - Updated Purse >= 0) -> Same as potentialBalance >= 0.

        try {
            const payload = {
                auctionId,
                requesterTeamId: myTeamId,
                responderTeamId: selectedTargetPlayer.Team.id,
                playerToReceiveId: selectedTargetPlayer.id,
                playerToGiveId: selectedMyPlayer.id,
                offerAmount: offer,
                notes: tradeNotes
            };
            console.log("Sending Trade:", payload);
            await api.post('/trades/initiate', payload);
            toast.success("Trade proposal sent!");
            setShowTradeModal(false);
            fetchTrades();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Trade failed");
        }
    };

    const handleRespond = async (tradeId, status) => {
        try {
            await api.post('/trades/respond', { tradeId, status });
            toast.success(`Trade ${status}`);
            fetchTrades();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    const marketPlayers = players.filter(p => p.team_id && p.team_id !== myTeamId);

    // We need ALL my players for the swap dropdown, but current `players` is paginated.
    // Ideally we should fetch my squad separately or filter from a full list. 
    // For now, let's assume the user might not see all their players in the dropdown if we depend on `players`.
    // Correct approach: When opening modal, fetch my full squad or ensure we have it.
    // Workaround: We will rely on `teams` data if it includes players (nested in `getTeamsByAuction`).
    // Earlier inspection showed `getTeamsByAuction` includes `Players`.
    const myFullSquad = teams.find(t => t.id === myTeamId)?.Players || [];

    // Requests Pagination Logic
    const filteredTrades = trades.filter(t => t.responder_team_id === myTeamId || t.requester_team_id === myTeamId);
    // Actually we separate Incoming/Outgoing in UI. Let's paginate the *Filtered* lists or just the whole view?
    // The user wants pagination in "Trade Requests" tab.
    // Let's paginate the entire list of relevant trades to keep it simple, or paginate strictly Incoming.
    // Given the UI splits them, maybe just paginate the whole Tab view is confusing if headers are split.
    // Let's paginate the "Incoming" list primarily as that's the actionable part.
    // Or just apply Client Pagination to the visible lists.

    // Simplified: Pagination for the container.
    const relevantTrades = trades.filter(t => t.responder_team_id === myTeamId || t.requester_team_id === myTeamId);
    const totalRequestsPages = Math.ceil(relevantTrades.length / requestsPerPage);
    const paginatedTrades = relevantTrades.slice((requestsPage - 1) * requestsPerPage, requestsPage * requestsPerPage);


    // Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumSignificantDigits: 3
        }).format(amount);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">

                {/* Header Section */}
                <div className="relative bg-white shadow-sm border-b border-gray-200 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200"><FiRepeat /></span>
                                    Transfer Window
                                </h1>
                                <p className="text-gray-500 font-medium mt-2 ml-14">
                                    Negotiate deals to strengthen your squad post-auction.
                                </p>
                            </div>

                            {/* Team Selector */}
                            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                    <FiUser className="text-gray-400" />
                                </div>
                                <div className="flex flex-col pr-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Managing As</span>
                                    <select
                                        value={myTeamId || ''}
                                        onChange={(e) => setMyTeamId(Number(e.target.value))}
                                        className="bg-transparent font-bold text-gray-900 text-sm focus:outline-none cursor-pointer"
                                    >
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Budget Summary Card */}
                            {myTeamId && teams.find(t => t.id === myTeamId) && auctionDetails && (
                                <div className="flex items-center gap-6 bg-gray-900 text-white p-3 rounded-2xl shadow-xl shadow-gray-200">
                                    <div className="flex flex-col px-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Purse</span>
                                        <span className="font-bold text-sm">₹{Number(auctionDetails.points_per_team).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-700"></div>
                                    <div className="flex flex-col px-2">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Spent</span>
                                        <span className="font-bold text-sm">₹{(Number(auctionDetails.points_per_team) - Number(teams.find(t => t.id === myTeamId).purse_remaining)).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-700"></div>
                                    <div className="flex flex-col px-2">
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Remaining</span>
                                        <span className="font-black text-lg">₹{Number(teams.find(t => t.id === myTeamId).purse_remaining).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-8 mt-10 border-b border-gray-100">
                            {[
                                { id: 'market', label: 'Marketplace', icon: FiSearch },
                                { id: 'requests', label: 'Trade Requests', icon: FiRefreshCw, count: trades.filter(t => t.responder_team_id === myTeamId && t.status === 'Pending').length }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id
                                        ? 'text-blue-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm shadow-red-200">
                                            {tab.count}
                                        </span>
                                    )}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* Market Tab */}
                            {activeTab === 'market' && (
                                <motion.div
                                    key="market"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                        {marketPlayers.map(player => (
                                            <div key={player.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
                                                {/* Top Accents */}
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 object-cover shadow-inner ring-4 ring-white overflow-hidden">
                                                            {player.image_path ? (
                                                                <img src={`http://localhost:5000/${player.image_path}`} alt={player.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-gray-100">?</div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                                            <div className={`w-3 h-3 rounded-full ${player.role === 'Batsman' ? 'bg-blue-400' : player.role === 'Bowler' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Sold For</span>
                                                        <span className="font-black text-gray-900 bg-gray-100 px-2 py-1 rounded-lg text-sm">
                                                            {formatCurrency(player.sold_price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{player.name}</h3>
                                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-4">{player.Team?.name}</p>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedTargetPlayer(player);
                                                            setShowTradeModal(true);
                                                        }}
                                                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 font-bold text-gray-400 text-sm hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                                                    >
                                                        <FiRepeat /> Propose Trade
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Requests Tab */}
                            {activeTab === 'requests' && (
                                <motion.div
                                    key="requests"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="max-w-3xl mx-auto space-y-8"
                                >

                                    {/* Incoming Section */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-200 pb-2 mb-6">Incoming Requests (Action Required)</h3>

                                        {paginatedTrades.filter(t => t.responder_team_id === myTeamId).length === 0 && paginatedTrades.filter(t => t.requester_team_id === myTeamId).length === 0 ? (
                                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                                                <p className="text-gray-400 font-medium">No active trades on this page.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {paginatedTrades.filter(t => t.responder_team_id === myTeamId).map(trade => (
                                                    <div key={trade.id} className="bg-white p-1 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                                        <div className="p-6">
                                                            <div className="flex justify-between items-center mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{trade.RequesterTeam?.short_name || 'REQ'}</span>
                                                                    <span className="font-bold text-gray-900 text-sm">Offer from {trade.RequesterTeam?.name}</span>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trade.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : trade.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {trade.status}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-2xl p-6 relative overflow-hidden">
                                                                {/* Direction Arrow BG */}
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                                                    <FiArrowRight size={100} />
                                                                </div>

                                                                <div className="flex flex-col items-center">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">YOU GIVE</p>
                                                                    {Number(trade.offer_amount) > 0 && (
                                                                        <div className="mb-2 bg-green-50 px-2 py-1 rounded text-[10px] font-bold text-green-700 border border-green-200">
                                                                            + ₹{trade.offer_amount}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-sm mb-3 overflow-hidden">
                                                                    {trade.PlayerToReceive?.image_path ? (
                                                                        <img src={`http://localhost:5000/${trade.PlayerToReceive.image_path}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold bg-gray-50 text-xl">?</div>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-black text-lg text-gray-900 leading-tight">{trade.PlayerToReceive?.name || 'Unknown'}</h4>
                                                                <p className="text-xs font-medium text-gray-500 mt-1">{trade.PlayerToReceive?.role}</p>
                                                            </div>

                                                            {/* Swap Icon */}
                                                            <div className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-md z-10 text-gray-300 shrink-0">
                                                                <FiRepeat />
                                                            </div>

                                                            {/* YOU GET (Requester gives this) */}
                                                            <div className="flex-1 relative z-10 flex flex-col items-center text-center">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">YOU GET</p>
                                                                <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-sm mb-3 overflow-hidden">
                                                                    {trade.PlayerToGive?.image_path ? (
                                                                        <img src={`http://localhost:5000/${trade.PlayerToGive.image_path}`} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold bg-gray-50 text-xl">?</div>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-black text-lg text-blue-600 leading-tight">{trade.PlayerToGive?.name || 'Cash Deal'}</h4>
                                                                <p className="text-xs font-medium text-gray-500 mt-1">{trade.PlayerToGive?.role}</p>
                                                            </div>
                                                        </div>

                                                        {trade.status === 'Pending' && (
                                                            <div className="flex gap-3 mt-6">
                                                                <button onClick={() => handleRespond(trade.id, 'Rejected')} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                                                                    <FiX /> Reject
                                                                </button>
                                                                <button onClick={() => handleRespond(trade.id, 'Accepted')} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">
                                                                    <FiCheck /> Accept Trade
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Outgoing in same list for pagination simplicity? Or separate? 
                                                   User asked for pagination. Let's show Outgoing below Incoming in the same page view if they exist in this page slice.
                                                   Actually, paginating mixed lists is weird. 
                                                   Let's just show Outgoing trades that fall into this page slice.
                                                */}
                                                {paginatedTrades.filter(t => t.requester_team_id === myTeamId).map(trade => (
                                                    <div key={trade.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center opacity-80 mt-4">
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><FiArrowRight /></div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-sm">Asking for {trade.PlayerToReceive?.name}</h4>
                                                                <p className="text-xs text-gray-500">From {trade.ResponderTeam?.name} • Offering {trade.PlayerToGive?.name}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trade.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : trade.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {trade.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Requests Pagination Controls */}
                                    {totalRequestsPages > 1 && (
                                        <div className="flex justify-center gap-2 mt-8">
                                            <button
                                                disabled={requestsPage === 1}
                                                onClick={() => setRequestsPage(p => p - 1)}
                                                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-4 py-2 font-bold text-gray-500">Page {requestsPage} of {totalRequestsPages}</span>
                                            <button
                                                disabled={requestsPage === totalRequestsPages}
                                                onClick={() => setRequestsPage(p => p + 1)}
                                                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Trade Modal - Compact Design */}
                <AnimatePresence>
                    {showTradeModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col"
                            >
                                {/* Header */}
                                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-white z-10 rounded-t-2xl">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900">Propose Trade</h2>
                                        <p className="text-gray-500 font-medium text-[9px]">Negotiate a deal for <span className="text-blue-600">{selectedTargetPlayer?.name}</span></p>
                                    </div>
                                    <button onClick={() => setShowTradeModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                        <FiX size={16} />
                                    </button>
                                </div>

                                <div className="p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {/* Left Column: Target Player Context */}
                                        <div className="flex flex-col h-full gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                                                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-wider">Target Player</label>
                                                </div>

                                                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-3 text-center relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <FiRepeat size={60} />
                                                    </div>

                                                    <div className="relative z-10 flex flex-col items-center">
                                                        <div className="w-20 h-20 rounded-lg bg-white p-1 shadow-md mb-2 transform transition-transform group-hover:scale-105 duration-300">
                                                            {selectedTargetPlayer?.image_path ? (
                                                                <img src={`http://localhost:5000/${selectedTargetPlayer.image_path}`} alt="" className="w-full h-full object-cover rounded" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-xl text-gray-300 font-black">?</div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-black text-gray-900 mb-0 leading-tight">{selectedTargetPlayer?.name}</h3>
                                                        <p className="text-[10px] font-bold text-gray-500 mb-2">{selectedTargetPlayer?.role}</p>

                                                        <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100 text-blue-700 font-bold text-[10px]">
                                                            From {selectedTargetPlayer?.Team?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stat Comparison / Info */}
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-auto">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Valuation</span>
                                                    <span className="text-sm font-black text-gray-900">₹{selectedTargetPlayer?.sold_price}</span>
                                                </div>
                                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-3/4 opacity-50"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Offer Form */}
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="h-5 w-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Your Offer</label>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Swap Player Selector */}
                                                    <div className="bg-white rounded-xl border border-gray-200 p-0.5 focus-within:ring-4 ring-gray-100 transition-all">
                                                        <select
                                                            className="w-full p-2.5 bg-transparent font-bold text-gray-700 text-xs outline-none cursor-pointer"
                                                            onChange={(e) => {
                                                                const p = myFullSquad.find(mp => mp.id === Number(e.target.value));
                                                                setSelectedMyPlayer(p);
                                                            }}
                                                            value={selectedMyPlayer?.id || ''}
                                                        >
                                                            <option value="">Select a player to swap...</option>
                                                            {myFullSquad.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} (Value: ₹{p.sold_price})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Selected Player Preview (Mini) */}
                                                    {/* Live Budget Impact Calculator - Compacted */}
                                                    {selectedMyPlayer && (
                                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col gap-1.5 mt-2">
                                                            <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                                <span>Budget Projection</span>
                                                                <span>Impact</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                                                                <span>Current Balance</span>
                                                                <span>₹{Number(teams.find(t => t.id === myTeamId)?.purse_remaining || 0).toLocaleString('en-IN')}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs font-medium text-green-600">
                                                                <span>+ Returns ({selectedMyPlayer.name})</span>
                                                                <span>+ ₹{Number(selectedMyPlayer.sold_price).toLocaleString('en-IN')}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs font-medium text-red-600">
                                                                <span>- Cost ({selectedTargetPlayer?.name})</span>
                                                                <span>- ₹{Number(selectedTargetPlayer?.sold_price || 0).toLocaleString('en-IN')}</span>
                                                            </div>
                                                            {Number(offerAmount) > 0 && (
                                                                <div className="flex justify-between items-center text-xs font-medium text-red-600">
                                                                    <span>- Cash Offer</span>
                                                                    <span>- ₹{Number(offerAmount).toLocaleString('en-IN')}</span>
                                                                </div>
                                                            )}
                                                            <div className="border-t border-gray-200 my-0.5"></div>
                                                            <div className="flex justify-between items-center font-black text-gray-900 text-xs">
                                                                <span>New Balance</span>
                                                                <span className={`${(Number(teams.find(t => t.id === myTeamId)?.purse_remaining || 0) + Number(selectedMyPlayer.sold_price) - Number(selectedTargetPlayer?.sold_price || 0) - Number(offerAmount || 0)) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                                    ₹{(Number(teams.find(t => t.id === myTeamId)?.purse_remaining || 0) + Number(selectedMyPlayer.sold_price) - Number(selectedTargetPlayer?.sold_price || 0) - Number(offerAmount || 0)).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cash Adjustment */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extra Cash Offer (₹)</label>
                                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                                Budget Cap: ₹{(Number(teams.find(t => t.id === myTeamId)?.purse_remaining || 0) + Number(selectedMyPlayer?.sold_price || 0)).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="text-gray-400 font-bold text-sm">₹</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                className="w-full pl-8 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 font-black text-gray-800 text-base focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all outline-none"
                                                                placeholder="0"
                                                                value={offerAmount}
                                                                onChange={(e) => setOfferAmount(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Note */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Note</label>
                                                        <textarea
                                                            rows="2"
                                                            className="w-full p-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:ring-4 focus:ring-gray-100 focus:border-gray-300 outline-none transition-all resize-none"
                                                            placeholder="Add a message..."
                                                            value={tradeNotes}
                                                            onChange={(e) => setTradeNotes(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-3xl">
                                    <button onClick={() => setShowTradeModal(false)} className="px-5 py-3 font-bold text-gray-500 hover:bg-white hover:shadow-sm rounded-xl transition-all text-xs">Cancel</button>
                                    <button
                                        onClick={handleInitiateTrade}
                                        disabled={!selectedMyPlayer}
                                        className="flex-1 py-3 font-black bg-gray-900 text-white rounded-xl hover:bg-black hover:scale-[1.01] shadow-lg shadow-gray-200 transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none text-xs tracking-wide uppercase"
                                    >
                                        Confirm Proposal
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout >
    );
};

export default TransferWindow;
