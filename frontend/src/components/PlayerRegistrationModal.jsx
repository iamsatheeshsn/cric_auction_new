import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiUser, FiCheck, FiPlus } from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-toastify';

const PlayerRegistrationModal = ({ isOpen, onClose, auctionId, onPlayerRegistered }) => {
    const [players, setPlayers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [registeringId, setRegisteringId] = useState(null);

    // Base price state mapping (playerId -> price)
    const [basePrices, setBasePrices] = useState({});

    useEffect(() => {
        if (isOpen && auctionId) {
            fetchUnregisteredPlayers();
        }
    }, [isOpen, auctionId, search]);

    const fetchUnregisteredPlayers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/players/unregistered/${auctionId}?search=${search}`);
            setPlayers(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleRegister = async (player) => {
        try {
            const points = basePrices[player.id];

            if (!points || parseInt(points) <= 0) {
                toast.error("Please enter a valid Base Price");
                return;
            }

            setRegisteringId(player.id);
            // Default to 0 if not set is removed as validation is now in place
            // const points = basePrices[player.id] || 0; 

            await api.post('/players/register', {
                auction_id: auctionId,
                player_id: player.id,
                points: parseInt(points)
            });

            toast.success(`${player.name} registered!`);

            // Remove from list locally for smoother UX
            setPlayers(prev => prev.filter(p => p.id !== player.id));
            if (onPlayerRegistered) onPlayerRegistered();

            setRegisteringId(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to register player");
            setRegisteringId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Register Players</h2>
                            <p className="text-gray-500 text-sm mt-1">Select players from the global pool to add to this auction</p>
                        </div>
                        <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors">
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Search Bar - Enhanced Design */}
                    <div className="p-6 bg-gray-50/50 shrink-0">
                        <div className="relative group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-deep-blue transition-colors text-lg" />
                            <input
                                type="text"
                                placeholder="Search by name, role..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue transition-all outline-none text-gray-700 placeholder-gray-400 text-base"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/50">
                        {loading && players.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <div className="w-8 h-8 border-4 border-blue-100 border-t-deep-blue rounded-full animate-spin mb-4"></div>
                                <p>Finding players...</p>
                            </div>
                        ) : players.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <FiUser size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">No players found</h3>
                                <p className="text-gray-500 text-sm">Try searching for a different name</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {players.map(player => (
                                    <div key={player.id} className="flex grid grid-cols-[auto_1fr_auto_auto] items-end gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">

                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full bg-gray-50 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                            {player.image_path ? (
                                                <img src={`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><FiUser size={24} /></div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-deep-blue transition-colors">{player.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{player.role}</span>
                                                <span className="text-xs text-gray-400">• {player.batting_type}</span>
                                            </div>
                                        </div>

                                        {/* Base Price Input */}
                                        <div className="flex flex-col items-end gap-1">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Base Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-28 pl-6 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-deep-blue focus:ring-2 focus:ring-deep-blue/10 outline-none text-right font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                                                    onChange={(e) => setBasePrices(prev => ({ ...prev, [player.id]: e.target.value }))}
                                                    value={basePrices[player.id] || ''}
                                                />
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => handleRegister(player)}
                                            disabled={registeringId === player.id}
                                            className="bg-deep-blue text-white hover:bg-blue-900 active:bg-blue-950 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ml-2"
                                        >
                                            {registeringId === player.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <FiPlus /> Register
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PlayerRegistrationModal;
