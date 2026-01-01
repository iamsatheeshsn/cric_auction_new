import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiUsers, FiTarget, FiPlus, FiTrash2, FiActivity, FiDollarSign, FiSearch, FiMonitor } from 'react-icons/fi';
import { toast } from 'react-toastify';

const StrategyDashboard = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [shortlist, setShortlist] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [auctionId, setAuctionId] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const queryAuctionId = params.get('auctionId') || 1;

            const res = await api.get(`/teams/auction/${queryAuctionId}?limit=100`);
            setTeams(res.data.teams);
            setAuctionId(queryAuctionId);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchShortlist = async (teamId) => {
        setLoading(true);
        try {
            const res = await api.get(`/shortlist/${teamId}?auctionId=${auctionId}`);
            setShortlist(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load shortlist");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await api.get(`/players?search=${query}&limit=5`);
            setSearchResults(res.data.players);
        } catch (err) {
            console.error(err);
        }
    };

    const addToShortlist = async (player) => {
        if (!selectedTeam) {
            toast.warning("Select a team first");
            return;
        }
        try {
            await api.post('/shortlist', {
                team_id: selectedTeam.id,
                player_id: player.id
            });
            toast.success("Added to shortlist");
            fetchShortlist(selectedTeam.id);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add");
        }
    };

    const removeFromShortlist = async (id) => {
        try {
            await api.delete(`/shortlist/${id}`);
            setShortlist(prev => prev.filter(item => item.id !== id));
            toast.success("Removed");
        } catch (err) {
            toast.error("Failed to remove");
        }
    };

    const calculateBudget = (shortlistItem) => {
        if (!selectedTeam) return 0;

        const MIN_BID = 20;
        const MAX_SQUAD = selectedTeam.players_per_team || 15;
        const currentSquadCount = (selectedTeam.Players?.length || 0);
        const slotsRemaining = MAX_SQUAD - currentSquadCount;

        if (slotsRemaining <= 0) return 0;

        const maxBid = selectedTeam.purse_remaining - ((slotsRemaining - 1) * MIN_BID);
        return Math.max(0, maxBid);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50/50">
                {/* Hero Header */}
                <div className="bg-slate-900 mx-6 mt-6 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                                <span className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/50">
                                    <FiTarget className="text-white" size={32} />
                                </span>
                                Strategy War Room
                            </h1>
                            <p className="text-slate-400 font-medium mt-2 ml-1 text-lg">Analyze targets, plan budget, and execute perfection.</p>
                        </div>

                        <div className="w-full md:w-80 relative group">
                            <label className="block text-xs font-bold uppercase text-blue-300 mb-2 tracking-wider">Select Your Intelligence</label>
                            <div className="relative">
                                <select
                                    className="w-full p-4 pl-5 rounded-2xl border-0 font-bold bg-white/10 backdrop-blur-md text-white ring-1 ring-white/20 focus:ring-blue-500 focus:bg-white/20 transition-all appearance-none cursor-pointer hover:bg-white/15"
                                    onChange={(e) => {
                                        const t = teams.find(team => team.id == e.target.value);
                                        setSelectedTeam(t);
                                        if (t) fetchShortlist(t.id);
                                    }}
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">-- Choose Active Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Search & Add (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Team Stats Matrix */}
                            {selectedTeam && (
                                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transform scale-150 transition-transform group-hover:scale-[1.6]">
                                        {selectedTeam.image_path && <img src={`http://localhost:5000/${selectedTeam.image_path}`} className="w-32 h-32 object-contain" />}
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 border border-slate-100 shadow-inner">
                                                {selectedTeam.image_path ?
                                                    <img src={`http://localhost:5000/${selectedTeam.image_path}`} className="w-full h-full object-contain" /> :
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUsers /></div>
                                                }
                                            </div>
                                            <div>
                                                <h3 className="font-black text-2xl text-slate-800 leading-none mb-1">{selectedTeam.name}</h3>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md inline-block">Analysis Mode</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
                                                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total Purse Remaining</p>
                                                <p className="text-3xl font-black">₹{selectedTeam.purse_remaining.toLocaleString()}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Slots Open</p>
                                                    <p className="text-2xl font-black text-slate-700">{selectedTeam.players_per_team - (selectedTeam.Players?.length || 0)}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Squad Size</p>
                                                    <p className="text-2xl font-black text-slate-700">{(selectedTeam.Players?.length || 0)} <span className="text-sm font-medium text-slate-400">/ {selectedTeam.players_per_team}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Player Scout */}
                            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                                <h2 className="font-black text-xl mb-6 flex items-center gap-3 text-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                        <FiSearch size={20} />
                                    </div>
                                    Player Scout
                                </h2>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <FiSearch className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Find player by name..."
                                        className="w-full py-4 pl-11 pr-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white shadow-2xl shadow-blue-900/10 rounded-2xl z-20 overflow-hidden border border-slate-100 mt-2 p-2">
                                            {searchResults.map(p => (
                                                <div key={p.id} onClick={() => addToShortlist(p)} className="p-3 hover:bg-blue-50 rounded-xl cursor-pointer flex items-center justify-between group transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                                            {p.image_path ? <img src={`http://localhost:5000/${p.image_path}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUsers size={16} /></div>}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-800">{p.name}</div>
                                                            <div className="text-xs font-semibold text-slate-400 uppercase">{p.role}</div>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                                        <FiPlus />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <p className="text-indigo-600 text-xs font-bold leading-relaxed flex gap-2">
                                        <FiActivity className="mt-0.5 shrink-0" />
                                        Use this tool to find players and add them to your tactical shortlist.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Shortlist & Calculator (8 cols) */}
                        <div className="lg:col-span-8">
                            <h2 className="font-black text-2xl mb-6 flex items-center gap-3 text-slate-800">
                                <span className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><FiActivity /></span>
                                Tactical Shortlist
                                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full ml-auto">
                                    {shortlist.length} Targets
                                </span>
                            </h2>

                            {loading ? <div className="p-20 text-center text-slate-400 animate-pulse font-bold">Loading Intelligence...</div> : (
                                <div className="grid gap-4">
                                    {shortlist.length === 0 && (
                                        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <FiTarget size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700 mb-1">Visualizer Empty</h3>
                                            <p className="text-slate-400 font-medium">Search for players to add them to your war room strategy.</p>
                                        </div>
                                    )}

                                    {shortlist.map((item, index) => {
                                        const maxBid = calculateBudget(item);
                                        const statusColor = item.auctionStatus === 'Sold' ? 'bg-rose-50 text-rose-600 border-rose-100' : (item.auctionStatus === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100');
                                        const statusLabel = item.auctionStatus === 'Sold' ? 'SOLD' : (item.auctionStatus === 'Available' ? 'AVAILABLE' : 'UNSOLD');

                                        return (
                                            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                                {/* Card Side Highlight */}
                                                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.auctionStatus === 'Sold' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                                    {/* Player Info */}
                                                    <div className="flex items-center gap-5 flex-1 w-full">
                                                        <div className="relative">
                                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-slate-100">
                                                                {item.Player?.image_path ? <img src={`http://localhost:5000/${item.Player.image_path}`} className="w-full h-full object-cover" /> :
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUsers size={24} /></div>
                                                                }
                                                            </div>
                                                            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md border border-white">
                                                                #{index + 1}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h3 className="font-black text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{item.Player?.name}</h3>
                                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                                <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">{item.Player?.role}</span>
                                                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Calculator / Stats */}
                                                    <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:justify-end">
                                                        {item.auctionStatus === 'Available' && selectedTeam && (
                                                            <div className="bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100 flex flex-col items-center min-w-[140px] shadow-sm">
                                                                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-0.5 flex items-center gap-1">
                                                                    <FiDollarSign size={12} /> Max Safe Bid
                                                                </span>
                                                                <span className="font-black text-2xl text-indigo-700 font-mono tracking-tight">₹{maxBid.toLocaleString()}</span>
                                                            </div>
                                                        )}

                                                        {item.auctionStatus === 'Sold' && (
                                                            <div className="bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 flex flex-col items-center min-w-[140px]">
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Sold For</span>
                                                                <span className="font-black text-2xl text-gray-600 font-mono tracking-tight">₹{item.soldPrice?.toLocaleString() || 0}</span>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => removeFromShortlist(item.id)}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                                            title="Remove from Strategy"
                                                        >
                                                            <FiTrash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StrategyDashboard;
