import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPieChart, FiList, FiDollarSign } from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-toastify';

const WalletModal = ({ teamId, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && teamId) {
            fetchWalletDetails();
        }
    }, [isOpen, teamId]);

    const fetchWalletDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teams/${teamId}/wallet`);
            setWalletData(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load wallet details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center shrink-0 text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FiDollarSign className="text-gold" /> Wallet & Budget
                        </h2>
                        {walletData && <p className="text-gray-400 text-sm">{walletData.team.name}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <FiX />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'text-deep-blue border-b-2 border-deep-blue' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <FiPieChart /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-deep-blue border-b-2 border-deep-blue' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <FiList /> Transaction History
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue"></div></div>
                    ) : walletData ? (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Big Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Total Budget</p>
                                            <p className="text-lg font-black text-gray-800">₹{walletData.summary.total_budget?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-red-500 uppercase">Spent</p>
                                            <p className="text-lg font-black text-red-600">₹{walletData.summary.total_spent?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-green-500 uppercase">Remaining</p>
                                            <p className="text-lg font-black text-green-600">₹{walletData.summary.remaining?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Role Split */}
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-700 mb-4">Spending by Category</h3>
                                        <div className="space-y-4">
                                            {Object.keys(walletData.role_split).length === 0 && <p className="text-gray-400 text-center italic">No spending yet.</p>}
                                            {Object.entries(walletData.role_split).map(([role, amount]) => {
                                                const percent = (amount / walletData.summary.total_spent) * 100;
                                                return (
                                                    <div key={role}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-gray-600">{role}</span>
                                                            <span className="font-bold text-gray-800">₹{amount.toLocaleString()} ({Math.round(percent)}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-deep-blue h-full rounded-full" style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-3">
                                    {walletData.history.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400">No transactions recorded.</div>
                                    ) : (
                                        walletData.history.map((tx, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-800">Bought {tx.player_name}</p>
                                                    <p className="text-xs text-gray-500">{tx.role} • {new Date(tx.time).toLocaleString()}</p>
                                                </div>
                                                <div className="font-bold text-red-600">
                                                    - ₹{tx.amount?.toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </motion.div>
        </div>
    );
};

export default WalletModal;
