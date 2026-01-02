import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiTarget, FiUsers, FiCheckCircle, FiPlus, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

const FanZone = () => {
    const [activeTab, setActiveTab] = useState('predictor'); // predictor, fantasy
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState('');
    const [loading, setLoading] = useState(true);

    // Predictor State
    const [fixtures, setFixtures] = useState([]);
    const [myPredictions, setMyPredictions] = useState([]);

    // Fantasy State
    const [myFantasyTeam, setMyFantasyTeam] = useState(null);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [selectedSquad, setSelectedSquad] = useState([]);
    const [fantasyTeamName, setFantasyTeamName] = useState('');

    const [selectedFantasyFixture, setSelectedFantasyFixture] = useState(null);

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, fixtureId: null, teamId: null, teamName: '' });

    useEffect(() => {
        const fetchAuctions = async () => {
            // ... existing code
            try {
                const res = await api.get('/auctions');
                if (res.data.auctions.length > 0) {
                    setAuctions(res.data.auctions);
                    setSelectedAuction(res.data.auctions[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (!selectedAuction) return;
        fetchData();
    }, [selectedAuction, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch fixtures
            const fixRes = await api.get(`/fixtures/${selectedAuction}`);
            const scheduledFixtures = fixRes.data.filter(f => f.status === 'Scheduled');
            setFixtures(scheduledFixtures);

            if (activeTab === 'predictor') {
                const predRes = await api.get('/fan/predictions');
                setMyPredictions(predRes.data);
            } else {
                // Fantasy tab logic
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                toast.error("Session expired. Please login again.");
                // window.location.href = '/login'; 
                return;
            }
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleFantasyFixtureSelect = async (fixture) => {
        setSelectedFantasyFixture(fixture);
        setLoading(true);
        try {
            // 1. Check if I have a team for this fixture
            const teamRes = await api.get(`/fan/fantasy/my-team?auctionId=${selectedAuction}&fixtureId=${fixture.id}`);
            setMyFantasyTeam(teamRes.data.team);

            // 2. Fetch Players (if team doesn't exist yet, we need them for selection)
            if (!teamRes.data.team) {
                const playerRes = await api.get(`/players/auction/${selectedAuction}?limit=1000`);
                setAvailablePlayers(playerRes.data.players || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load match details");
        } finally {
            setLoading(false);
        }
    };

    const handlePredictionClick = (fixtureId, teamId, teamName) => {
        setConfirmModal({
            isOpen: true,
            fixtureId,
            teamId,
            teamName
        });
    };

    const confirmPrediction = async () => {
        const { fixtureId, teamId } = confirmModal;
        try {
            await api.post('/fan/prediction', {
                fixtureId,
                predictedWinnerId: teamId
            });
            toast.success("Prediction Submitted!");
            setConfirmModal({ isOpen: false, fixtureId: null, teamId: null, teamName: '' });
            fetchData();
        } catch (err) {
            toast.error("Failed to submit prediction");
        }
    };

    const togglePlayerSelect = (player) => {
        const isSelected = selectedSquad.find(p => p.id === player.id);
        if (isSelected) {
            setSelectedSquad(selectedSquad.filter(p => p.id !== player.id));
        } else {
            if (selectedSquad.length >= 11) {
                toast.warning("You can only select 11 players");
                return;
            }
            setSelectedSquad([...selectedSquad, player]);
        }
    };

    const createFantasyTeam = async () => {
        if (selectedSquad.length === 0) {
            toast.error("Please select at least 1 player");
            return;
        }
        if (selectedSquad.length > 11) {
            toast.error("You cannot select more than 11 players");
            return;
        }
        if (!fantasyTeamName) {
            toast.error("Please enter a team name");
            return;
        }

        try {
            await api.post('/fan/fantasy/create', {
                auctionId: selectedAuction,
                fixtureId: selectedFantasyFixture.id,
                teamName: fantasyTeamName,
                playerIds: selectedSquad.map(p => p.id)
            });
            toast.success("Fantasy Team Created!");

            // Refresh current view
            const teamRes = await api.get(`/fan/fantasy/my-team?auctionId=${selectedAuction}&fixtureId=${selectedFantasyFixture.id}`);
            setMyFantasyTeam(teamRes.data.team);

        } catch (err) {
            toast.error(err.response?.data?.message || "Creation failed");
        }
    };

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/60?text=Logo';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
    };

    const tabClass = (tab) => `
        px-6 py-2 rounded-full font-bold transition-all
        ${activeTab === tab ? 'bg-deep-blue text-white shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
    `;

    return (
        <Layout>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmPrediction}
                title="Confirm Prediction"
                message={`Are you sure you want to predict ${confirmModal.teamName} as the winner?`}
                confirmText="Submit Prediction"
                confirmButtonClass="bg-deep-blue hover:bg-blue-800"
            />

            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                {/* ... header ... */}
                <div>
                    <h1 className="text-4xl font-black text-gray-800">Fan Zone</h1>
                    <p className="text-gray-500">Predict matches & build your dream team</p>
                </div>

                <select
                    className="p-3 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-deep-blue"
                    value={selectedAuction}
                    onChange={(e) => setSelectedAuction(e.target.value)}
                >
                    {auctions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>

            <div className="flex gap-4 mb-8">
                <button onClick={() => setActiveTab('predictor')} className={tabClass('predictor')}>
                    <FiTarget className="inline mr-2" /> Match Predictor
                </button>
                <button onClick={() => setActiveTab('fantasy')} className={tabClass('fantasy')}>
                    <FiUsers className="inline mr-2" /> Fantasy XI
                </button>
            </div>

            <AnimatePresence mode='wait'>
                {activeTab === 'predictor' ? (
                    <motion.div
                        key="predictor"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {fixtures.length === 0 ? (
                            <p className="text-gray-500 col-span-2 text-center py-10">No scheduled matches available.</p>
                        ) : fixtures.map(fixture => {
                            const myPred = myPredictions.find(p => p.fixture_id === fixture.id);
                            return (
                                <div key={fixture.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="text-center mb-4">
                                        <div className="flex justify-center items-center gap-2 mb-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase">{fixture.name}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {fixture.match_date ? new Date(fixture.match_date).toLocaleDateString() : 'Date TBD'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4 mb-4">
                                        {/* Team 1 */}
                                        <button
                                            onClick={() => handlePredictionClick(fixture.id, fixture.team1_id, fixture.Team1?.name)}
                                            className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-all ${myPred?.predicted_winner_id === fixture.team1_id ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}
                                        >
                                            <img
                                                src={getImageUrl(fixture.Team1?.image_path)}
                                                alt={fixture.Team1?.short_name || 'Team 1'}
                                                className="w-12 h-12 object-contain mb-2"
                                            />
                                            <p className="font-bold text-gray-800">{fixture.Team1?.short_name || 'Team 1'}</p>
                                            {myPred?.predicted_winner_id === fixture.team1_id && <FiCheckCircle className="text-green-600 mt-2" />}
                                        </button>

                                        <span className="font-black text-gray-300 mx-4">VS</span>

                                        {/* Team 2 */}
                                        <button
                                            onClick={() => handlePredictionClick(fixture.id, fixture.team2_id, fixture.Team2?.name)}
                                            className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-all ${myPred?.predicted_winner_id === fixture.team2_id ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}
                                        >
                                            <img
                                                src={getImageUrl(fixture.Team2?.image_path)}
                                                alt={fixture.Team1?.short_name || 'Team 2'}
                                                className="w-12 h-12 object-contain mb-2"
                                            />
                                            <p className="font-bold text-gray-800">{fixture.Team2?.short_name || 'Team 2'}</p>
                                            {myPred?.predicted_winner_id === fixture.team2_id && <FiCheckCircle className="text-green-600 mt-2" />}
                                        </button>
                                    </div>
                                    {myPred && <p className="text-center text-xs text-green-600 font-bold">Prediction Saved</p>}
                                </div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="fantasy"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Match Selector for Fantasy */}
                        {!selectedFantasyFixture ? (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Select a Match to Create Team</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {fixtures.map(fixture => (
                                        <div
                                            key={fixture.id}
                                            onClick={() => handleFantasyFixtureSelect(fixture)}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-deep-blue cursor-pointer transition-all"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <img src={getImageUrl(fixture.Team1?.image_path)} className="w-10 h-10 object-contain" />
                                                    <span className="font-bold">{fixture.Team1?.short_name}</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm font-bold text-gray-400">VS</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold">{fixture.Team2?.short_name}</span>
                                                    <img src={getImageUrl(fixture.Team2?.image_path)} className="w-10 h-10 object-contain" />
                                                </div>
                                            </div>
                                            <p className="text-center text-xs text-gray-500 mt-3">
                                                {fixture.match_date ? new Date(fixture.match_date).toLocaleDateString() : 'Date TBD'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={() => { setSelectedFantasyFixture(null); setMyFantasyTeam(null); setSelectedSquad([]); }}
                                    className="mb-4 text-sm text-gray-500 hover:text-deep-blue flex items-center gap-1"
                                >
                                    &larr; Back to Matches
                                </button>

                                {myFantasyTeam ? (
                                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                                        <h2 className="text-2xl font-black text-gray-800 mb-2">{myFantasyTeam.team_name}</h2>
                                        <p className="text-gray-500 mb-8">Points: <span className="text-green-600 font-bold text-xl">{myFantasyTeam.total_points}</span></p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {myFantasyTeam.FantasyPlayers?.map(fp => (
                                                <div key={fp.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                                                    <img src={getImageUrl(fp.Player.image_path || fp.Player.image)} className="w-12 h-12 rounded-full object-cover" />
                                                    <div className="text-left">
                                                        <p className="font-bold">{fp.Player.name}</p>
                                                        <p className="text-xs text-gray-500">{fp.Player.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Player Selection */}
                                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 max-h-[80vh] overflow-y-auto">
                                            <h3 className="font-bold text-lg mb-4">
                                                Pick Players from {selectedFantasyFixture.Team1?.short_name} vs {selectedFantasyFixture.Team2?.short_name}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {availablePlayers
                                                    .filter(p => p.team_id === selectedFantasyFixture.team1_id || p.team_id === selectedFantasyFixture.team2_id)
                                                    .map(player => {
                                                        const isSelected = selectedSquad.find(p => p.id === player.id);
                                                        return (
                                                            <div
                                                                key={player.id}
                                                                onClick={() => togglePlayerSelect(player)}
                                                                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-blue-200'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <img src={getImageUrl(player.image_path || player.image)} className="w-10 h-10 rounded-full object-cover" />
                                                                    <div>
                                                                        <p className="font-bold text-sm">{player.name}</p>
                                                                        <p className="text-xs text-gray-500">{player.role} ({player.Team?.short_name})</p>
                                                                    </div>
                                                                </div>
                                                                {isSelected ? <FiCheckCircle className="text-green-500" /> : <FiPlus className="text-gray-400" />}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>

                                        {/* My Squad Preview */}
                                        <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-4">
                                            <h3 className="font-bold text-lg mb-4">Your Squad ({selectedSquad.length}/11)</h3>
                                            <input
                                                type="text"
                                                placeholder="Enter Team Name"
                                                className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-deep-blue outline-none"
                                                value={fantasyTeamName}
                                                onChange={(e) => setFantasyTeamName(e.target.value)}
                                            />

                                            <div className="space-y-2 mb-6">
                                                {selectedSquad.length === 0 && <p className="text-gray-400 text-sm text-center italic">No players selected</p>}
                                                {selectedSquad.map(p => (
                                                    <div key={p.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50">
                                                        <img src={getImageUrl(p.image_path || p.image)} className="w-8 h-8 rounded-full object-cover" />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between">
                                                                <span className="font-bold">{p.name}</span>
                                                                <span className="text-[10px] font-bold bg-gray-100 px-1 rounded text-gray-500">{p.Team?.short_name}</span>
                                                            </div>
                                                            <span className="text-gray-400 text-xs">{p.role}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => togglePlayerSelect(p)}
                                                            className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={createFantasyTeam}
                                                disabled={selectedSquad.length === 0}
                                                className="w-full bg-deep-blue text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900 transition-colors"
                                            >
                                                Create Team
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div >
                )}
            </AnimatePresence >
        </Layout >
    );
};

export default FanZone;
