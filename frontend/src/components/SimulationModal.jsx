import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';

const SimulationModal = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/20 relative"
                    >
                        {/* Header Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-100 z-0" />

                        <div className="relative z-10">
                            {/* Icon Bubble */}
                            <div className="flex justify-center -mb-8 mt-8">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="h-24 w-24 rounded-full bg-white p-2 shadow-xl flex items-center justify-center"
                                >
                                    <div className="h-full w-full rounded-full bg-indigo-50 flex items-center justify-center border-4 border-white">
                                        <FiCpu className="h-10 w-10 text-indigo-600 animate-pulse" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>

                            <div className="px-8 pt-12 pb-8 text-center mt-2">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Auto-Simulate Match</h3>
                                <p className="text-indigo-600 font-medium text-sm uppercase tracking-wider mb-6">AI-Powered Probability Engine</p>

                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-left">
                                    <div className="flex gap-3">
                                        <FiAlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-gray-700">
                                            <p className="font-bold text-gray-900 mb-1">Warning: Irreversible Action</p>
                                            <p>This will simulate the <strong>remainder of this innings/match</strong> instantly based on player roles and probabilities. Manual scoring will be skipped.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiCpu className="w-5 h-5" />
                                        Start Simulation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SimulationModal;
