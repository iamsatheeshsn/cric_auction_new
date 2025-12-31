import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:5000');

const BroadcastOverlay = () => {
    const { fixtureId } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [activeOverlay, setActiveOverlay] = useState('scorestrip'); // Default start
    const [overlayData, setOverlayData] = useState({ title: '', subtitle: '' });
    const [showWipe, setShowWipe] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);

        socket.on('overlayUpdate', (payload) => {
            console.log("Received Overlay Update:", payload);
            setActiveOverlay(payload.type);
            if (payload.data) setOverlayData(payload.data);
        });

        socket.on('wipeTrigger', () => {
            setShowWipe(true);
            setTimeout(() => setShowWipe(false), 1500); // Reset after animation
        });

        return () => {
            clearInterval(interval);
            socket.off('overlayUpdate');
            socket.off('wipeTrigger');
        };
    }, [fixtureId]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/score/match/${fixtureId}`);
            setMatchData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!matchData?.fixture) return <div className="text-white text-xl">Waiting for Data...</div>;

    const { fixture, summary, balls } = matchData;
    const isTeam1Batting = fixture.current_innings === 1 ? (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id === fixture.team1_id : fixture.toss_winner_id !== fixture.team1_id) : (fixture.toss_decision === 'Bat' ? fixture.toss_winner_id !== fixture.team1_id : fixture.toss_winner_id === fixture.team1_id);
    const battingTeam = isTeam1Batting ? fixture.Team1 : fixture.Team2;
    const score = fixture.current_innings === 1 ? summary?.score1 : summary?.score2;
    const target = fixture.current_innings === 2 ? (summary?.score1?.runs + 1) : null;

    // --- Components ---

    const ScoreStrip = () => (
        <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="absolute bottom-10 left-10 right-10 h-24 bg-white rounded-full shadow-2xl flex items-center overflow-hidden border-4 border-slate-900"
        >
            <div className="w-64 bg-slate-900 h-full flex items-center px-6 gap-4 text-white">
                <img src={`http://localhost:5000/${battingTeam.image_path}`} className="w-12 h-12 rounded-full bg-white p-1" alt={battingTeam.short_name} />
                <div>
                    <h2 className="font-black text-xl uppercase tracking-wider">{battingTeam.short_name}</h2>
                    <p className="text-sm font-bold text-slate-400">Batting</p>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-between px-8 bg-gradient-to-r from-slate-100 to-white h-full">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-800 tracking-tighter">{score?.runs || 0}/{score?.wickets || 0}</span>
                    <span className="text-2xl font-bold text-slate-500">({score?.overs || 0})</span>
                </div>
                <div className="text-right">
                    {target && <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Target: {target}</p>}
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">CRR: {(score?.runs * 6 / Math.max(1, score?.legalBalls || 1)).toFixed(2)}</span>
                </div>
            </div>
            <div className="w-48 bg-blue-700 h-full flex flex-col items-center justify-center text-white border-l-4 border-slate-900">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Last 6</p>
                <div className="flex gap-1 mt-1">
                    {(balls?.slice(-6).map((b, i) => (
                        <span key={i} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${b.is_wicket ? 'bg-red-500' : b.runs_scored >= 4 ? 'bg-green-500' : 'bg-slate-700'}`}>
                            {b.is_wicket ? 'W' : b.runs_scored + b.extras}
                        </span>
                    )))}
                </div>
            </div>
        </motion.div>
    );

    const LowerThird = () => (
        <motion.div
            initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
            className="absolute bottom-40 left-10 flex items-center gap-0 shadow-2xl"
        >
            <div className="bg-yellow-500 h-24 w-2"></div>
            <div className="bg-slate-900 text-white h-24 px-8 flex flex-col justify-center min-w-[350px]">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">{overlayData.title || "UPDATE"}</h3>
                <h2 className="text-3xl font-black uppercase italic">{overlayData.subtitle || "Details Here"}</h2>
            </div>
        </motion.div>
    );

    const FullScreenScorecard = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-20 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-12 border-8 border-slate-900"
        >
            <h1 className="text-5xl font-black text-slate-800 mb-12 uppercase tracking-widest border-b-8 border-yellow-500 pb-4">Match Summary</h1>
            <div className="flex justify-around w-full gap-12 items-center flex-1">
                <div className="text-center">
                    <img src={`http://localhost:5000/${fixture.Team1.image_path}`} className="w-40 h-40 mx-auto mb-4 object-contain" />
                    <h2 className="text-4xl font-black text-slate-900">{fixture.Team1.name}</h2>
                    <p className="text-7xl font-black text-slate-800 mt-4">{summary?.score1?.runs}/{summary?.score1?.wickets}</p>
                </div>
                <div className="text-4xl font-black text-slate-300">VS</div>
                <div className="text-center">
                    <img src={`http://localhost:5000/${fixture.Team2.image_path}`} className="w-40 h-40 mx-auto mb-4 object-contain" />
                    <h2 className="text-4xl font-black text-slate-900">{fixture.Team2.name}</h2>
                    <p className="text-7xl font-black text-slate-800 mt-4">{summary?.score2?.runs || 0}/{summary?.score2?.wickets || 0}</p>
                </div>
            </div>
        </motion.div>
    );

    const ReplayWipe = () => (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: '-100%' }} transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-50 pointer-events-none flex"
        >
            <div className="w-screen h-full bg-yellow-500 skew-x-12 transform scale-150"></div>
            <div className="w-screen h-full bg-slate-900 skew-x-12 transform scale-150 -ml-40 flex items-center justify-center">
                <h1 className="text-9xl font-black text-white italic -skew-x-12">REPLAY</h1>
            </div>
        </motion.div>
    );

    return (
        <div className="w-screen h-screen overflow-hidden bg-transparent">
            {/* Component Layer */}
            <AnimatePresence mode='wait'>
                {activeOverlay === 'scorestrip' && <ScoreStrip key="score" />}
                {activeOverlay === 'lowerthird' && <LowerThird key="lower" />}
                {activeOverlay === 'summary' && <FullScreenScorecard key="summary" />}
            </AnimatePresence>

            {/* Application Layer (Wipes, Alerts) */}
            <AnimatePresence>
                {showWipe && <ReplayWipe />}
            </AnimatePresence>
        </div>
    );
};

export default BroadcastOverlay;
