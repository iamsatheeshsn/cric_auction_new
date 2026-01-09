import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { FiX } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';

const Ticker = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            const res = await api.get('/auctions/ticker/recent-sales');
            setSales(res.data);
        } catch (error) {
            console.error("Ticker Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
        const interval = setInterval(fetchSales, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading || sales.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white z-50 overflow-hidden py-2 shadow-lg border-t border-slate-700">
            <div className="whitespace-nowrap animate-marquee flex items-center gap-8 pr-12">
                <span className="text-yellow-400 font-bold px-4 uppercase tracking-wider text-sm bg-slate-800 h-full py-1">
                    🔴 LIVE Updates
                </span>
                {sales.map((sale) => (
                    <span key={sale.id} className="text-sm font-medium flex items-center gap-2 text-slate-200">
                        <span className="text-white font-bold">{sale.playerName}</span>
                        <span className="text-xs text-slate-400">sold to</span>
                        <span className="font-semibold text-blue-400">{sale.teamName}</span>
                        <span className="text-xs text-slate-400">for</span>
                        {/* Assuming formatted */}
                        <span className="text-green-400 font-bold">{formatCurrency(sale.price)}</span>
                        <span className="text-xs text-slate-500">({sale.auctionName})</span>
                        <span className="text-slate-600">•</span>
                    </span>
                ))}
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute right-0 top-0 h-full px-4 bg-slate-900/90 hover:bg-slate-800 text-gray-400 hover:text-white transition-colors z-10 flex items-center justify-center border-l border-slate-700"
                title="Hide Ticker"
            >
                <FiX size={18} />
            </button>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default Ticker;
