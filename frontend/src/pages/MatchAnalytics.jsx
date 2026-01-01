import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import WinProbability from '../components/WinProbability';

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
        const interval = setInterval(fetchMatchAnalytics, 5000); // Poll every 5 seconds for live updates
        return () => clearInterval(interval);
    }, [fixtureId]);

    if (loading) return <Layout><div className="flex justify-center p-12">Loading Match Analytics...</div></Layout>;
    if (!matchData) return <Layout><div className="flex justify-center p-12">Match data not found.</div></Layout>;

    // ... existing logic ...

    // Prepare Worm Graph Data (Cumulative Runs)
    // Assuming backend gives us ball-by-ball or over-by-over. 
    // Constructing mock-ish logic based on typical scorecard structure if "balls" are available.

    const processWormData = () => {
        const balls = matchData.balls || [];
        if (balls.length === 0) return [];

        const innings1 = balls.filter(b => Number(b.innings) === 1);
        const innings2 = balls.filter(b => Number(b.innings) === 2);

        const getMaxOver = (inn) => {
            if (inn.length === 0) return 0;
            return Math.max(...inn.map(b => Number(b.over_number || 0)));
        };

        const maxOver1 = getMaxOver(innings1);
        const maxOver2 = getMaxOver(innings2);
        const maxOverIndex = Math.max(maxOver1, maxOver2);

        let data = [];
        let t1Sum = 0;
        let t2Sum = 0;

        // Ensure we plot at least up to the max over played, or 20 if less
        const totalOvers = Math.max(20, maxOverIndex + 1);

        for (let i = 1; i <= totalOvers; i++) {
            const overIndex = i - 1;

            // Get runs in this over
            const t1OverRuns = innings1
                .filter(b => Number(b.over_number) === overIndex)
                .reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            const t2OverRuns = innings2
                .filter(b => Number(b.over_number) === overIndex)
                .reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            t1Sum += t1OverRuns;
            t2Sum += t2OverRuns;

            // Determine if we should plot a point for this over
            // Plot if:
            // 1. Data exists for this over
            // 2. OR if it's an earlier over (fill the gap for worm graph)
            // 3. BUT stop plotting if we exceeded the team's played overs (unless match is live and they are waiting? No, standard worm stops)

            const t1Played = overIndex <= maxOver1;
            const t2Played = overIndex <= maxOver2;

            // Fix: If innings 2 hasn't started, maxOver2 is 0. But we don't want to plot 0,0,0,0.
            // We check if innings2 actually has balls.
            const t2Started = innings2.length > 0;

            let point = { over: i };
            point.team1 = t1Played ? t1Sum : null;
            point.team2 = (t2Started && t2Played) ? t2Sum : null;

            data.push(point);
        }
        return data;
    };

    const t1Name = matchData.fixture.Team1?.short_name || 'Team 1';
    const t2Name = matchData.fixture.Team2?.short_name || 'Team 2';
    const wormData = processWormData();

    const processRunRateData = () => {
        const balls = matchData.balls || [];
        if (balls.length === 0) return [];

        const innings1 = balls.filter(b => Number(b.innings) === 1);
        const innings2 = balls.filter(b => Number(b.innings) === 2);

        const getMaxOver = (inn) => {
            if (inn.length === 0) return 0;
            return Math.max(...inn.map(b => Number(b.over_number || 0)));
        };

        const maxOverIndex = Math.max(getMaxOver(innings1), getMaxOver(innings2));
        const totalOvers = Math.max(20, maxOverIndex + 1);

        let data = [];

        for (let i = 1; i <= totalOvers; i++) {
            const overIndex = i - 1;

            const t1OverRuns = innings1
                .filter(b => Number(b.over_number) === overIndex)
                .reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            const t2OverRuns = innings2
                .filter(b => Number(b.over_number) === overIndex)
                .reduce((sum, b) => sum + (Number(b.runs_scored) || 0) + (Number(b.extras) || 0), 0);

            let point = { over: i };
            point.team1 = t1OverRuns;
            point.team2 = t2OverRuns;

            data.push(point);
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

            <WinProbability
                probability={matchData.winProbability}
                team1={matchData.fixture.Team1?.short_name || matchData.fixture.Team1?.name}
                team2={matchData.fixture.Team2?.short_name || matchData.fixture.Team2?.name}
            />

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
                            <Line type="monotone" dataKey="team1" name={t1Name} stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="team2" name={t2Name} stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
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
                            <Bar dataKey="team1" name={t1Name} fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="team2" name={t2Name} fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </Layout>
    );
};

export default MatchAnalytics;
