import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FiUsers, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../context/CurrencyContext';

const SpectatorTeams = ({ auctionId }) => {
    const { formatCurrency } = useCurrency();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                // Use the main auction teams endpoint to get rich data (images + players)
                const res = await api.get(`/teams/auction/${auctionId}?limit=100`);
                setTeams(res.data.teams);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTeams();
    }, [auctionId]);

    const handleTeamClick = (team) => {
        // Teams already include Players from the rich endpoint
        // Map 'Players' to 'squad' for compatibility with existing modal logic if needed, 
        // or just pass the team as is and update modal to use team.Players
        const squad = team.Players || [];
        setSelectedTeam({ ...team, squad });
    };

    const getImageUrl = (path) => {
        if (!path) return 'https://placehold.co/400x400/1e293b/475569?text=Team';
        if (path.toString().startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    return (
        <div className="p-4 lg:p-8 overflow-y-auto h-full pb-20">
            <h2 className="text-2xl font-black uppercase text-white mb-6 tracking-wide border-l-4 border-gold pl-4">Teams & Squads</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teams.map(team => (
                    <motion.div
                        key={team.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleTeamClick(team)}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/10 p-4 mb-4 border border-white/10">
                            <img src={getImageUrl(team.image_path || team.logo || team.logo_url)} className="w-full h-full object-contain" />
                        </div>
                        <h3 className="text-white font-bold text-lg text-center leading-tight">{team.name}</h3>
                        <div className="bg-gold/20 text-gold text-xs font-bold px-3 py-1 rounded-full mt-3 uppercase tracking-wider">
                            View Squad
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Squad Modal */}
            <AnimatePresence>
                {selectedTeam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 bg-slate-950 border-b border-white/10 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <img src={getImageUrl(selectedTeam.image_path || selectedTeam.logo || selectedTeam.logo_url)} className="w-12 h-12 object-contain" />
                                    <h2 className="text-2xl font-black text-white">{selectedTeam.name}</h2>
                                </div>
                                <button onClick={() => setSelectedTeam(null)} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedTeam.squad && selectedTeam.squad.length > 0 ? selectedTeam.squad.map(player => (
                                    <div key={player.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-4">
                                        <img src={getImageUrl(player.image_path)} className="w-12 h-12 rounded-full object-cover bg-slate-800" />
                                        <div>
                                            <h4 className="text-white font-bold">{player.name}</h4>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">{player.role}</p>
                                            <div className="text-gold font-mono text-sm font-bold mt-1">{formatCurrency(player.sold_price)}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center text-gray-500 italic py-12">No players bought yet.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpectatorTeams;
