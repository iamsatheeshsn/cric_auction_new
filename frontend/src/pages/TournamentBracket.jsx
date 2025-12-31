import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { FiAward, FiArrowLeft, FiRefreshCw, FiX, FiCheckCircle, FiCalendar, FiActivity } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentBracket = () => {
    const { auctionId } = useParams();
    const [bracket, setBracket] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pointsTable, setPointsTable] = useState([]);
    const [showGenerationModal, setShowGenerationModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [winnerModalData, setWinnerModalData] = useState(null); // { matchId, winnerId, team }

    useEffect(() => {
        fetchData();
    }, [auctionId]);

    const fetchData = async () => {
        try {
            const [bracketRes, pointsRes] = await Promise.all([
                api.get(`/tournament/auction/${auctionId}/bracket`),
                api.get(`/tournament/auction/${auctionId}/points`)
            ]);
            setBracket(bracketRes.data);
            setPointsTable(pointsRes.data);
        } catch (error) {
            console.error("Failed to load tournament data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateClick = () => {
        setShowGenerationModal(true);
    };

    const confirmGenerateKnockouts = async () => {
        setGenerating(true);
        try {
            await api.post(`/tournament/auction/${auctionId}/generate-knockouts`);
            toast.success("Fixtures generated successfully!");
            setShowGenerationModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate");
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkWinner = (matchId, team) => {
        setWinnerModalData({ matchId, winnerId: team.id, team });
    };

    const confirmWinner = async () => {
        if (!winnerModalData) return;
        setGenerating(true);
        try {
            await api.post('/tournament/mark-winner', { fixtureId: winnerModalData.matchId, winnerId: winnerModalData.winnerId });
            toast.success(`${winnerModalData.team.name} marked as winner!`);
            setWinnerModalData(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update winner");
        } finally {
            setGenerating(false);
        }
    };

    // --- Components ---

    const TeamRow = ({ team, isWinner, isTBD, matchId, isCompleted }) => (
        <div className={`flex items-center justify-between p-3 group/row ${isWinner ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden bg-white shadow-sm ${isWinner ? 'border-yellow-400' : 'border-gray-100'}`}>
                    {team?.image_path ? (
                        <img src={`http://localhost:5000/${team.image_path}`} alt={team.short_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs font-bold text-gray-300">?</span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isWinner ? 'text-gray-900' : 'text-gray-600'}`}>
                        {team?.name || (isTBD ? 'TBD' : 'Waiting...')}
                    </span>
                    {team?.short_name && <span className="text-[10px] text-gray-400 tracking-wider font-medium">{team.short_name}</span>}
                </div>
            </div>
            {isWinner && <FiAward className="text-yellow-500 drop-shadow-sm" />}
            {!isCompleted && team && (
                <button
                    onClick={() => handleMarkWinner(matchId, team)}
                    className="p-1.5 text-gray-200 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors group-hover/row:opacity-100 opacity-0"
                    title="Mark as Winner"
                >
                    <FaCrown size={14} />
                </button>
            )}
        </div>
    );

    const MatchCard = ({ match, title, showConnectorRight, showConnectorLeft, showConnectorTop, showConnectorBottom }) => {
        const isTeam1Winner = match?.winning_team_id && match?.winning_team_id === match?.team1_id;
        const isTeam2Winner = match?.winning_team_id && match?.winning_team_id === match?.team2_id;
        const isCompleted = match?.status === 'Completed';

        return (
            <div className="relative group min-w-[280px]">
                {/* Connectors */}
                {showConnectorRight && <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-gray-300 hidden md:block" />}
                {showConnectorLeft && <div className="absolute top-1/2 -left-8 w-8 h-[2px] bg-gray-300 hidden md:block" />}

                {/* Vertical Connectors for IPL Layout */}
                {showConnectorBottom && <div className="absolute bottom-[-20px] left-1/2 w-[2px] h-[20px] bg-gray-300 hidden md:block" />}
                {showConnectorTop && <div className="absolute top-[-20px] left-1/2 w-[2px] h-[20px] bg-gray-300 hidden md:block" />}

                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{title || match?.stage}</h4>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <TeamRow team={match?.Team1} isWinner={isTeam1Winner} isTBD={!match?.Team1} matchId={match?.id} isCompleted={isCompleted} />
                    <div className="h-[1px] bg-gray-100 w-full" />
                    <TeamRow team={match?.Team2} isWinner={isTeam2Winner} isTBD={!match?.Team2} matchId={match?.id} isCompleted={isCompleted} />

                    <div className="bg-gray-50 px-3 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <FiCalendar size={10} />
                            {match?.match_date ? new Date(match.match_date).toLocaleDateString() : 'Date TBD'}
                        </div>
                        {isCompleted && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                Finished
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ChampionCard = ({ team }) => (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center justify-center mt-8 relative"
        >
            <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full" />
            <div className="relative bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-200 p-8 rounded-3xl shadow-xl text-center min-w-[260px]">
                <div className="mb-4 relative inline-block">
                    <div className="absolute -top-6 -right-6 text-yellow-500 animate-bounce">
                        <FiAward size={40} />
                    </div>
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-100 shadow-inner overflow-hidden mx-auto bg-white">
                        {team?.image_path && <img src={`http://localhost:5000/${team.image_path}`} className="w-full h-full object-cover" />}
                    </div>
                </div>
                <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Tournament Champion</h3>
                <h1 className="text-2xl font-black text-gray-900">{team?.name}</h1>
            </div>
        </motion.div>
    );

    const stages = {
        qf: bracket.filter(m => m.stage.includes('Quarter')),
        sf: bracket.filter(m => m.stage.includes('Semi')),
        final: bracket.filter(m => m.stage.includes('Final')),
        // IPL Stages
        iplQ1: bracket.find(m => m.stage.includes('Qualifier 1')),
        iplElim: bracket.find(m => m.stage.includes('Eliminator')),
        iplQ2: bracket.find(m => m.stage.includes('Qualifier 2')),
    };

    const isIPLFormat = stages.iplQ1 && stages.iplElim;

    // Calculate actual winner team object if final is complete
    const champion = stages.final[0]?.status === 'Completed' ?
        (stages.final[0].winning_team_id === stages.final[0].team1_id ? stages.final[0].Team1 : stages.final[0].Team2)
        : null;

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50 -m-8 p-8 relative overflow-hidden">

                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-slate-50 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-200/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div className="flex items-center gap-6">
                        <Link to="/auctions" className="group p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                            <FiArrowLeft className="text-gray-400 group-hover:text-blue-600 transition-colors" size={20} />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">Knockout Stage</h1>
                            <p className="text-gray-500 font-medium">Tournament Bracket & Fixtures</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Guide (Integrated into Header) */}
                        <div className="hidden xl:flex items-center gap-6 bg-white/50 backdrop-blur-sm border border-gray-100 px-4 py-3 rounded-2xl">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 pr-4 mr-2">
                                <FiActivity /> Guide
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                                    <span>Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaCrown className="text-yellow-500" size={10} />
                                    <span>Mark Winner</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateClick}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-xl transition-all group ${bracket.length > 0 ? 'bg-white text-red-600 border border-red-100 hover:bg-red-50' : 'bg-gray-900 text-white hover:bg-black hover:scale-105 hover:shadow-2xl'}`}
                        >
                            <FiRefreshCw className={`transition-transform duration-500 ${bracket.length > 0 ? '' : 'group-hover:rotate-180'}`} />
                            {bracket.length > 0 ? 'Regenerate Fixtures' : 'Generate Fixtures'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FiActivity className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                ) : bracket.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center mx-auto max-w-4xl shadow-sm"
                    >
                        <div className="bg-blue-50 p-8 rounded-full mb-6 text-blue-600 mb-8 ring-8 ring-blue-50/50">
                            <FiAward size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3">Ready for the Knockouts?</h2>
                        <p className="text-gray-500 max-w-lg text-lg mb-10 leading-relaxed">
                            The league stage has concluded. It's time to generate the fixtures for the Playoffs.
                        </p>

                        {pointsTable.length > 0 && (
                            <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl shadow-gray-100/50">
                                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm">
                                    <h4 className="font-bold text-gray-700">Projected Qualifiers</h4>
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Top 4</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {pointsTable.slice(0, 4).map((t, i) => (
                                        <div key={t.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-bold text-gray-900">{t.Team?.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-400">{t.points} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (

                    /* Bracket View */
                    <div className="flex flex-col items-center justify-center min-h-[60vh] relative z-10 w-full max-w-7xl mx-auto px-4">

                        {/* Legend / Info Panel Removed from here (Moved to Header) */}

                        {isIPLFormat ? (
                            /* IPL Layout - Compact Grid */
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-center justify-items-center">

                                {/* Col 1: Qualifier 1 & Eliminator */}
                                <div className="flex flex-col gap-16 w-full max-w-sm relative">
                                    {stages.iplQ1 && (
                                        <div className="relative">
                                            <MatchCard
                                                match={stages.iplQ1}
                                                title="Qualifier 1"
                                                showConnectorRight={true}
                                            />
                                            {/* Vertical Path to Final (Winner Q1) */}
                                            <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-gradient-to-r from-gray-300 to-transparent hidden md:block" />
                                        </div>
                                    )}
                                    {stages.iplElim && (
                                        <div className="relative">
                                            <MatchCard
                                                match={stages.iplElim}
                                                title="Eliminator"
                                                showConnectorRight={true}
                                            />
                                            {/* Path to Q2 (Winner Eliminator) */}
                                        </div>
                                    )}
                                </div>

                                {/* Col 2: Qualifier 2 */}
                                <div className="flex flex-col justify-center w-full max-w-sm relative mt-8 md:mt-32">
                                    {stages.iplQ2 && (
                                        <>
                                            {/* Connector from Loser Q1 (Top Left) */}
                                            <svg className="absolute -top-24 -left-1/2 w-full h-24 pointer-events-none hidden md:block overflow-visible z-0">
                                                <path d="M0,0 C50,0 50,100 100,100" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
                                            </svg>

                                            <MatchCard
                                                match={stages.iplQ2}
                                                title="Qualifier 2"
                                                showConnectorLeft={true}
                                                showConnectorRight={true}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Col 3: Final */}
                                <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm">
                                    <div className="relative z-10 scale-110">
                                        <MatchCard
                                            match={stages.final[0]}
                                            title="Grand Final"
                                            showConnectorLeft={true}
                                        />
                                        <div className="absolute -inset-4 bg-yellow-400/20 blur-xl -z-10 rounded-full opacity-50 animate-pulse"></div>
                                    </div>

                                    {champion && <ChampionCard team={champion} />}
                                </div>
                            </div>
                        ) : (
                            /* Standard Layout - Flex */
                            <div className="flex flex-wrap items-center justify-center gap-12 w-full">
                                {/* Auto-responsive flex layout for non-IPL formats */}
                                {stages.qf.length > 0 && (
                                    <div className="flex flex-col gap-8">
                                        {stages.qf.map((m, i) => (
                                            <MatchCard key={m.id} match={m} title={`QF ${i + 1}`} showConnectorRight={true} />
                                        ))}
                                    </div>
                                )}
                                {stages.sf.length > 0 && (
                                    <div className="flex flex-col gap-24">
                                        {stages.sf.map((m, i) => (
                                            <MatchCard key={m.id} match={m} title={`SF ${i + 1}`} showConnectorRight={true} showConnectorLeft={true} />
                                        ))}
                                    </div>
                                )}
                                {stages.final.length > 0 && (
                                    <div className="flex flex-col items-center gap-8">
                                        <MatchCard match={stages.final[0]} title="Final" showConnectorLeft={true} />
                                        {champion && <ChampionCard team={champion} />}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showGenerationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setShowGenerationModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
                        >
                            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 scale-150">
                                    <FiAward size={140} />
                                </div>
                                <h2 className="text-3xl font-black relative z-10 tracking-tight">Generate Fixtures</h2>
                                <p className="text-slate-400 relative z-10 mt-2">Confirm Knockout Qualification</p>
                                <button
                                    onClick={() => setShowGenerationModal(false)}
                                    className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-20"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="p-8">
                                <p className="text-gray-600 font-medium mb-6 leading-relaxed">
                                    {bracket.length > 0 ? (
                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 block mb-2 text-sm">
                                            ⚠️ Warning: This will DELETE existing matches and regenerate new ones.
                                        </span>
                                    ) : (
                                        <>The following <strong>Top 4 Teams</strong> will advance to the Semi Finals.<br /></>
                                    )}
                                    Fixtures will be automatically generated based on current standings.
                                </p>

                                <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100 mb-8">
                                    {pointsTable.slice(0, 4).map((team, index) => (
                                        <div key={team.id} className="flex items-center justify-between p-3 first:rounded-t-xl last:rounded-b-xl hover:bg-white transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-bold text-gray-900">{team.Team?.name}</span>
                                            </div>
                                            <FiCheckCircle className="text-green-500" />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowGenerationModal(false)}
                                        className="flex-1 py-4 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmGenerateKnockouts}
                                        disabled={generating}
                                        className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg shadow-slate-200 hover:shadow-xl transition-all flex justify-center items-center gap-3 disabled:opacity-70"
                                    >
                                        {generating ? (
                                            <>
                                                <FiRefreshCw className="animate-spin" /> Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FiRefreshCw /> Confirm
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Winner Confirmation Modal */}
            <AnimatePresence>
                {winnerModalData && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setWinnerModalData(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden text-center"
                        >
                            <div className="pt-10 pb-8 px-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-yellow-50 to-white -z-10" />

                                <div className="mb-6 relative inline-block">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="absolute -top-6 -right-4 text-yellow-500 drop-shadow-lg"
                                    >
                                        <FaCrown size={32} />
                                    </motion.div>
                                    <div className="w-24 h-24 rounded-full border-4 border-yellow-100 shadow-xl overflow-hidden mx-auto bg-white p-1">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                                            {winnerModalData.team?.image_path ? (
                                                <img src={`http://localhost:5000/${winnerModalData.team.image_path}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-2xl">?</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-1">Confirm Winner</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Are you sure you want to mark <br />
                                    <strong className="text-gray-800 text-lg">{winnerModalData.team.name}</strong> <br />
                                    as the winner of this match?
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setWinnerModalData(null)}
                                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmWinner}
                                        disabled={generating}
                                        className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-all flex justify-center items-center gap-2"
                                    >
                                        {generating ? <FiRefreshCw className="animate-spin" /> : <FaCrown />}
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default TournamentBracket;
