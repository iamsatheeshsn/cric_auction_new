import React, { useState } from 'react';
import Layout from '../components/Layout';
import { calculateDLSTarget, getResourcePercentage, RESOURCE_TABLE_T20 } from '../utils/dlsUtils';
import { FiDroplet, FiRefreshCw, FiActivity, FiTable, FiWifi, FiPlayCircle, FiCheckCircle } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Tools = () => {
    const [activeTab, setActiveTab] = useState('calculator'); // calculator, table, live

    // Calculator State
    const [matchFormat, setMatchFormat] = useState('T20');
    const [team1Score, setTeam1Score] = useState('');
    const [totalOvers, setTotalOvers] = useState(20);
    const [oversBowled, setOversBowled] = useState('');
    const [wicketsLost, setWicketsLost] = useState('');
    const [oversLost, setOversLost] = useState('');
    const [result, setResult] = useState(null);

    // Live Match State
    const [matchId, setMatchId] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [liveData, setLiveData] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, connecting, connected, error

    const calculate = () => {
        if (!team1Score || team1Score < 0) {
            alert("Please enter Team 1's score");
            return;
        }

        const t1Resources = getResourcePercentage(parseFloat(totalOvers), 0);
        let t2Resources = t1Resources;

        if (oversLost && oversLost > 0) {
            const oversRemainingInitial = parseFloat(totalOvers) - (parseFloat(oversBowled) || 0);
            const resInitial = getResourcePercentage(oversRemainingInitial, parseInt(wicketsLost) || 0);

            const oversRemainingFinal = oversRemainingInitial - parseFloat(oversLost);
            const resFinal = getResourcePercentage(oversRemainingFinal, parseInt(wicketsLost) || 0);

            const loss = Math.max(0, resInitial - resFinal);
            t2Resources = t1Resources - loss;
        }

        const calc = calculateDLSTarget(parseInt(team1Score), t1Resources, t2Resources, matchFormat);
        setResult({
            ...calc,
            t2Resources: ((t2Resources / t1Resources) * 100).toFixed(1)
        });
    };

    const reset = () => {
        setTeam1Score('');
        setOversBowled('');
        setWicketsLost('');
        setOversLost('');
        setResult(null);
    };

    const handleConnect = () => {
        if (!matchId) return;
        setConnectionStatus('connecting');

        // Simulate API call
        setTimeout(() => {
            setConnectionStatus('connected');
            setIsConnected(true);
            setLiveData({
                team1: "Royal Challengers Bangalore",
                team2: "Chennai Super Kings",
                t1Score: "185/6",
                overs: "20.0",
                currentStatus: "Innings Break - Rain Delay detected",
                rainStoppedAt: "0.0",
                targetOvers: "16"
            });
            // Pre-fill calculator
            setTeam1Score('185');
            setTotalOvers(20);
            setResult(null);
            // Switch to calculator tab to show user they can now calc
            // setActiveTab('calculator'); // Optional: auto-switch or let them stay
        }, 1500);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <Layout>
            <div className="w-full px-4 py-8 max-w-7xl mx-auto">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 md:p-10 text-white mb-8 shadow-2xl overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <FaCalculator className="text-[12rem] text-white rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                                Match Utilities
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                                DLS Calculator
                            </span>
                        </h1>
                        <p className="text-blue-100/70 text-lg max-w-xl leading-relaxed">
                            Simulate rain-affected simplified Duckworth-Lewis-Stern targets instantly.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 md:pb-0">
                        {[
                            { id: 'calculator', label: 'Calculator', icon: FaCalculator },
                            { id: 'table', label: 'Resource Table', icon: FiTable },
                            { id: 'live', label: 'Live Match', icon: FiWifi }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-white text-indigo-900 shadow-lg scale-105'
                                        : 'bg-white/10 text-blue-200 hover:bg-white/20'}`}
                            >
                                <tab.icon className="text-lg" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode='wait'>

                    {/* CALCULATOR TAB */}
                    {activeTab === 'calculator' && (
                        <motion.div
                            key="calculator"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
                        >
                            {/* Inputs Panel */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <FiActivity className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Match Configuration</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Set basic match parameters</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="group">
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Format Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                value={matchFormat}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setMatchFormat(val);
                                                    if (val === 'T20') setTotalOvers(20);
                                                    else if (val === 'ODI') setTotalOvers(50);
                                                    else if (val === 'T10') setTotalOvers(10);
                                                    else if (val === 'FIVE5') setTotalOvers(5);
                                                }}
                                            >
                                                <option value="T20">T20 (20 Ov)</option>
                                                <option value="ODI">ODI (50 Ov)</option>
                                                <option value="T10">T10 (10 Ov)</option>
                                                <option value="FIVE5">Five5 (5 Ov)</option>
                                                <option value="Custom">Custom</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Total Overs / Side</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                placeholder="20"
                                                value={totalOvers}
                                                onChange={(e) => {
                                                    setTotalOvers(e.target.value);
                                                    setMatchFormat('Custom');
                                                }}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Overs</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Team 1 Score</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="Runs Scored"
                                            value={team1Score}
                                            onChange={(e) => setTeam1Score(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <FiDroplet className="text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Interruption Details</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">For 2nd Innings interruption</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div>
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Overs Bowled</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="e.g. 5.2"
                                            value={oversBowled}
                                            onChange={(e) => setOversBowled(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">When rain started</p>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Wickets Lost</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="0-9"
                                            value={wicketsLost}
                                            onChange={(e) => setWicketsLost(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">At pending interruption</p>
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Overs Lost</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            placeholder="e.g. 4"
                                            value={oversLost}
                                            onChange={(e) => setOversLost(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Total overs deducted</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={calculate}
                                        className="flex-1 bg-deep-blue text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        Calculate Target
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-6 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                    >
                                        <FiRefreshCw />
                                    </button>
                                </div>

                            </div>

                            {/* Result Card */}
                            <div className="md:col-span-1">
                                <div className={`h-full rounded-3xl p-8 border transition-all duration-500 sticky top-4 flex flex-col justify-center
                                    ${result ? 'bg-deep-blue text-white shadow-xl border-deep-blue' : 'bg-slate-50 border-slate-200 text-slate-400 border-dashed'}`}
                                >
                                    {result ? (
                                        <div className="text-center">
                                            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-2">Revised Target</p>
                                            <h2 className="text-6xl font-black mb-1">{result.revisedTarget}</h2>
                                            <p className="text-blue-300 text-lg mb-8">Runs to win</p>

                                            <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold opacity-70">Par Score</span>
                                                    <span className="font-bold">{result.projectedScore}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold opacity-70">Diff</span>
                                                    <span className="font-bold text-green-400">+{result.revisedTarget - result.projectedScore}</span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-blue-200 mt-4">
                                                Resources Remaining: {result.t2Resources}%
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-50">
                                            <FaCalculator className="text-6xl mx-auto mb-4" />
                                            <p className="font-bold">Enter match details to calculate target</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* RESOURCE TABLE TAB */}
                    {activeTab === 'table' && (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">DLS Resource Table (T20)</h3>
                                    <p className="text-slate-500">Standard resource percentages based on Overs Remaining & Wickets Lost</p>
                                </div>
                                <button className="text-sm bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg font-bold text-slate-600 dark:text-slate-300">
                                    Export CSV
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-center border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                            <th className="p-3 border dark:border-slate-700 font-bold">Overs Left</th>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(w => (
                                                <th key={w} className="p-3 border dark:border-slate-700 font-bold text-indigo-500">
                                                    {w} Wkt
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(RESOURCE_TABLE_T20).sort((a, b) => b[0] - a[0]).map(([overs, resources]) => (
                                            <tr key={overs} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 border dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                                                    {overs}
                                                </td>
                                                {resources.map((res, idx) => (
                                                    <td key={idx} className="p-3 border dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                                        {res}%
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* LIVE MATCH TAB */}
                    {activeTab === 'live' && (
                        <motion.div
                            key="live"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
                                    <FiWifi className="text-4xl" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Connect to Live Match Data</h3>
                                <p className="text-slate-500 mb-8">Enter a match ID to pull real-time DLS parameters.</p>

                                <div className="flex gap-4 max-w-md mx-auto mb-8">
                                    <input
                                        type="text"
                                        placeholder="Match ID (e.g. IPL-2024-45)"
                                        value={matchId}
                                        onChange={(e) => setMatchId(e.target.value)}
                                        className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    />
                                    <button
                                        onClick={handleConnect}
                                        disabled={connectionStatus === 'connecting' || !matchId}
                                        className="bg-red-500 text-white px-8 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {connectionStatus === 'connecting' ? (
                                            <>
                                                <FiRefreshCw className="animate-spin" /> Connecting...
                                            </>
                                        ) : 'Connect'}
                                    </button>
                                </div>

                                {isConnected && liveData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-left"
                                    >
                                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-wider mb-4">
                                            <FiCheckCircle /> Live Data Feed Active
                                        </div>

                                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                                            <div>
                                                <div className="text-lg font-bold text-slate-800 dark:text-white">{liveData.team1}</div>
                                                <div className="text-sm text-slate-500">Batting First</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-800 dark:text-white">{liveData.t1Score}</div>
                                                <div className="text-sm text-slate-500">{liveData.overs} Overs</div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-200 p-4 rounded-xl text-sm font-medium mb-4 flex items-start gap-3">
                                            <FiActivity className="mt-1" />
                                            <div>
                                                <div className="font-bold">Match Status: {liveData.currentStatus}</div>
                                                <div>Rain interrupted at 0.0 overs of 2nd innings. Target overs reduced to {liveData.targetOvers}.</div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-center text-slate-400">
                                            Data automatically populated into Calculator tab.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default Tools;
