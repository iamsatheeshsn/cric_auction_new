import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiStar, FiTrendingUp, FiAward, FiClock, FiTarget } from 'react-icons/fi';
import HistoryCard from '../components/HistoryCard';
import { useCurrency } from '../context/CurrencyContext';

const TournamentHistory = () => {
    const { formatCurrency } = useCurrency();
    const [activeTab, setActiveTab] = useState('tournaments');
    const [tournaments, setTournaments] = useState([]);
    const [hallOfFame, setHallOfFame] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tournRes, hofRes] = await Promise.all([
                axios.get('http://localhost:5000/api/history/tournaments'),
                axios.get('http://localhost:5000/api/history/hall-of-fame')
            ]);
            setTournaments(tournRes.data);
            setHallOfFame(hofRes.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                ${activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}
            `}
        >
            {icon}
            {label}
        </button>
    );

    const StatCard = ({ title, player, value, label, subtext, color = "blue", icon }) => {
        if (!player) return null;

        const gradientMap = {
            blue: "from-blue-500 to-cyan-500",
            purple: "from-purple-500 to-pink-500",
            yellow: "from-yellow-500 to-orange-500",
            green: "from-emerald-500 to-teal-500",
            red: "from-red-500 to-rose-500"
        };

        const bgGradient = gradientMap[color] || gradientMap.blue;

        // Fix Image Path
        const rawPath = player.image_path || player.player?.image_path || '/uploads/default.png';
        const imagePath = rawPath.replace(/\\/g, '/').startsWith('/') ? rawPath.replace(/\\/g, '/') : `/${rawPath.replace(/\\/g, '/')}`;

        return (
            <div className="relative group overflow-hidden bg-gray-900 rounded-3xl p-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-[22px] p-6 h-full border border-white/5">

                    {/* Floating Icon Background */}
                    <div className={`absolute -right-6 -top-6 text-9xl text-white/5 rotate-12 group-hover:rotate-[15deg] transition-transform duration-700`}>
                        {icon}
                    </div>

                    <div className="relative z-10">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-${color}-400 text-xs font-bold uppercase tracking-wider mb-6 border border-white/10`}>
                            {icon} {title}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} rounded-full blur-md opacity-50`}></div>
                                <img
                                    src={`http://localhost:5000${imagePath}`}
                                    alt={player.name || player.player?.name}
                                    className="relative w-24 h-24 rounded-full object-cover border-4 border-gray-800 shadow-2xl"
                                />
                                {subtext && (
                                    <div className="absolute -bottom-2 -right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-gray-700 shadow-lg">
                                        {subtext}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white leading-tight mb-1">
                                    {player.name || player.player?.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${bgGradient}`}>
                                        {value}
                                    </span>
                                    {label && <span className="text-gray-400 font-bold text-sm uppercase">{label}</span>}
                                </div>
                                {player.team && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                        <p className="text-gray-400 text-sm">{player.team?.name || player.Team?.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-b from-gray-900 to-[#0B0F19] pt-12 pb-24 px-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"></div>
                    <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[96px]"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                        Legends & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Legacy</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Explore the rich history of our tournaments, celebrate the champions, and honor the record-breakers who defined the game.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-24">

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-12">
                    <TabButton id="tournaments" label="Past Seasons" icon={<FiClock />} />
                    <TabButton id="hallOfFame" label="Hall of Fame" icon={<FiStar />} />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 animate-pulse font-medium">Loading History...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'tournaments' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {tournaments.length > 0 ? (
                                    tournaments.map(t => (
                                        <HistoryCard key={t.id} auction={t} />
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
                                        <FiAward className="text-6xl text-gray-700 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-400">No Tournaments Completed Yet</h3>
                                        <p className="text-gray-500 mt-2">Finish a season to see it listed here.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'hallOfFame' && hallOfFame && (
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <StatCard
                                        title="Most Expensive Signing"
                                        player={hallOfFame.mostExpensive?.player}
                                        value={formatCurrency(hallOfFame.mostExpensive?.price)}
                                        subtext={hallOfFame.mostExpensive?.auction?.name} // Pass simple string
                                        color="yellow"
                                        icon={<FiTrendingUp />}
                                    />
                                    <StatCard
                                        title="All-Time Run Machine"
                                        player={hallOfFame.topBatsman?.player}
                                        value={hallOfFame.topBatsman?.runs}
                                        label="Runs"
                                        color="blue"
                                        icon={<FiTarget />}
                                    />
                                    <StatCard
                                        title="Wicket Wrecking Ball"
                                        player={hallOfFame.topBowler?.player}
                                        value={hallOfFame.topBowler?.wickets}
                                        label="Wickets"
                                        color="purple"
                                        icon={<FiStar />}
                                    />
                                </div>

                                {/* Placeholder for more stats later */}
                                <div className="bg-gray-900/50 rounded-3xl p-8 border border-white/5 text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">More records coming soon...</h3>
                                    <p className="text-gray-500">Highest scores, best bowling figures, and team stats will be added as more matches are played.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TournamentHistory;
