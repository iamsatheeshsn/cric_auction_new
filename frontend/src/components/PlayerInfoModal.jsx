import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiCalendar, FiPhone, FiInfo, FiActivity, FiDollarSign } from 'react-icons/fi';

const PlayerInfoModal = ({ player, isOpen, onClose }) => {
    if (!isOpen || !player) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper for safe value
    const val = (v) => v || '-';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative"
                >
                    {/* Header Image / Pattern */}
                    <div className="h-32 bg-gradient-to-r from-deep-blue to-blue-700 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className="px-8 pb-8 -mt-16">

                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
                            {/* Avatar */}
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex-shrink-0 relative z-10">
                                {player.image_path ? (
                                    <img
                                        src={`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`}
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <FiUser size={48} />
                                    </div>
                                )}
                            </div>

                            {/* Name & Basic Info */}
                            <div className="flex-1 w-full relative z-10 md:pt-16">
                                <h2 className="text-3xl font-bold text-gray-800 break-words">{player.name}</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                                        {player.role}
                                    </span>
                                    {player.Team && (
                                        <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-100">
                                            {player.Team.name}
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${player.status === 'Sold' ? 'bg-green-50 text-green-700 border-green-100' :
                                        player.status === 'Unsold' ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        {player.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Personal Info</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FiCalendar size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500">Date of Birth</p>
                                            <p className="text-sm font-semibold text-gray-700">{formatDate(player.dob)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FiPhone size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500">Mobile</p>
                                            <p className="text-sm font-semibold text-gray-700">{val(player.mobile_number)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FiUser size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500">Father Name</p>
                                            <p className="text-sm font-semibold text-gray-700">{val(player.father_name)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cricketing Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Cricketing Stats</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FiActivity size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500">Batting Style</p>
                                            <p className="text-sm font-semibold text-gray-700">{val(player.batting_type)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><FiActivity size={14} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500">Bowling Style</p>
                                            <p className="text-sm font-semibold text-gray-700">{val(player.bowling_type)}</p>
                                        </div>
                                    </div>
                                    {player.status === 'Sold' && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><FiDollarSign size={14} /></div>
                                            <div>
                                                <p className="text-xs text-gray-500">Sold Price</p>
                                                <p className="text-sm font-bold text-green-700">₹{(player.sold_price || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System/Extra Info */}
                            <div className="md:col-span-2 space-y-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Other Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Jersey No</p>
                                        <p className="font-semibold text-gray-700">{val(player.jersey_no)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">T-Shirt Size</p>
                                        <p className="font-semibold text-gray-700">{val(player.tshirt_size)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Trouser Size</p>
                                        <p className="font-semibold text-gray-700">{val(player.trouser_size)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">PID</p>
                                        <p className="font-semibold text-gray-700">{val(player.order_id)}</p>
                                    </div>
                                </div>
                            </div>

                            {player.notes && (
                                <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                                    <p className="font-bold flex items-center gap-2 mb-1"><FiInfo /> Notes</p>
                                    {player.notes}
                                </div>
                            )}

                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PlayerInfoModal;
