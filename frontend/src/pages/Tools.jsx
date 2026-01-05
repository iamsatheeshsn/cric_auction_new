import React, { useState } from 'react';
import Layout from '../components/Layout';
import { calculateDLSTarget, getResourcePercentage } from '../utils/dlsUtils';
import { FiDroplet, FiRefreshCw, FiActivity } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Tools = () => {
    const [matchFormat, setMatchFormat] = useState('T20'); // T20 or ODI
    const [team1Score, setTeam1Score] = useState('');
    const [totalOvers, setTotalOvers] = useState(20);

    // Interruption State
    // Simple version: Assuming Team 2 chasing is interrupted or starts with reduced overs.
    // For full DLS, you track every ball. We will implement "Revised Target at start of 2nd Inning" scenario typical for simple use.

    const [oversBowled, setOversBowled] = useState(''); // When did rain stop play?
    const [wicketsLost, setWicketsLost] = useState('');
    const [oversLost, setOversLost] = useState(''); // How many overs lost?

    const [result, setResult] = useState(null);

    const calculate = () => {
        if (!team1Score || team1Score < 0) {
            alert("Please enter Team 1's score");
            return;
        }

        // Calculate Team 1 Resources based on Total Overs (vital for T10/5-over)
        // In our table, 20 overs = 100%. For T10, 10 overs = ~58%.
        // The ratio R2/R1 will handle the scaling correctly.
        const t1Resources = getResourcePercentage(parseFloat(totalOvers), 0);
        let t2Resources = t1Resources;

        // Calculate Team 2 Resources
        // If overs lost > 0
        if (oversLost && oversLost > 0) {
            const oversRemainingInitial = parseFloat(totalOvers) - (parseFloat(oversBowled) || 0);
            const resInitial = getResourcePercentage(oversRemainingInitial, parseInt(wicketsLost) || 0);

            const oversRemainingFinal = oversRemainingInitial - parseFloat(oversLost);
            const resFinal = getResourcePercentage(oversRemainingFinal, parseInt(wicketsLost) || 0);

            // Resources lost = Initial - Final
            // Total T2 Resources = T1 Resources - Resources Lost
            const loss = Math.max(0, resInitial - resFinal);
            t2Resources = t1Resources - loss;
        }

        const calc = calculateDLSTarget(parseInt(team1Score), t1Resources, t2Resources, matchFormat);
        setResult({
            ...calc,
            t2Resources: ((t2Resources / t1Resources) * 100).toFixed(1) // Show % relative to full match
        });
    };

    const reset = () => {
        setTeam1Score('');
        setOversBowled('');
        setWicketsLost('');
        setOversLost('');
        setResult(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <Layout>
            <div className="w-full px-4 py-8">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-10 text-white mb-10 shadow-2xl overflow-hidden"
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
                        <h1 className="text-5xl font-black mb-4 flex items-center gap-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                                DLS Calculator
                            </span>
                        </h1>
                        <p className="text-blue-100/70 text-lg max-w-xl leading-relaxed">
                            Simulate rain-affected simplified Duckworth-Lewis-Stern targets instantly.
                            Support for T20, T10, 5-Over and Custom formats.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Inputs Panel */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8"
                    >
                        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <FiActivity className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Match Configuration</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Set basic match parameters</p>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <motion.div variants={itemVariants} className="group">
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
                            </motion.div>

                            <motion.div variants={itemVariants}>
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
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Team 1 Score</label>
                                <input
                                    type="number"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Runs Scored"
                                    value={team1Score}
                                    onChange={(e) => setTeam1Score(e.target.value)}
                                />
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <FiDroplet className="text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Interruption Details</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">For 2nd Innings interruption</p>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <motion.div variants={itemVariants}>
                                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Overs Bowled</label>
                                <input
                                    type="number"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="e.g. 5.2"
                                    value={oversBowled}
                                    onChange={(e) => setOversBowled(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">When rain started</p>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Wickets Lost</label>
                                <input
                                    type="number"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="0-9"
                                    value={wicketsLost}
                                    onChange={(e) => setWicketsLost(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">At pending interruption</p>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Overs Lost</label>
                                <input
                                    type="number"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="e.g. 4"
                                    value={oversLost}
                                    onChange={(e) => setOversLost(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Total overs deducted</p>
                            </motion.div>
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

                    </motion.div>

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
                </div>
            </div >
        </Layout >
    );
};

export default Tools;
