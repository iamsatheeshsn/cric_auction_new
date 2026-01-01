import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const WinProbability = ({ probability, team1, team2, allBalls, fixture }) => {
    const location = useLocation();

    // --- Worm Graph Data Preparation ---
    const chartData = useMemo(() => {
        if (!allBalls || allBalls.length === 0) return [];

        // Separate innings
        const inn1Balls = allBalls.filter(b => b.innings === 1);
        const inn2Balls = allBalls.filter(b => b.innings === 2);

        // Helper to aggregate runs per over
        const getAggregatedData = (balls) => {
            const data = {}; // { overNum: cumulativeRuns }
            let cumulative = 0;

            // Sort by over then ball
            const sorted = [...balls].sort((a, b) => {
                if (a.over_number !== b.over_number) return a.over_number - b.over_number;
                return a.ball_number - b.ball_number;
            });

            // We want data points at END of each over. 
            // Also can do ball-by-ball but Worm is typically Over-by-Over.
            // Let's do Over-by-Over for cleaner chart.

            // Group by over
            const maxOver = sorted.length > 0 ? sorted[sorted.length - 1].over_number : 0;

            for (let i = 0; i <= maxOver; i++) {
                // Get all balls for this over (and previous to sum up)
                // Actually easier: iterate balls, update sum, at end of over push point.
            }

            const points = [];
            let currentRuns = 0;
            let currentOver = 0;

            sorted.forEach(b => {
                currentRuns += (b.runs_scored + b.extras);

                // Check if it's the last ball of the over or last ball available
                if (b.ball_number === 6 || b.is_over_end_indicator) { // simplified check
                    // But we might not have is_over_end_indicator from backend yet (it implies inferred)
                    // Let's just store the cumulative runs for the over number.
                }
            });

            // BETTER APPROACH: Just map Over Number -> Cumulative Score
            const overMap = new Map();
            let sum = 0;

            // Group balls by over
            const overs = {};
            sorted.forEach(b => {
                if (!overs[b.over_number]) overs[b.over_number] = [];
                overs[b.over_number].push(b);
            });

            const totalOvers = fixture?.total_overs || 20;

            const finalPoints = [];
            let runSum = 0;

            // Start at 0,0
            finalPoints.push({ over: 0, runs: 0 });

            for (let o = 0; o <= Math.max(maxOver, 0); o++) {
                if (overs[o]) {
                    overs[o].forEach(b => runSum += (b.runs_scored + b.extras));
                    // If over matches, push
                    finalPoints.push({ over: o + 1, runs: runSum });
                } else if (o < maxOver) {
                    // Empty over (maiden? or missing data?) -> Assuming continuous
                    // If we skipped an over, it means 0 runs? 
                    // Usually data is continuous.
                }
            }
            return finalPoints;
        };

        const d1 = getAggregatedData(inn1Balls);
        const d2 = getAggregatedData(inn2Balls);

        // Merge for Recharts
        // structured: [ { name: 'Over 1', team1: 5, team2: 6 }, ... ]

        const merged = [];
        const maxLen = Math.max(d1.length, d2.length, (fixture?.total_overs || 20) + 1);

        for (let i = 0; i < maxLen; i++) {
            const p1 = d1.find(p => p.over === i);
            const p2 = d2.find(p => p.over === i);

            if (p1 || p2) {
                merged.push({
                    name: i,
                    team1: p1 ? p1.runs : null,
                    team2: p2 ? p2.runs : null,
                });
            }
        }
        return merged;

    }, [allBalls, fixture]);

    // --- Projected Score Calculation ---
    const projectedScore = useMemo(() => {
        if (!fixture || !allBalls) return null;

        const currentInnings = fixture.current_innings || 1;
        const balls = allBalls.filter(b => b.innings === currentInnings);
        if (balls.length === 0) return null;

        const totalRuns = balls.reduce((sum, b) => sum + (b.runs_scored + b.extras), 0);

        // Overs bowled
        // Count legal balls
        const legalBalls = balls.filter(b => b.extra_type !== 'Wide' && b.extra_type !== 'NoBall').length;
        const oversBowled = legalBalls / 6;

        if (oversBowled === 0) return null;

        const crr = totalRuns / oversBowled;
        const totalOvers = fixture.total_overs || 20;
        const proj = Math.round(crr * totalOvers);

        return { score: proj, crr: crr.toFixed(2), runs: totalRuns, overs: oversBowled.toFixed(1) };

    }, [allBalls, fixture]);


    return (
        <div className={location.pathname.includes('/match-analytics') ? "w-full mb-8" : "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"}>
            {/* 1. Win Probability */}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="font-bold text-gray-700 dark:text-white mb-6 uppercase tracking-wide flex items-center gap-2">
                    <span>📊</span> Win Probability (WASP)
                </h3>

                {probability ? (
                    <>
                        <div className="relative h-12 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                            <div
                                className="h-full bg-blue-600 flex items-center justify-start pl-4 text-sm font-bold text-white transition-all duration-1000 relative"
                                style={{ width: `${probability.team1}%` }}
                            >
                                <span className={`absolute left-4 z-10 ${probability.team1 < 15 ? 'hidden' : ''}`}>{Math.round(probability.team1)}%</span>
                            </div>
                            <div
                                className="h-full bg-orange-500 flex items-center justify-end pr-4 text-sm font-bold text-white transition-all duration-1000 relative"
                                style={{ width: `${probability.team2}%` }}
                            >
                                <span className={`absolute right-4 z-10 ${probability.team1 > 85 ? 'hidden' : ''}`}>{Math.round(probability.team2)}%</span>
                            </div>

                            {/* Center Marker */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 z-20"></div>
                        </div>

                        <div className="flex justify-between mt-4 text-sm font-bold">
                            <div className="text-blue-600 flex flex-col">
                                <span className="text-lg">{team1 || 'Team 1'}</span>
                                <span className="text-xs text-gray-400 font-normal">Win Probability</span>
                            </div>
                            <div className="text-orange-500 flex flex-col items-end">
                                <span className="text-lg">{team2 || 'Team 2'}</span>
                                <span className="text-xs text-gray-400 font-normal">Win Probability</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-gray-200 dark:border-white/5">
                        <p className="font-bold text-gray-500 dark:text-gray-400">
                            {(fixture?.status === 'Completed')
                                ? "Match Completed - See Result Above"
                                : ((fixture?.current_innings || 1) === 1 ? "Win Probability unlocks in 2nd Innings" : "Waiting for sufficient data...")}
                        </p>
                    </div>
                )}

                {projectedScore && (
                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Run Rate</h4>
                                <div className="text-2xl font-black text-slate-700 dark:text-white">{projectedScore.crr}</div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Projected Score</h4>
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                    {projectedScore.score}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* 2. Worm Graph */}
            {!location.pathname.includes('/match-analytics') && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
                    <h3 className="font-bold text-gray-700 dark:text-white mb-6 uppercase tracking-wide flex items-center gap-2">
                        <span>📈</span> Worm Graph & Comparison
                    </h3>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    label={{ value: 'Overs', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false} // Remove ticks
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="team1"
                                    name={team1 || "Innings 1"}
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ r: 2, strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="team2"
                                    name={team2 || "Innings 2"}
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={{ r: 2, strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WinProbability;