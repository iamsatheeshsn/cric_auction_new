import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const SpectatorView = () => {
    const { auctionId } = useParams();
    const [auction, setAuction] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [currentBidder, setCurrentBidder] = useState(null);
    const [lastSold, setLastSold] = useState(null);

    // Polling Logic
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/auctions/${auctionId}/live`);
                const data = res.data;

                setAuction(data.auction);
                setCurrentPlayer(data.currentPlayer);
                setCurrentBid(data.currentBid);
                setCurrentBidder(data.currentBidder);

                if (data.lastSold) {
                    setLastSold(data.lastSold);
                }
            } catch (error) {
                console.error("Spectator Poll Error", error);
            }
        };

        fetchData(); // Initial Call
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [auctionId]);

    const getImageUrl = (path) => {
        if (!path) return 'https://placehold.co/400x400?text=No+Image';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    if (!auction) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white text-2xl font-bold font-mono tracking-widest animate-pulse">CONNECTING TO FEED...</div>;

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'batsman': return 'text-blue-400 border-blue-400';
            case 'bowler': return 'text-green-400 border-green-400';
            case 'all rounder': return 'text-purple-400 border-purple-400';
            case 'wicket keeper': return 'text-yellow-400 border-yellow-400';
            default: return 'text-gray-400 border-gray-400';
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden flex flex-col font-sans relative selection:bg-gold selection:text-black">

            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black z-0"></div>
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Header (Confined height) */}
            <header className="relative z-10 h-16 lg:h-20 px-8 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-gold text-black font-black px-3 py-1 lg:px-4 lg:py-2 rounded text-sm lg:text-lg tracking-wider">Live Auction Room</div>
                    <h1 className="text-xl lg:text-3xl font-bold tracking-tight text-white/90 uppercase truncate">{auction.name}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-2 bg-black/60 rounded-full border border-white/10">
                        <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${auction.status === 'Live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-mono font-bold tracking-wider text-xs lg:text-sm text-gray-300 uppercase">{auction.status}</span>
                    </div>
                </div>
            </header>

            {/* Main Content (Fills remaining height) */}
            <div className="flex-1 flex relative z-10 p-4 lg:p-8 gap-4 lg:gap-8 items-stretch min-h-0">

                {/* Left Panel: Last Sold */}
                <div className="hidden lg:flex w-64 xl:w-80 flex-col shrink-0">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden h-full">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
                        <h2 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">Last Sold</h2>

                        {lastSold ? (
                            <div className="flex-1 flex flex-col items-center text-center">
                                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 relative bg-black/50">
                                    <img src={getImageUrl(lastSold.image_path)} className="w-full h-full object-cover grayscale opacity-80" alt={lastSold.name} />
                                </div>
                                <h3 className="text-lg font-black text-white leading-tight mb-1">{lastSold.name}</h3>
                                <div className="text-xs text-gray-400 mb-2">{lastSold.Team?.name}</div>
                                <div className="mt-auto w-full bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                                    <div className="text-green-400 text-[10px] font-bold uppercase">Sold For</div>
                                    <div className="text-lg font-black text-white">₹{lastSold.sold_price?.toLocaleString()}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-600 opacity-50 text-sm">Waiting...</div>
                        )}
                    </div>
                </div>

                {/* Center Stage */}
                <div className="flex-1 relative min-w-0">
                    <AnimatePresence mode="wait">
                        {currentPlayer ? (
                            <motion.div
                                key={currentPlayer.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8"
                            >
                                {/* Player Image */}
                                <div className="relative h-full min-h-0 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800 group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                                    <img
                                        src={getImageUrl(currentPlayer.image_path)}
                                        className="w-full h-full object-cover object-top transition-transform duration-[3s] group-hover:scale-105"
                                        alt={currentPlayer.name}
                                    />
                                    {/* Mobile/Tablet Overlay Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 md:hidden block">
                                        <h2 className="text-3xl font-black text-white uppercase">{currentPlayer.name}</h2>
                                        <div className="text-gold font-bold">Base Price: ₹{parseInt(auction?.min_bid || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Stats & Bid Info */}
                                <div className="flex flex-col h-full min-h-0 gap-4 lg:gap-6 justify-center">

                                    {/* Desktop Header */}
                                    <div className="hidden md:block shrink-0">
                                        <div className={`inline-block px-3 py-1 rounded border mb-2 font-bold tracking-widest uppercase text-xs ${getRoleColor(currentPlayer.role)}`}>
                                            {currentPlayer.role}
                                        </div>
                                        {/* Reduced Font Size */}
                                        <h1 className="text-[3vw] xl:text-[4vw] font-black text-white uppercase leading-none tracking-tighter drop-shadow-xl mb-2 lg:mb-4 truncate">
                                            {currentPlayer.name}
                                        </h1>
                                        <div className="flex gap-2 lg:gap-3 flex-wrap">
                                            {currentPlayer.batting_type && (
                                                <span className="bg-white/10 px-3 py-1 rounded text-xs lg:text-sm text-gray-300 font-medium">{currentPlayer.batting_type}</span>
                                            )}
                                            {currentPlayer.bowling_type && (
                                                <span className="bg-white/10 px-3 py-1 rounded text-xs lg:text-sm text-gray-300 font-medium">{currentPlayer.bowling_type}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop Base Price */}
                                    <div className="hidden md:flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm w-fit shrink-0">
                                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Base Price</div>
                                        <div className="text-2xl lg:text-3xl font-mono font-bold text-white">₹{parseInt(auction?.min_bid || 0).toLocaleString()}</div>
                                    </div>

                                    {/* Live Bid Card - Flex Grower */}
                                    <div className="flex-1 min-h-0 bg-gradient-to-r from-slate-900 to-slate-800 border border-white/20 rounded-3xl p-4 lg:p-8 flex flex-col justify-center relative shadow-2xl overflow-hidden">

                                        <div className="text-gold font-bold uppercase tracking-[0.2em] lg:tracking-[0.4em] mb-2 px-1 text-xs lg:text-base animate-pulse shrink-0">
                                            Current High Bid
                                        </div>

                                        {/* Massive Bid - Uses viewport min unit to scale perfectly */}
                                        <div className="font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-glow shrink-0"
                                            style={{ fontSize: 'clamp(3rem, 10vmin, 9rem)' }}>
                                            ₹{currentBid.toLocaleString()}
                                        </div>

                                        {currentBidder ? (
                                            <div className="mt-4 lg:mt-6 flex items-center gap-4 lg:gap-6 animate-slide-up shrink-0 bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                                                {/* Team Logo - Cleaner Design */}
                                                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-white rounded-full flex items-center justify-center p-2 shadow-lg shrink-0">
                                                    {currentBidder.image_path ? (
                                                        <img src={getImageUrl(currentBidder.image_path)} className="w-full h-full object-contain" alt={currentBidder.short_name} />
                                                    ) : (
                                                        <span className="text-slate-900 font-black text-xl">{currentBidder.short_name?.[0]}</span>
                                                    )}
                                                </div>

                                                {/* Team Name Info - Allow Wrapping */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="text-xs lg:text-sm text-gray-400 font-bold uppercase tracking-wider mb-0.5">Held By</div>
                                                    <div className="text-lg lg:text-2xl font-black text-white leading-tight break-words drop-shadow-md">
                                                        {currentBidder.name}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 lg:mt-6 text-base lg:text-xl text-gray-500 italic shrink-0">Waiting for opening bid...</div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <div className="text-6xl lg:text-9xl mb-6 grayscale">🏏</div>
                                <h2 className="text-2xl lg:text-5xl font-black uppercase tracking-widest text-white">Next Player Arriving...</h2>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SpectatorView;
