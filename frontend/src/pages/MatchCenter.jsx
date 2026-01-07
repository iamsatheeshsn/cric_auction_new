import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiActivity, FiYoutube, FiMessageSquare, FiUser } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateWinProbability } from '../utils/AIModel';
import ChatBox from '../components/social/ChatBox';

const MatchCenter = () => {
    const { matchId } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('commentary'); // commentary, scorecard

    useEffect(() => {
        fetchMatchData();
        const interval = setInterval(fetchMatchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [matchId]);

    const fetchMatchData = async () => {
        try {
            const res = await api.get(`/score/match/${matchId}`);
            setMatchData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!matchData?.fixture) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Match Data Not Found</div>;

    const { fixture, summary, balls, winProbability } = matchData;
    const isTeam1Batting = fixture.current_innings === 1 ? (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id === fixture.team1_id : fixture.toss_winner_id !== fixture.team1_id) : (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id !== fixture.team1_id : fixture.toss_winner_id === fixture.team1_id);

    // Helper to get Player Name
    const getPlayer = (id) => {
        if (!id) return null;
        const p1 = fixture.Team1?.Players?.find(p => p.id === id);
        const p2 = fixture.Team2?.Players?.find(p => p.id === id);
        return p1 || p2;
    };

    // Helper to format Image URL
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/150?text=P';
        return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
    };

    // always recalculate state from last ball to ensure consistency with commentary
    // or use fixture state if available, but validate it.
    // simpler: Use the Smart Logic as the PRIMARY source for Live matches, falling back to fixture if balls are empty.

    let currentStrikerId = null;
    let currentNonStrikerId = null;
    let currentBowlerId = null;

    if (balls && balls.length > 0) {
        const lastBall = balls[balls.length - 1];

        let nextStriker = lastBall.striker_id;
        let nextNonStriker = lastBall.non_striker_id;
        let nextBowler = lastBall.bowler_id;

        // 1. Calculate Runs for Rotation
        const runs = lastBall.runs_scored;
        const extras = lastBall.extras;
        const extraType = lastBall.extra_type;

        const swapRuns = runs + (['Byes', 'LegByes'].includes(extraType) ? extras : 0);

        if (swapRuns % 2 !== 0) {
            [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
        }

        // 2. Handle Wicket (Loose Equality for IDs)
        if (lastBall.is_wicket) {
            if (lastBall.player_out_id == nextStriker) nextStriker = null;
            if (lastBall.player_out_id == nextNonStriker) nextNonStriker = null;
        }

        // 3. Handle End of Over
        const isLegal = (extraType !== 'Wide' && extraType !== 'NoBall');
        if (lastBall.ball_number === 6 && isLegal) {
            [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
            nextBowler = null;
        }

        currentStrikerId = nextStriker;
        currentNonStrikerId = nextNonStriker;
        currentBowlerId = nextBowler;
    } else {
        // Fallback to fixture if no balls yet (start of match)
        currentStrikerId = fixture.striker_id;
        currentNonStrikerId = fixture.non_striker_id;
        currentBowlerId = fixture.bowler_id;
    }

    const striker = getPlayer(currentStrikerId);
    const nonStriker = getPlayer(currentNonStrikerId);
    const bowler = getPlayer(currentBowlerId);

    const processWormData = () => {
        // ... (existing worm logic)
        const data = [{ over: 0, r1: 0, r2: 0 }];

        if (!balls || balls.length === 0) return data;

        const innings1Balls = balls.filter(b => b.innings === 1);
        const innings2Balls = balls.filter(b => b.innings === 2);

        let sum1 = 0;
        let sum2 = 0;

        // Find maximum over bowled (DB is 0-indexed, so add 1 for display max)
        const maxOver1 = innings1Balls.length > 0 ? (innings1Balls[innings1Balls.length - 1].over_number + 1) : 0;
        const maxOver2 = innings2Balls.length > 0 ? (innings2Balls[innings2Balls.length - 1].over_number + 1) : 0;
        const maxOvers = Math.max(maxOver1, maxOver2, 5); // Minimum 5 overs for chart

        for (let i = 1; i <= maxOvers; i++) {
            // Innings 1
            const over1Balls = innings1Balls.filter(b => b.over_number === i - 1);
            over1Balls.forEach(b => sum1 += b.runs_scored + b.extras);

            // Innings 2
            const over2Balls = innings2Balls.filter(b => b.over_number === i - 1);
            over2Balls.forEach(b => sum2 += b.runs_scored + b.extras);

            data.push({
                over: i,
                r1: i <= maxOver1 ? sum1 : null,
                r2: i <= maxOver2 ? sum2 : null
            });
        }
        return data;
    };

    const processWinProbabilityHistory = () => {
        // Only valid if Innings 2 has started or completed
        if (fixture.current_innings === 1 && fixture.status !== 'Completed') return [];

        // Need Summary (Target)
        if (!summary || !summary.score1) return [];

        const target = summary.score1.runs + 1;
        const totalOvers = fixture.total_overs || 20;
        const totalBalls = totalOvers * 6;

        const history = [];
        // Initial State (Start of Innings 2)
        // 50-50 Start usually
        history.push({ over: 0, team1: 50, team2: 50 });

        const inn2Balls = balls.filter(b => b.innings === 2);

        // We iterate ball by ball OR over by over. Let's do Over by Over for graph smoothness.
        // We need state AT END of each over.

        let currentRuns = 0;
        let currentWickets = 0;
        let ballsBowled = 0;

        // Group by over
        // DB is 0-indexed.
        const maxOver = inn2Balls.length > 0 ? Math.max(...inn2Balls.map(b => b.over_number)) : 0;

        for (let i = 0; i <= maxOver; i++) {
            const overBalls = inn2Balls.filter(b => b.over_number === i);

            // Update State with this over
            overBalls.forEach(b => {
                currentRuns += b.runs_scored + b.extras;
                if (b.is_wicket) currentWickets++;
                if (b.extra_type !== 'Wide' && b.extra_type !== 'NoBall') ballsBowled++;
            });

            // Calculate Prob at this point
            const runsNeeded = Math.max(0, target - currentRuns);
            const ballsLeft = Math.max(0, totalBalls - ballsBowled);
            const wicketsHand = 10 - currentWickets;

            // Calculate
            const chaseProb = calculateWinProbability(runsNeeded, ballsLeft, wicketsHand, target);

            // Map chaseProb to Team1/Team2
            // Chasing Team logic (same as MatchScoring/AIModel)
            const isTeam1TossWinner = String(fixture.toss_winner_id) === String(fixture.team1_id);
            const tossDecision = fixture.toss_decision;
            let chasingTeamId;
            if (tossDecision === 'Bat') {
                chasingTeamId = isTeam1TossWinner ? fixture.team2_id : fixture.team1_id;
            } else {
                chasingTeamId = isTeam1TossWinner ? fixture.team1_id : fixture.team2_id;
            }
            const isChasingTeam1 = String(chasingTeamId) === String(fixture.team1_id);

            let p1, p2;
            if (isChasingTeam1) {
                p1 = chaseProb;
                p2 = 100 - chaseProb;
            } else {
                p2 = chaseProb;
                p1 = 100 - chaseProb;
            }

            history.push({
                over: i + 1,
                team1: p1,
                team2: p2
            });
        }

        return history;
    };

    const wormData = processWormData();
    const waspData = processWinProbabilityHistory();

    // Live Current Win Probability (Client Side Recalculation)
    const currentWinProb = (() => {
        if (waspData.length > 0) {
            const last = waspData[waspData.length - 1];
            return { team1: last.team1, team2: last.team2 };
        }
        // Fallback if Innings 1
        return { team1: 50, team2: 50 };
    })();

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link to="/fixtures/1" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <FiArrowLeft /> <span className="hidden sm:inline">Back</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <img src={getImageUrl(fixture.Team1?.image_path)} className="w-8 h-8 object-contain" />
                            <span className="font-bold uppercase hidden sm:inline">{fixture.Team1?.short_name}</span>
                        </div>
                        <span className="font-black text-slate-500 text-sm">VS</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold uppercase hidden sm:inline">{fixture.Team2?.short_name}</span>
                            <img src={getImageUrl(fixture.Team2?.image_path)} className="w-8 h-8 object-contain" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> {fixture.status}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Content (Left) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Score Card Hero */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                                    Match #{fixture.match_order} • {fixture.venue}
                                </h2>
                                {fixture.status === 'Completed' && (
                                    <div className="px-4 py-1.5 bg-yellow-500/20 text-yellow-500 rounded-full font-bold text-xs uppercase border border-yellow-500/30 animate-pulse">
                                        Match Completed
                                    </div>
                                )}
                            </div>

                            {/* Result Banner */}
                            {fixture.status === 'Completed' && fixture.result_description && (
                                <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                    <p className="text-lg md:text-xl font-bold text-white tracking-tight">
                                        🏆 {fixture.result_description}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2">
                                        {fixture.current_innings === 1 ? summary?.score1?.runs : summary?.score2?.runs}
                                        <span className="text-4xl md:text-6xl text-slate-500">/{fixture.current_innings === 1 ? summary?.score1?.wickets : summary?.score2?.wickets}</span>
                                    </h1>
                                    <p className="text-xl text-blue-400 font-bold">
                                        {fixture.current_innings === 1 ? summary?.score1?.overs : summary?.score2?.overs} Overs
                                        <span className="ml-3 text-slate-500 text-base font-normal">CRR: {(fixture.current_innings === 1 ? (summary?.score1?.runs * 6 / Math.max(1, summary?.score1?.legalBalls)) : (summary?.score2?.runs * 6 / Math.max(1, summary?.score2?.legalBalls)) || 0).toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-lg font-bold text-white mb-1">
                                        {isTeam1Batting ? fixture.Team1?.name : fixture.Team2?.name}
                                    </p>
                                    <p className="text-slate-400 text-sm">opted to {fixture.toss_decision}</p>
                                </div>
                            </div>

                            {/* Batters / Bowler Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/10 pt-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">On Strike</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 bg-slate-800 flex items-center justify-center">
                                            {striker ? (
                                                <img
                                                    src={getImageUrl(striker.image_path)}
                                                    className="w-full h-full object-cover"
                                                    alt={striker.name}
                                                />
                                            ) : (
                                                <FiUser className="text-slate-500 text-xl" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">{striker?.name || 'Next Batter'}</p>
                                            <p className="text-xs text-blue-400 font-mono mt-0.5">{striker?.role || 'Waiting...'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Non-Striker</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-800 flex items-center justify-center">
                                            {nonStriker ? (
                                                <img
                                                    src={getImageUrl(nonStriker.image_path)}
                                                    className="w-full h-full object-cover"
                                                    alt={nonStriker.name}
                                                />
                                            ) : (
                                                <FiUser className="text-slate-500 text-xl" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">{nonStriker?.name || 'Next Batter'}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{nonStriker?.role || 'Waiting...'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bowler</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500 bg-slate-800 flex items-center justify-center">
                                            {bowler ? (
                                                <img
                                                    src={getImageUrl(bowler.image_path)}
                                                    className="w-full h-full object-cover"
                                                    alt={bowler.name}
                                                />
                                            ) : (
                                                <FiUser className="text-slate-500 text-xl" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">{bowler?.name || 'Next Bowler'}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{bowler?.role || 'Waiting...'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Win Probability */}
                        <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FiActivity /> Win Probability
                            </h3>

                            {/* Bar */}
                            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden flex relative">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: '50%' }}
                                    animate={{ width: `${currentWinProb.team1}%` }}
                                    transition={{ duration: 1 }}
                                />
                                <div className="absolute inset-0 flex justify-between items-center px-2 text-[10px] font-black uppercase text-white/90">
                                    <span>{fixture.Team1?.short_name} {Math.round(currentWinProb.team1)}%</span>
                                    <span>{fixture.Team2?.short_name} {Math.round(currentWinProb.team2)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                                Playing Now
                            </h3>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-200 font-bold">{isTeam1Batting ? fixture.Team1?.name : fixture.Team2?.name}</span>
                                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">BATTING</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                                vs {isTeam1Batting ? fixture.Team2?.name : fixture.Team1?.name}
                            </div>
                        </div>
                    </div>

                    {/* Worm Chart */}
                    <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 backdrop-blur-sm min-h-[300px]">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                            Run Rate Comparison
                        </h3>
                        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={wormData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="over" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                                    <Line type="monotone" dataKey="r1" stroke="#3b82f6" strokeWidth={3} dot={false} name={fixture.Team1?.short_name} connectNulls />
                                    <Line type="monotone" dataKey="r2" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" name={fixture.Team2?.short_name} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right) - Commentary */}
                <div className="lg:col-span-4 flex flex-col h-[calc(100vh-100px)] sticky top-24">
                    <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-white/10 flex-1 overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <FiMessageSquare className="text-blue-400" /> Live Commentary
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Auto-Update</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar-dark">
                            {/* Commentary Items */}
                            {matchData.balls && matchData.balls.slice().reverse().map((ball, i) => {
                                const ballBowler = getPlayer(ball.bowler_id);
                                const ballStriker = getPlayer(ball.striker_id);
                                return (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="flex flex-col items-center min-w-[3rem]">
                                            <span className="font-bold text-sm text-slate-300">{ball.over_number}.{ball.ball_number}</span>
                                        </div>
                                        <div className="pb-4 border-b border-white/5 w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center gap-1.5 bg-slate-700/50 rounded-full pr-3 pl-1 py-1">
                                                    <img
                                                        src={getImageUrl(ballBowler?.image_path)}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                    <span className="text-xs font-bold text-slate-300">{ballBowler?.name || 'Bowler'}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-bold">TO</span>
                                                <div className="flex items-center gap-1.5 bg-slate-700/50 rounded-full pr-3 pl-1 py-1">
                                                    <img
                                                        src={getImageUrl(ballStriker?.image_path)}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                    <span className="text-xs font-bold text-slate-300">{ballStriker?.name || 'Batter'}</span>
                                                </div>
                                                {ball.is_wicket && <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">WICKET</span>}
                                                {ball.runs_scored === 4 && <span className="ml-auto text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">FOUR</span>}
                                                {ball.runs_scored === 6 && <span className="ml-auto text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">SIX</span>}
                                            </div>

                                            <p className="text-sm text-slate-400 leading-relaxed pl-1">{ball.commentary || "Detailed commentary unavailable."}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!matchData.balls || matchData.balls.length === 0) && (
                                <div className="text-center py-10 text-slate-500 text-sm">
                                    Match starting soon...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Chat */}
            {matchData?.fixture?.auction_id && (
                <ChatBox auctionId={matchData.fixture.auction_id} />
            )}
        </div>
    );
};

export default MatchCenter;
