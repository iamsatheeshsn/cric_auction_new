import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCpu, FiActivity, FiTarget, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../api/axios';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']; // Blue, Green, Yellow, Red

const SquadAnalysisModal = ({ show, onClose, auctionId, teamId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show && auctionId && teamId) {
            fetchAnalysis();
        }
    }, [show, auctionId, teamId]);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/analytics/squad/${auctionId}/${teamId}`);
            setData(res.data);
        } catch (error) {
            console.error("Analysis Error", error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    // Prepare Chart Data
    const chartData = data ? [
        { name: 'Batsmen', value: data.composition.batsmen },
        { name: 'Bowlers', value: data.composition.bowlers },
        { name: 'All Rounders', value: data.composition.allRounders },
        { name: 'Wicket Keepers', value: data.composition.wicketKeepers },
    ].filter(d => d.value > 0) : [];

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                    <FiCpu className="text-cyan-400" />
                                    AI Squad Analysis
                                </h2>
                                <p className="text-indigo-200 text-sm font-medium mt-1">
                                    Smart Report for <span className="text-white font-bold">{data?.teamName || 'Team'}</span>
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
                                    <p className="font-bold text-sm">Analyzing Squad Composition...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left: Ratings & Insights */}
                                    <div className="space-y-8">
                                        {/* Ratings Card */}
                                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                <FiActivity /> Performance Ratings
                                            </h3>

                                            <div className="space-y-6">
                                                {/* Batting */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="font-bold text-gray-700">Batting Strength</span>
                                                        <span className={`text-xl font-black ${getScoreColor(data.ratings.batting)}`}>{data.ratings.batting}/10</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${data.ratings.batting * 10}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${getScoreBg(data.ratings.batting)}`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bowling */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="font-bold text-gray-700">Bowling Depth</span>
                                                        <span className={`text-xl font-black ${getScoreColor(data.ratings.bowling)}`}>{data.ratings.bowling}/10</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${data.ratings.bowling * 10}%` }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                            className={`h-full rounded-full ${getScoreBg(data.ratings.bowling)}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Insights List */}
                                        <div>
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <FiTarget /> Key Insights
                                            </h3>
                                            <div className="space-y-3">
                                                {data.insights.map((msg, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 * i }}
                                                        className={`p-4 rounded-xl border-l-4 shadow-sm text-sm font-bold flex items-start gap-3 ${msg.includes('Strength') || msg.includes('Powerhouse') || msg.includes('Fortress') ? 'bg-green-50 border-green-500 text-green-800' :
                                                                msg.includes('Weakness') || msg.includes('Critical') ? 'bg-red-50 border-red-500 text-red-800' :
                                                                    'bg-blue-50 border-blue-500 text-blue-800'
                                                            }`}
                                                    >
                                                        <span className="mt-0.5 text-lg">
                                                            {msg.includes('Strength') || msg.includes('Powerhouse') || msg.includes('Fortress') ? <FiCheckCircle /> :
                                                                msg.includes('Weakness') || msg.includes('Critical') ? <FiAlertCircle /> : <FiActivity />}
                                                        </span>
                                                        {msg}
                                                    </motion.div>
                                                ))}
                                                {data.insights.length === 0 && (
                                                    <p className="text-gray-400 italic text-sm">No specific insights generated yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Balance Visual */}
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100 flex flex-col">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Squad Composition
                                        </h3>
                                        <div className="flex-1 min-h-[300px] relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                        itemStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>

                                            {/* Centered Total */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                                <span className="text-4xl font-black text-gray-900">{data.totalPlayers}</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Players</span>
                                            </div>
                                        </div>

                                        {/* Breakdown Grid */}
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <StatBox label="Batsmen" value={data.composition.batsmen} color="bg-blue-100 text-blue-700" />
                                            <StatBox label="Bowlers" value={data.composition.bowlers} color="bg-green-100 text-green-700" />
                                            <StatBox label="All Rounders" value={data.composition.allRounders} color="bg-yellow-100 text-yellow-700" />
                                            <StatBox label="Wicket Keepers" value={data.composition.wicketKeepers} color="bg-red-100 text-red-700" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Start Helper Components
const StatBox = ({ label, value, color }) => (
    <div className={`p-4 rounded-2xl ${color} bg-opacity-50 flex flex-col items-center justify-center`}>
        <span className="text-2xl font-black">{value}</span>
        <span className="text-[10px] font-bold uppercase opacity-70">{label}</span>
    </div>
);

const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
};

const getScoreBg = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
};

export default SquadAnalysisModal;
