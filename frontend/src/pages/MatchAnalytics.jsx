import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const MatchAnalytics = () => {
    const { fixtureId } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatchAnalytics = async () => {
            try {
                // Ideally this endpoint returns runs per over for both teams
                const res = await api.get(`/score/match/${fixtureId}`);
                setMatchData(res.data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchMatchAnalytics();
    }, [fixtureId]);

    if (loading) return <Layout><div className="flex justify-center p-12">Loading Match Analytics...</div></Layout>;
    if (!matchData) return <Layout><div className="flex justify-center p-12">Match data not found.</div></Layout>;

    // Prepare Worm Graph Data (Cumulative Runs)
    // Assuming backend gives us ball-by-ball or over-by-over. 
    // Constructing mock-ish logic based on typical scorecard structure if "balls" are available.

    const processWormData = () => {
        // We need an array of { over: 1, team1Runs: 5, team2Runs: 6 }
        const balls = matchData.balls || [];
        const innings1 = balls.filter(b => b.innings === 1);
        const innings2 = balls.filter(b => b.innings === 2);

        // Need to aggregate balls to overs.
        // This relies on matchData structure. 
        // If getting raw balls:
        const maxOverIndex = Math.max(
            innings1[innings1.length - 1]?.over_number || 0,
            innings2[innings2.length - 1]?.over_number || 0
        );

        let data = [];
        let t1Sum = 0;
        let t2Sum = 0;

        // Loop from Over 1 to (Max+1) (e.g., if max index is 0, we want Over 1. If 19, Over 20).
        // Default to at least 20 overs for the X-axis scale
        const totalOvers = Math.max(20, maxOverIndex + 1);

        for (let i = 1; i <= totalOvers; i++) {
            const overIndex = i - 1;

            // Get runs in this over
            const t1OverRuns = innings1.filter(b => b.over_number === overIndex).reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);
            const t2OverRuns = innings2.filter(b => b.over_number === overIndex).reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            t1Sum += t1OverRuns;
            t2Sum += t2OverRuns;

            // Only push if over has happened (checking if balls exist or sum > 0)
            const t1HasData = innings1.some(b => b.over_number === overIndex);
            const t2HasData = innings2.some(b => b.over_number === overIndex);

            // We want to show the line up to the current point, but not flatline at the end if the match isn't there yet.
            // But for the FIRST team, if they finished 20 overs, t1HasData will be false for over 21 etc.
            // If match is live, we might want null for future overs.

            data.push({
                over: i,
                [matchData.fixture.Team1?.short_name || 'Team 1']: t1HasData || overIndex <= maxOverIndex ? t1Sum : null,
                [matchData.fixture.Team2?.short_name || 'Team 2']: t2HasData ? t2Sum : null
            });
        }
        return data;
    };

    const wormData = processWormData();
    const t1Name = matchData.fixture.Team1?.short_name || 'Team 1';
    const t2Name = matchData.fixture.Team2?.short_name || 'Team 2';

    const processRunRateData = () => {
        const balls = matchData.balls || [];
        const innings1 = balls.filter(b => b.innings === 1);
        const innings2 = balls.filter(b => b.innings === 2);

        const maxOverIndex = Math.max(
            innings1[innings1.length - 1]?.over_number || 0,
            innings2[innings2.length - 1]?.over_number || 0
        );

        const totalOvers = Math.max(20, maxOverIndex + 1);
        let data = [];

        for (let i = 1; i <= totalOvers; i++) {
            const overIndex = i - 1;
            const t1OverRuns = innings1.filter(b => b.over_number === overIndex).reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);
            const t2OverRuns = innings2.filter(b => b.over_number === overIndex).reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            // Only show if data exists for that over or if it's past
            // If team 2 hasn't batted yet, show 0 or null? Bar chart with 0 is fine.

            data.push({
                over: i,
                [matchData.fixture.Team1?.short_name || 'Team 1']: t1OverRuns,
                [matchData.fixture.Team2?.short_name || 'Team 2']: t2OverRuns
            });
        }
        return data;
    };

    const barData = processRunRateData();

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-deep-blue dark:text-white uppercase">{matchData.fixture.Team1.name} vs {matchData.fixture.Team2.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-wider text-sm mt-1">MATCH ANALYTICS CENTER</p>
            </div>

            {/* Worm Graph */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 mb-8">
                <h3 className="font-bold text-gray-700 dark:text-white mb-6 uppercase tracking-wide">Runs Progression (Worm Graph)</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={wormData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                            <XAxis dataKey="over" stroke="#9ca3af" label={{ value: 'Overs', position: 'insideBottomRight', offset: -5 }} />
                            <YAxis stroke="#9ca3af" label={{ value: 'Runs', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey={t1Name} stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey={t2Name} stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Runs Per Over (Bar) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="font-bold text-gray-700 dark:text-white mb-6 uppercase tracking-wide">Runs Per Over</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                            <XAxis dataKey="over" stroke="#9ca3af" label={{ value: 'Overs', position: 'insideBottomRight', offset: -5 }} />
                            <YAxis stroke="#9ca3af" label={{ value: 'Runs', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Legend />
                            <Bar dataKey={t1Name} fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={t2Name} fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </Layout>
    );
};

export default MatchAnalytics;
