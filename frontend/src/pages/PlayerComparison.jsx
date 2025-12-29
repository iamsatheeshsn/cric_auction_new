import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiSearch, FiX, FiInfo, FiFilter, FiCpu } from 'react-icons/fi';
import { findSimilarPlayers } from '../utils/AIModel';


const PlayerComparison = () => {
    const [searchTerm1, setSearchTerm1] = useState('');
    const [searchTerm2, setSearchTerm2] = useState('');

    // Suggestion Lists
    const [suggestions1, setSuggestions1] = useState([]);
    const [suggestions2, setSuggestions2] = useState([]);

    // Selected Players
    const [player1, setPlayer1] = useState(null);
    const [player2, setPlayer2] = useState(null);

    // Context State
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState('');
    const [allPlayers, setAllPlayers] = useState([]); // [NEW] For AI Clustering

    // Comparison Data (Stats)
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Auctions on Mount
    useEffect(() => {
        fetchAuctions();
    }, []);

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

    useEffect(() => {
        if (selectedAuction) {
            api.get(`/players/auction/${selectedAuction}`).then(res => {
                setAllPlayers(res.data.players || []);
            });
        }
    }, [selectedAuction]);

    // Search Effects
    useEffect(() => {
        if (searchTerm1.length > 2) searchPlayers(searchTerm1, setSuggestions1);
        else setSuggestions1([]);
    }, [searchTerm1]);

    useEffect(() => {
        if (searchTerm2.length > 2) searchPlayers(searchTerm2, setSuggestions2);
        else setSuggestions2([]);
    }, [searchTerm2]);

    // Fetch Comparison when both selected
    useEffect(() => {
        if (player1 && player2) {
            fetchComparisonData();
        }
    }, [player1, player2]);

    const searchPlayers = async (query, setFunc) => {
        if (!selectedAuction) return;
        try {
            const res = await api.get(`/players/auction/${selectedAuction}?search=${query}`);
            setFunc(res.data.players || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchComparisonData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stats/compare?p1=${player1.id}&p2=${player2.id}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/150?text=Player';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    const StatRow = ({ label, val1, val2, lowerIsBetter = false }) => {
        const v1 = parseFloat(val1);
        const v2 = parseFloat(val2);
        let win1 = false;
        let win2 = false;

        if (!isNaN(v1) && !isNaN(v2) && v1 !== v2) {
            if (lowerIsBetter) {
                win1 = v1 < v2;
                win2 = v2 < v1;
            } else {
                win1 = v1 > v2;
                win2 = v2 > v1;
            }
        }

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
            >
                <div className={`text-center font-bold text-lg ${win1 ? 'text-green-600 scale-110' : 'text-gray-600'} transition-all`}>
                    {val1}
                </div>
                <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                    {label}
                </div>
                <div className={`text-center font-bold text-lg ${win2 ? 'text-green-600 scale-110' : 'text-gray-600'} transition-all`}>
                    {val2}
                </div>
            </motion.div>
        );
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-black text-center mb-8 flex items-center justify-center gap-3 text-deep-blue">
                    <FiUsers className="text-blue-500" /> Player Comparison
                </h1>

                {/* Auction Selector */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-full md:w-auto md:min-w-[300px]">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium text-gray-700 text-lg"
                            value={selectedAuction}
                            onChange={(e) => {
                                setSelectedAuction(e.target.value);
                                setPlayer1(null);
                                setPlayer2(null);
                                setData(null);
                                setSearchTerm1('');
                                setSearchTerm2('');
                            }}
                        >
                            {auctions.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({new Date(a.auction_date).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-20">
                    {/* Player 1 Selector */}
                    <div className="relative">
                        {!player1 ? (
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Player 1..."
                                    className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchTerm1}
                                    onChange={e => setSearchTerm1(e.target.value)}
                                />
                                {suggestions1.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                        {suggestions1.map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50"
                                                onClick={() => { setPlayer1(p); setSuggestions1([]); setSearchTerm1(''); }}
                                            >
                                                <img src={getImageUrl(p.image_path || p.image)} className="w-8 h-8 rounded-full object-cover" alt={p.name} />
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.role} • {p.Team?.name || 'Unsold'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm text-center relative">
                                <button onClick={() => { setPlayer1(null); setData(null); }} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500"><FiX /></button>
                                <div className="w-32 h-32 mx-auto rounded-full p-1 bg-white border-2 border-blue-200 shadow-md mb-4 overflow-hidden">
                                    <img src={getImageUrl(player1.image_path || player1.image)} alt={player1.name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800">{player1.name}</h3>
                                <p className="text-blue-600 font-bold">{player1.Team?.name || 'Unsold'}</p>
                                <p className="text-gray-500 text-sm">{player1.role}</p>
                            </div>
                        )}
                    </div>

                    {/* VS Token */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg z-10 font-black text-gray-300 text-xl border-4 border-gray-50 hidden md:block">
                        VS
                    </div>

                    {/* Player 2 Selector */}
                    <div className="relative">
                        {!player2 ? (
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Player 2..."
                                    className="w-full p-4 pl-12 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    value={searchTerm2}
                                    onChange={e => setSearchTerm2(e.target.value)}
                                />
                                {suggestions2.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                        {suggestions2.map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50"
                                                onClick={() => { setPlayer2(p); setSuggestions2([]); setSearchTerm2(''); }}
                                            >
                                                <img src={getImageUrl(p.image_path || p.image)} className="w-8 h-8 rounded-full object-cover" alt={p.name} />
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.role} • {p.Team?.name || 'Unsold'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm text-center relative">
                                <button onClick={() => { setPlayer2(null); setData(null); }} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500"><FiX /></button>
                                <div className="w-32 h-32 mx-auto rounded-full p-1 bg-white border-2 border-red-200 shadow-md mb-4 overflow-hidden">
                                    <img src={getImageUrl(player2.image_path || player2.image)} alt={player2.name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800">{player2.name}</h3>
                                <p className="text-red-500 font-bold">{player2.Team?.name || 'Unsold'}</p>
                                <p className="text-gray-500 text-sm">{player2.role}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comparison Data */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {data && !loading && data.p1 && data.p2 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-4 text-center font-bold text-gray-400 uppercase tracking-widest text-xs">
                            Face Off Stats
                        </div>
                        <div className="p-6">
                            <StatRow label="Matches" val1={data.p1.matches} val2={data.p2.matches} />
                            <StatRow label="Runs" val1={data.p1.runs} val2={data.p2.runs} />
                            <StatRow label="Batting Avg" val1={data.p1.batAvg} val2={data.p2.batAvg} />
                            <StatRow label="Strike Rate" val1={data.p1.strikeRate} val2={data.p2.strikeRate} />
                            <StatRow label="Fours" val1={data.p1.fours} val2={data.p2.fours} />
                            <StatRow label="Sixes" val1={data.p1.sixes} val2={data.p2.sixes} />

                            <div className="h-px bg-gray-100 my-4"></div>

                            <StatRow label="Wickets" val1={data.p1.wickets} val2={data.p2.wickets} />
                            <StatRow label="Economy" val1={data.p1.economy} val2={data.p2.economy} lowerIsBetter={true} />
                            <StatRow label="Bowling Avg" val1={data.p1.bowlAvg} val2={data.p2.bowlAvg} lowerIsBetter={true} />

                            <div className="h-px bg-gray-100 my-4"></div>

                            <StatRow label="Catches" val1={data.p1.catches} val2={data.p2.catches} />
                            <StatRow label="Run Outs" val1={data.p1.runouts} val2={data.p2.runouts} />

                            <div className="mt-8 bg-yellow-50 rounded-xl p-4 flex justify-between items-center border border-yellow-200">
                                <div className="font-bold text-yellow-700">Price</div>
                                <div className="font-mono font-bold text-gray-800 text-xl">{data.p1.price}</div>
                                <div className="font-mono font-bold text-gray-800 text-xl">{data.p2.price}</div>
                            </div>
                        </div>
                    </div>

                )}

                {/* AI Similarity Engine */}
                {data && !loading && (data.p1 || data.p2) && (
                    <div className="mt-8 bg-gradient-to-br from-indigo-900 to-violet-900 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <FiCpu size={200} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black flex items-center gap-3 mb-6">
                                <FiCpu className="text-cyan-400" /> AI Similarity Engine
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {data.p1 && (
                                    <div>
                                        <p className="font-bold text-indigo-200 mb-4 uppercase tracking-widest text-xs">Players like {data.p1.name}</p>
                                        <div className="space-y-3">
                                            {findSimilarPlayers(data.p1, allPlayers, 3).map((p) => (
                                                <div key={p.id} className="bg-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => setPlayer2(p)}>
                                                    <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden">
                                                        {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><FiUsers /></div>}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{p.name}</div>
                                                        <div className="text-xs text-cyan-300">{(p.similarity * 100).toFixed(0)}% Match</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {findSimilarPlayers(data.p1, allPlayers, 3).length === 0 && <p className="text-white/40 italic text-sm">No similar players found</p>}
                                        </div>
                                    </div>
                                )}
                                {data.p2 && (
                                    <div>
                                        <p className="font-bold text-indigo-200 mb-4 uppercase tracking-widest text-xs">Players like {data.p2.name}</p>
                                        <div className="space-y-3">
                                            {findSimilarPlayers(data.p2, allPlayers, 3).map((p) => (
                                                <div key={p.id} className="bg-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => setPlayer1(p)}>
                                                    <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden">
                                                        {p.image_path ? <img src={getImageUrl(p.image_path)} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><FiUsers /></div>}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{p.name}</div>
                                                        <div className="text-xs text-cyan-300">{(p.similarity * 100).toFixed(0)}% Match</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {findSimilarPlayers(data.p2, allPlayers, 3).length === 0 && <p className="text-white/40 italic text-sm">No similar players found</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {data && (!data.p1 || !data.p2) && !loading && (
                    <div className="text-center py-12 text-gray-400">
                        <FiInfo className="mx-auto mb-2 text-3xl" />
                        <p>Could not load comparison data. Please try different players.</p>
                    </div>
                )}
            </div>
        </Layout >
    );
};

export default PlayerComparison;
