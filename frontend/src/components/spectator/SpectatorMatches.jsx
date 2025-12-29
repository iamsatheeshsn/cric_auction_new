import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FiCalendar, FiMapPin, FiActivity, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const SpectatorMatches = ({ auctionId }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [scoreData, setScoreData] = useState(null);
    const [scoreLoading, setScoreLoading] = useState(false);

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 10000); // 10s poll for scores
        return () => clearInterval(interval);
    }, [auctionId]);

    const fetchMatches = async () => {
        try {
            const res = await api.get(`/fixtures/${auctionId}`);
            setMatches(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleViewScore = async (match) => {
        setSelectedMatch(match);
        setScoreLoading(true);
        try {
            const res = await api.get(`/score/match/${match.id}`);
            setScoreData(res.data);
        } catch (error) {
            console.error("Failed to load score", error);
        } finally {
            setScoreLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Live': return 'bg-red-500 animate-pulse text-white';
            case 'Completed': return 'bg-slate-700 text-gray-300';
            default: return 'bg-blue-600 text-white';
        }
    };

    const getImageUrl = (path) => {
        if (!path) return 'https://placehold.co/400x400/1e293b/475569?text=Logo';
        if (path.toString().startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Matches...</div>;

    return (
        <div className="p-4 lg:p-8 overflow-y-auto h-full pb-20">
            <h2 className="text-2xl font-black uppercase text-white mb-6 tracking-wide border-l-4 border-gold pl-4">Match Fixtures</h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {matches.length === 0 ? <p className="text-gray-500">No matches scheduled yet.</p> : matches.map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-4 lg:p-6 hover:bg-white/10 transition-colors group">

                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(match.status)}`}>
                                {match.status}
                            </div>
                            <div className="flex flex-col items-end text-xs text-gray-400 font-medium">
                                <span className="flex items-center gap-1 mb-1"><FiCalendar /> {new Date(match.match_date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><FiMapPin /> {match.venue || 'TBD'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Team 1 */}
                            <div className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-white/10 p-2 border border-white/10">
                                    <img src={getImageUrl(match.Team1?.image_path || match.Team1?.logo || match.Team1?.logo_url)} className="w-full h-full object-contain" />
                                </div>
                                <h3 className="font-bold text-white text-center text-sm lg:text-base">{match.Team1?.name}</h3>
                            </div>

                            {/* VS / Score */}
                            <div className="mx-4 text-center">
                                <div className="text-2xl font-black text-white/20 group-hover:text-white/40 transition-colors">VS</div>
                                {match.status !== 'Scheduled' && (
                                    <button
                                        onClick={() => handleViewScore(match)}
                                        className="mt-2 text-xs font-bold text-gold uppercase tracking-widest border border-gold/30 px-3 py-1.5 rounded-full bg-gold/10 hover:bg-gold hover:text-black transition-colors"
                                    >
                                        View Score
                                    </button>
                                )}
                            </div>

                            {/* Team 2 */}
                            <div className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-white/10 p-2 border border-white/10">
                                    <img src={getImageUrl(match.Team2?.image_path || match.Team2?.logo || match.Team2?.logo_url)} className="w-full h-full object-contain" />
                                </div>
                                <h3 className="font-bold text-white text-center text-sm lg:text-base">{match.Team2?.name}</h3>
                            </div>
                        </div>

                        {match.result_description && (
                            <div className="mt-4 pt-4 border-t border-white/10 text-center text-green-400 font-bold text-sm uppercase">
                                {match.result_description}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Score Modal */}
            <AnimatePresence>
                {selectedMatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 bg-slate-950 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-black text-white uppercase tracking-wide">Match Scorecard</h2>
                                <button onClick={() => setSelectedMatch(null)} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
                            </div>

                            <div className="p-8">
                                {scoreLoading ? (
                                    <div className="text-center py-10 text-gray-400 animate-pulse">Loading Score...</div>
                                ) : scoreData ? (
                                    <div className="flex flex-col gap-8">
                                        {/* Team 1 Score */}
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/10 p-2">
                                                    <img src={getImageUrl(scoreData.fixture.Team1?.image_path)} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{scoreData.fixture.Team1?.name}</h3>
                                                    <p className="text-xs text-gray-400">Innings 1</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-white">
                                                    {scoreData.summary.score1.runs}-{scoreData.summary.score1.wickets}
                                                </div>
                                                <div className="text-sm font-bold text-gold">{scoreData.summary.score1.overs} Overs</div>
                                            </div>
                                        </div>

                                        {/* Team 2 Score */}
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white/10 p-2">
                                                    <img src={getImageUrl(scoreData.fixture.Team2?.image_path)} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{scoreData.fixture.Team2?.name}</h3>
                                                    <p className="text-xs text-gray-400">Innings 2</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-white">
                                                    {scoreData.summary.score2.runs}-{scoreData.summary.score2.wickets}
                                                </div>
                                                <div className="text-sm font-bold text-gold">{scoreData.summary.score2.overs} Overs</div>
                                            </div>
                                        </div>

                                        {/* Result */}
                                        <div className="text-center pt-4 border-t border-white/10">
                                            <p className="text-green-400 font-bold uppercase tracking-widest text-lg">{scoreData.fixture.result_description || 'Match in Progress'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">No score data available.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpectatorMatches;
