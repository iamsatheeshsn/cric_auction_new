import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiMonitor, FiLayout, FiType, FiPlay, FiStopCircle, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/Layout';
import api from '../api/axios';

const socket = io('http://localhost:5000', {
    autoConnect: false // Connect manually in useEffect
});

const BroadcastControl = () => {
    const { fixtureId } = useParams();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [matchData, setMatchData] = useState(null);
    const [error, setError] = useState(null);

    // Control States
    const [activeOverlay, setActiveOverlay] = useState('none');
    const [lowerThirdText, setLowerThirdText] = useState({ title: '', subtitle: '' });

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        fetchData();

        return () => {
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [fixtureId]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/score/match/${fixtureId}`);
            setMatchData(res.data);
        } catch (err) {
            console.error("Failed to load match data", err);
            setError("Failed to load fixture data. Check console.");
        }
    };

    const updateOverlay = (type, data = {}) => {
        setActiveOverlay(type);
        socket.emit('updateOverlay', {
            type,
            fixtureId,
            data: { ...data, matchData } // Send current match data snapshot or let overlay fetch it? 
            // Better to send lightweight signal and let overlay fetch or pass crucial data.
            // For now passing manual text here.
        });
    };

    const triggerWipe = () => {
        socket.emit('triggerWipe', { fixtureId });
    };

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Broadcast Control</h1>

                        <p className="text-slate-500">Remote specific fixture: {matchData?.fixture?.id || fixtureId}</p>
                        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scorebug Controls */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiLayout /> Scorebug</h2>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => updateOverlay('scorestrip')}
                                className={`p-4 rounded-lg font-bold border-2 transition-all ${activeOverlay === 'scorestrip' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}
                            >
                                Show Score Strip
                            </button>
                            <button
                                onClick={() => updateOverlay('summary')}
                                className={`p-4 rounded-lg font-bold border-2 transition-all ${activeOverlay === 'summary' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}
                            >
                                Show Full Scorecard
                            </button>
                            <button
                                onClick={() => updateOverlay('none')}
                                className="p-4 rounded-lg font-bold border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 mt-2"
                            >
                                <FiStopCircle className="inline mr-2" /> Hide All Graphics
                            </button>
                        </div>
                    </div>

                    {/* Lower Third Controls */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiType /> Lower Third</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Top Line (Title)</label>
                                <input
                                    className="input-field"
                                    value={lowerThirdText.title}
                                    onChange={e => setLowerThirdText({ ...lowerThirdText, title: e.target.value })}
                                    placeholder="e.g. BATSMAN"
                                />
                            </div>
                            <div>
                                <label className="label">Bottom Line (Name/Stat)</label>
                                <input
                                    className="input-field"
                                    value={lowerThirdText.subtitle}
                                    onChange={e => setLowerThirdText({ ...lowerThirdText, subtitle: e.target.value })}
                                    placeholder="e.g. Virat Kohli (50*)"
                                />
                            </div>
                            <button
                                onClick={() => updateOverlay('lowerthird', lowerThirdText)}
                                className={`w-full p-3 rounded-lg font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all ${activeOverlay === 'lowerthird' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                            >
                                Push Lower Third
                            </button>
                        </div>
                    </div>
                </div>

                {/* Automation & Effects */}
                <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiPlay /> Effects & Automation</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={triggerWipe}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-500/30 transition-all"
                        >
                            Trigger Replay Wipe
                        </button>

                        <button
                            onClick={() => updateOverlay('versus')}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold"
                        >
                            Show Versus Screen
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BroadcastControl;
