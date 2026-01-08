import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCommand, FiCornerDownLeft, FiMap, FiUsers, FiGrid, FiHash } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // -- Static Pages --
    const pages = [
        { id: 'dashboard', title: 'Dashboard', type: 'Page', path: '/dashboard', icon: <FiGrid /> },
        { id: 'calendar', title: 'Calendar', type: 'Page', path: '/calendar', icon: <FiMap /> },
        { id: 'auctions', title: 'Auctions', type: 'Page', path: '/auctions', icon: <FiHash /> },
        { id: 'players', title: 'Players', type: 'Page', path: '/players', icon: <FiUsers /> },
        { id: 'watchlist', title: 'Watchlist', type: 'Page', path: '/watchlist', icon: <FiUsers /> },
        { id: 'stats', title: 'Stats Hub', type: 'Page', path: '/stats', icon: <FiGrid /> },
        { id: 'points', title: 'Points Table', type: 'Page', path: '/points', icon: <FiGrid /> },
    ];

    // -- Keyboard Shortcuts --
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // -- Search Logic --
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            return;
        }

        const search = async () => {
            let filtered = [];

            // 1. Filter Static Pages
            if (query.length === 0) {
                setResults(pages.slice(0, 5)); // Show recent/default
                return;
            }

            const pageMatches = pages.filter(p =>
                p.title.toLowerCase().includes(query.toLowerCase())
            );
            filtered = [...pageMatches];

            // 2. Fetch Dynamic Data (Teams/Players) - Simplified for now
            // In a real app, you might debounce this or fetch all once and cache
            if (query.length > 2) {
                try {
                    // Example: Quick search endpoints
                    // Ideally: const res = await api.get(`/search?q=${query}`);
                    // For now, we will just search pages. To add teams/players, we need an endpoint.
                    // Let's stick to pages + basic simulated delay for now or fetch existing lists if cached.
                } catch (err) {
                    console.error(err);
                }
            }

            setResults(filtered);
            setSelectedIndex(0);
        };

        const timeoutId = setTimeout(search, 100);
        return () => clearTimeout(timeoutId);
    }, [query, isOpen]);

    // -- Navigation --
    useEffect(() => {
        const handleNav = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleNav);
        return () => window.removeEventListener('keydown', handleNav);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (item) => {
        navigate(item.path);
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15 }}
                        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden relative z-10 border border-gray-200 dark:border-slate-700 flex flex-col max-h-[60vh]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-slate-700">
                            <FiSearch className="text-xl text-gray-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search pages, teams, or players..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400"
                            />
                            <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-gray-500 font-medium">
                                <span>ESC</span>
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="overflow-y-auto py-2 custom-scrollbar">
                            {results.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-400">
                                    <p>No results found.</p>
                                </div>
                            ) : (
                                <div className="px-2">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">
                                        Navigation
                                    </div>
                                    {results.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors
                                                ${index === selectedIndex
                                                    ? 'bg-deep-blue text-white shadow-md'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-lg ${index === selectedIndex ? 'text-white' : 'text-gray-400'}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="font-medium">{item.title}</span>
                                            </div>
                                            {index === selectedIndex && (
                                                <FiCornerDownLeft className="text-white/70" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 dark:bg-slate-900/50 px-4 py-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 flex justify-between items-center">
                            <div className="flex gap-4">
                                <span><strong className="font-medium">↑↓</strong> to navigate</span>
                                <span><strong className="font-medium">↵</strong> to select</span>
                            </div>
                            <span>Command Palette</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
