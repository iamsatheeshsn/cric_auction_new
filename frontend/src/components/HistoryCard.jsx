import React from 'react';
import { FiCalendar, FiMapPin, FiAward, FiTarget, FiTrendingUp } from 'react-icons/fi';

const HistoryCard = ({ auction }) => {
    const getImagePath = (path) => {
        if (!path) return '/uploads/default.png';
        const cleanPath = path.replace(/\\/g, '/');
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    };

    return (
        <div className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/10">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

            <div className="relative p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full mb-3 border border-blue-500/20">
                            {auction.type} Season
                        </span>
                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                            {auction.name}
                        </h3>
                    </div>
                    {auction.status === 'Completed' ? (
                        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/20 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Completed
                        </div>
                    ) : (
                        <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-500/20">
                            In Progress
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-blue-400">
                            <FiCalendar />
                        </div>
                        <div className="text-sm">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
                            <p className="font-medium text-gray-300">{auction.auction_date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-purple-400">
                            <FiMapPin />
                        </div>
                        <div className="text-sm">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Venue</p>
                            <p className="font-medium text-gray-300">{auction.place}</p>
                        </div>
                    </div>
                </div>

                {/* Winner Section */}
                <div className="space-y-4">
                    {/* Champion */}
                    <div className={`
                        relative bg-gradient-to-r from-yellow-500/10 to-transparent p-4 rounded-xl border border-yellow-500/20
                        ${!auction.Winner && 'opacity-50 grayscale'}
                    `}>
                        <div className="absolute -left-1 top-4 w-1 h-8 bg-yellow-500 rounded-r-lg"></div>
                        <p className="text-xs text-yellow-500 font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FiAward className="text-lg" /> Champion
                        </p>
                        {auction.Winner ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={`http://localhost:5000${getImagePath(auction.Winner.image_path)}`}
                                    alt={auction.Winner.name}
                                    className="w-10 h-10 rounded-full border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                                />
                                <span className="text-lg font-bold text-white">{auction.Winner.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500 italic">To Be Decided</span>
                        )}
                    </div>

                    {/* Runner Up & MOS row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Runner Up */}
                        <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Runner Up</p>
                            {auction.RunnerUp ? (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={`http://localhost:5000${getImagePath(auction.RunnerUp.image_path)}`}
                                        alt={auction.RunnerUp.name}
                                        className="w-8 h-8 rounded-full border border-gray-600 grayscale hover:grayscale-0 transition-all"
                                    />
                                    <span className="text-sm font-semibold text-gray-300">{auction.RunnerUp.name}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-600">-</span>
                            )}
                        </div>

                        {/* Man of Series */}
                        <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-2">MVP</p>
                            {auction.ManOfTheSeries ? (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={`http://localhost:5000${getImagePath(auction.ManOfTheSeries.image_path)}`}
                                        alt={auction.ManOfTheSeries.name}
                                        className="w-8 h-8 rounded-full border border-purple-500 object-cover"
                                    />
                                    <div className="overflow-hidden">
                                        <span className="text-sm font-semibold text-white block truncate">{auction.ManOfTheSeries.name}</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-600">-</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryCard;
