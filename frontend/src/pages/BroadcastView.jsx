import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMonitor, FiSettings, FiActivity, FiMaximize, FiMinimize, FiCpu, FiCast } from 'react-icons/fi';

const BroadcastView = () => {
    const { fixtureId } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Broadcast State
    const [activeOverlay, setActiveOverlay] = useState('scorestrip'); // scorestrip, versus, summary, lowerthird
    const [chromaKey, setChromaKey] = useState('green'); // green, blue, magenta, transparent
    const [showControls, setShowControls] = useState(true);
    const [lowerThirdConfig, setLowerThirdConfig] = useState({ title: '', subtitle: '' });

    // Auto-Event Logic
    const [lastBallId, setLastBallId] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [fixtureId]);

    // Auto-Event Effect (Moved up to comply with Rules of Hooks)
    useEffect(() => {
        const balls = matchData?.balls;
        if (!balls || balls.length === 0) return;

        const latestBall = balls[balls.length - 1];

        // Only trigger if this is a new ball we haven't seen
        if (lastBallId && latestBall.id !== lastBallId) {
            // Need to define or access handleAutoEvents. 
            // Since handleAutoEvents needs fixture, we can define a limited scope logic here or 
            // ensure handleAutoEvents handles missing data safely.
            // Better yet, let's keep logic here or call a function that we define below but ensure this effect is top level.
            // Actually, handleAutoEvents is defined BELOW. We must move it UP or put logic inside.
            // Moving handleAutoEvents up requires fixture which might be null.
            // So we'll put the logic inside the effect and use optional chaining.

            const getPlayer = (id) => {
                if (!matchData?.fixture) return 'Player';
                const allPlayers = [...(matchData.fixture.Team1?.Players || []), ...(matchData.fixture.Team2?.Players || [])];
                const p = allPlayers.find(pl => pl.id === id);
                return p ? p.name : 'Player';
            };

            let eventTriggered = false;
            let title = '';
            let subtitle = '';

            if (latestBall.is_wicket) {
                eventTriggered = true;
                title = 'WICKET!';
                subtitle = `${getPlayer(latestBall.player_out_id || latestBall.striker_id)} OUT`;
            } else if (latestBall.runs_scored === 4) {
                eventTriggered = true;
                title = 'BOUNDARY!';
                subtitle = `${getPlayer(latestBall.striker_id)} (4 Runs)`;
            } else if (latestBall.runs_scored === 6) {
                eventTriggered = true;
                title = 'MAXIMUM!';
                subtitle = `${getPlayer(latestBall.striker_id)} (6 Runs)`;
            }

            if (eventTriggered) {
                setLowerThirdConfig({ title, subtitle });
                setActiveOverlay('lowerthird');
                setTimeout(() => setActiveOverlay('scorestrip'), 6000);
            }
        }

        setLastBallId(latestBall.id);
    }, [matchData]); // Run when matchData updates

    const fetchData = async () => {
        try {
            const res = await api.get(`/score/match/${fixtureId}`);
            setMatchData(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">Loading Stream Data...</div>;

    const { fixture, summary, balls } = matchData || {};
    if (!fixture) return null;

    // Helper Data
    const isTeam1Batting = fixture.current_innings === 1 ? (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id === fixture.team1_id : fixture.toss_winner_id !== fixture.team1_id) : (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id !== fixture.team1_id : fixture.toss_winner_id === fixture.team1_id);
    const battingTeam = isTeam1Batting ? fixture.Team1 : fixture.Team2;
    const bowlingTeam = isTeam1Batting ? fixture.Team2 : fixture.Team1;
    const score = fixture.current_innings === 1 ? summary?.score1 : summary?.score2;
    const target = fixture.current_innings === 2 ? (summary?.score1?.runs + 1) : null;


    // Background Color
    const bgColors = {
        green: '#00b140', // Standard Green Screen
        blue: '#0047bb',
        magenta: '#ff00ff',
        transparent: 'transparent',
        dark: '#0f172a' // For testing
    };

    // --- Components ---

    const ScoreStrip = () => (
        <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="absolute bottom-10 left-10 right-10 h-24 bg-white rounded-full shadow-2xl flex items-center overflow-hidden border-4 border-slate-900"
        >
            {/* Batting Team Logo & Name */}
            <div className="w-64 bg-slate-900 h-full flex items-center px-6 gap-4 text-white">
                <img src={`http://localhost:5000/${battingTeam.image_path}`} className="w-12 h-12 rounded-full bg-white p-1" />
                <div>
                    <h2 className="font-black text-xl uppercase tracking-wider">{battingTeam.short_name}</h2>
                    <p className="text-sm font-bold text-slate-400">Batting</p>
                </div>
            </div>

            {/* Score Display */}
            <div className="flex-1 flex items-center justify-between px-8 bg-gradient-to-r from-slate-100 to-white h-full">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-800 tracking-tighter">{score?.runs || 0}/{score?.wickets || 0}</span>
                    <span className="text-2xl font-bold text-slate-500">
                        ({score?.overs || 0})
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    {target && (
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Target: {target}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">CRR: {(score?.runs / Math.max(0.1, score?.overs || 0)).toFixed(2)}</span>
                        {target && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">RRR: {((target - score?.runs) / Math.max(0.1, (fixture.total_overs || 20) - (score?.overs || 0))).toFixed(2)}</span>}
                    </div>
                </div>
            </div>

            {/* Bowling Team / Status */}
            <div className="w-48 bg-deep-blue h-full flex flex-col items-center justify-center text-white border-l-4 border-slate-900">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Over</p>
                <div className="flex gap-1 mt-1">
                    {/* Last 6 balls logic would go here, simpler version: */}
                    {(balls?.slice(-6).map((b, i) => (
                        <span key={i} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${b.is_wicket ? 'bg-red-500' : b.runs_scored === 4 || b.runs_scored === 6 ? 'bg-green-500' : 'bg-slate-700'}`}>
                            {b.is_wicket ? 'W' : b.runs_scored + b.extras}
                        </span>
                    )))}
                </div>
            </div>
        </motion.div>
    );

    const LowerThird = () => (
        <motion.div
            initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="absolute bottom-40 left-10 flex items-center gap-0"
        >
            <div className="bg-yellow-500 h-20 w-2"></div>
            <div className="bg-slate-900 text-white h-20 px-8 flex flex-col justify-center min-w-[300px]">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">{lowerThirdConfig.title}</h3>
                <h2 className="text-3xl font-black uppercase italic">{lowerThirdConfig.subtitle}</h2>
            </div>
            <div className="bg-white h-20 px-6 flex items-center">
                <img src="/logo.png" className="h-12 opacity-50" />
            </div>
        </motion.div>
    );

    const FullScreenScorecard = () => (
        <div className="absolute inset-20 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-12 border-8 border-slate-900">
            <h1 className="text-4xl font-black text-slate-800 mb-8 uppercase tracking-widest border-b-4 border-yellow-500 pb-2">Match Summary</h1>
            <div className="flex justify-around w-full gap-12 items-center flex-1">
                {/* Team 1 */}
                <div className="text-center">
                    <img src={`http://localhost:5000/${fixture.Team1.image_path}`} className="w-32 h-32 mx-auto mb-4 object-contain" />
                    <h2 className="text-3xl font-black text-slate-900">{fixture.Team1.name}</h2>
                    <p className="text-6xl font-black text-slate-800 mt-4">{summary?.score1?.runs}/{summary?.score1?.wickets}</p>
                    <p className="text-xl font-bold text-slate-500">{summary?.score1?.overs} Overs</p>
                </div>

                <div className="h-48 w-px bg-slate-200"></div>

                {/* Team 2 */}
                <div className="text-center">
                    <img src={`http://localhost:5000/${fixture.Team2.image_path}`} className="w-32 h-32 mx-auto mb-4 object-contain" />
                    <h2 className="text-3xl font-black text-slate-900">{fixture.Team2.name}</h2>
                    {fixture.current_innings === 2 || fixture.status === 'Completed' ? (
                        <>
                            <p className="text-6xl font-black text-slate-800 mt-4">{summary?.score2?.runs}/{summary?.score2?.wickets}</p>
                            <p className="text-xl font-bold text-slate-500">{summary?.score2?.overs} Overs</p>
                        </>
                    ) : (
                        <p className="text-2xl font-bold text-slate-400 mt-8 italic">Yet to Bat</p>
                    )}
                </div>
            </div>
            {fixture.status === 'Completed' && (
                <div className="mt-8 bg-green-600 text-white px-8 py-3 rounded-full text-2xl font-black uppercase tracking-wide">
                    {fixture.result_description}
                </div>
            )}
        </div>
    );

    return (
        <div className="relative w-screen h-screen overflow-hidden font-sans" style={{ backgroundColor: bgColors[chromaKey] }}>

            {/* The Overlay Content */}
            <AnimatePresence mode='wait'>
                {activeOverlay === 'scorestrip' && <ScoreStrip key="strip" />}
                {activeOverlay === 'lowerthird' && <LowerThird key="lower" />}
                {activeOverlay === 'summary' && <FullScreenScorecard key="full" />}
            </AnimatePresence>

            {/* Controls - Visible only if needed, can be hidden for OBS if using a separate window or if mouse not hovering? 
                For MVP, we keep a toggle button at top right.
            */}
            {showControls && (
                <div className="absolute top-4 right-4 z-50 bg-slate-900/90 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-md w-80 border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2"><FiCast className="text-green-400" /> Broadcast Control</h3>
                        <button onClick={() => setShowControls(false)} className="text-slate-400 hover:text-white"><FiMinimize /></button>
                    </div>

                    <div className="space-y-6">
                        {/* Overlay Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Active Overlay</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setActiveOverlay('scorestrip')} className={`p-2 rounded-lg text-sm font-medium transition-colors ${activeOverlay === 'scorestrip' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Score Strip</button>
                                <button onClick={() => setActiveOverlay('lowerthird')} className={`p-2 rounded-lg text-sm font-medium transition-colors ${activeOverlay === 'lowerthird' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Lower Third</button>
                                <button onClick={() => setActiveOverlay('summary')} className={`p-2 rounded-lg text-sm font-medium transition-colors ${activeOverlay === 'summary' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>Scorecard</button>
                                <button onClick={() => setActiveOverlay('none')} className={`p-2 rounded-lg text-sm font-medium transition-colors ${activeOverlay === 'none' ? 'bg-red-500' : 'bg-slate-800 hover:bg-slate-700'}`}>Clear All</button>
                            </div>
                        </div>

                        {/* Lower Third Inputs */}
                        {activeOverlay === 'lowerthird' && (
                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Lower Third Text</label>
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-2 text-sm focus:border-blue-500 outline-none"
                                    value={lowerThirdConfig.title}
                                    onChange={e => setLowerThirdConfig({ ...lowerThirdConfig, title: e.target.value })}
                                    placeholder="Title (e.g. New Batsman)"
                                />
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                    value={lowerThirdConfig.subtitle}
                                    onChange={e => setLowerThirdConfig({ ...lowerThirdConfig, subtitle: e.target.value })}
                                    placeholder="Subtitle (e.g. Player Name)"
                                />
                            </div>
                        )}

                        {/* Chroma Key Selector */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Chroma Key Background</label>
                            <div className="flex gap-2">
                                <button onClick={() => setChromaKey('green')} className={`w-8 h-8 rounded-full bg-[#00b140] border-2 ${chromaKey === 'green' ? 'border-white' : 'border-transparent'}`} title="Green Screen"></button>
                                <button onClick={() => setChromaKey('blue')} className={`w-8 h-8 rounded-full bg-[#0047bb] border-2 ${chromaKey === 'blue' ? 'border-white' : 'border-transparent'}`} title="Blue Screen"></button>
                                <button onClick={() => setChromaKey('magenta')} className={`w-8 h-8 rounded-full bg-[#ff00ff] border-2 ${chromaKey === 'magenta' ? 'border-white' : 'border-transparent'}`} title="Magenta"></button>
                                <button onClick={() => setChromaKey('dark')} className={`w-8 h-8 rounded-full bg-slate-900 border-2 ${chromaKey === 'dark' ? 'border-white' : 'border-transparent'}`} title="Dark Mode (Test)"></button>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 italic mt-4">
                            * Use Browser Source in OBS with this URL. Hide this panel before going live.
                        </div>
                    </div>
                </div>
            )}

            {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="absolute top-4 right-4 bg-slate-900/50 p-2 rounded-full text-white/50 hover:bg-slate-900 hover:text-white transition-all z-50"
                >
                    <FiSettings />
                </button>
            )}
        </div>
    );
};

export default BroadcastView;
