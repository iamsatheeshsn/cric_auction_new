
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { FiMonitor, FiCpu, FiGrid, FiList, FiUsers, FiActivity } from 'react-icons/fi';
import SpectatorLiveRoom from '../components/spectator/SpectatorLiveRoom';
import SpectatorMatches from '../components/spectator/SpectatorMatches';
import SpectatorStandings from '../components/spectator/SpectatorStandings';
import SpectatorTeams from '../components/spectator/SpectatorTeams';
import { useSponsors } from '../context/SponsorContext';

const SpectatorView = () => {
    const { auctionId } = useParams();
    const [activeTab, setActiveTab] = useState('live'); // live, matches, standings, teams
    const [auction, setAuction] = useState(null);
    const { sponsors } = useSponsors();

    useEffect(() => {
        const fetchAuction = async () => {
            try {
                const res = await api.get(`/auctions/${auctionId}`);
                setAuction(res.data);
            } catch (error) {
                console.error("Failed to load auction info");
            }
        };
        fetchAuction();
    }, [auctionId]);

    const navItems = [
        { id: 'live', label: 'Live Room', icon: <FiMonitor /> },
        { id: 'matches', label: 'Matches', icon: <FiActivity /> },
        { id: 'standings', label: 'Points Table', icon: <FiList /> },
        { id: 'teams', label: 'Teams', icon: <FiUsers /> },
    ];

    if (!auction) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">Loading Portal...</div>;

    return (
        <div className="h-screen w-screen bg-slate-900 text-white overflow-hidden flex flex-col font-sans relative selection:bg-gold selection:text-black">

            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black z-0"></div>
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Header / Navbar */}
            <header className="relative z-20 h-16 lg:h-20 px-4 lg:px-8 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg lg:text-2xl font-black tracking-tight text-white/90 uppercase truncate max-w-[200px] lg:max-w-md">{auction.name}</h1>
                    <span className="hidden md:inline px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-400">Public Portal</span>
                </div>

                <nav className="flex gap-2 lg:gap-4 overflow-x-auto no-scrollbar">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === item.id
                                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                                : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 min-h-0">
                {activeTab === 'live' && <SpectatorLiveRoom auctionId={auctionId} />}
                {activeTab === 'matches' && <SpectatorMatches auctionId={auctionId} />}
                {activeTab === 'standings' && <SpectatorStandings auctionId={auctionId} />}
                {activeTab === 'teams' && <SpectatorTeams auctionId={auctionId} />}
            </main>

            {/* Sponsor Ticker */}
            {sponsors && sponsors.length > 0 && (
                <footer className="relative z-20 bg-white h-20 shrink-0 flex items-center overflow-hidden border-t-4 border-gold">
                    <div className="flex items-center animate-scroll whitespace-nowrap px-4">
                        {/* Duplicate lists for seamless scrolling */}
                        {[...sponsors, ...sponsors, ...sponsors, ...sponsors].map((sponsor, idx) => (
                            <div key={`${sponsor.id}-${idx}`} className="inline-flex items-center justify-center mx-8 h-14 w-40 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                            </div>
                        ))}
                    </div>
                </footer>
            )}

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
                .animate-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default SpectatorView;
