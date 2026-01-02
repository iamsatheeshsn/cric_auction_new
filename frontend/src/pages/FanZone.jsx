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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

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
        setCurrentPage(1); // Reset page on auction change
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

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFixtures = fixtures.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(fixtures.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        relative px-8 py-3 rounded-full font-bold transition-all duration-300 z-10
        ${activeTab === tab ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}
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
                confirmButtonClass="bg-gradient-to-r from-deep-blue to-blue-600 hover:from-blue-800 hover:to-blue-900"
            />

            {/* Hero Section */}
            <div className="mb-10 bg-gradient-to-br from-slate-900 via-deep-blue to-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-5xl font-black mb-2 tracking-tight">Fan Zone</h1>
                        <p className="text-blue-200 text-lg font-medium opacity-90">Predict Matches & Build Your Fantasy XI</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <select
                            className="bg-transparent text-white p-3 outline-none font-bold min-w-[200px] [&>option]:text-black"
                            value={selectedAuction}
                            onChange={(e) => setSelectedAuction(e.target.value)}
                        >
                            {auctions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-10">
                <div className="bg-slate-100 p-1.5 rounded-full flex gap-2 relative shadow-inner">
                    <motion.div
                        className="absolute inset-y-1.5 bg-deep-blue rounded-full shadow-md"
                        layoutId="activeTab"
                        initial={false}
                        animate={{
                            left: activeTab === 'predictor' ? '6px' : '50%',
                            width: activeTab === 'predictor' ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
                            x: activeTab === 'predictor' ? 0 : 0
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button onClick={() => setActiveTab('predictor')} className={`${tabClass('predictor')} w-60 whitespace-nowrap`}>
                        <span className="flex items-center justify-center gap-2"><FiTarget /> Match Predictor</span>
                    </button>
                    <button onClick={() => setActiveTab('fantasy')} className={`${tabClass('fantasy')} w-60 whitespace-nowrap`}>
                        <span className="flex items-center justify-center gap-2"><FiUsers /> Fantasy XI</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode='wait'>
                {activeTab === 'predictor' ? (
                    <motion.div
                        key="predictor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {fixtures.length === 0 ? (
                                <div className="col-span-2 text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                                    <FiTarget className="mx-auto text-6xl text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold text-lg">No scheduled matches available.</p>
                                </div>
                            ) : currentFixtures.map((fixture, index) => {
                                const myPred = myPredictions.find(p => p.fixture_id === fixture.id);
                                return (
                                    <motion.div
                                        key={fixture.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                                    >
                                        {/* Card Header */}
                                        <div className="bg-slate-50 p-4 text-center border-b border-slate-100">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{fixture.name}</h3>
                                            <div className="inline-block bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                                <p className="text-xs font-bold text-slate-600">
                                                    {fixture.match_date ? new Date(fixture.match_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Teams Interaction */}
                                        <div className="p-8 pb-4">
                                            <div className="flex justify-between items-center relative">
                                                {/* Team 1 */}
                                                <button
                                                    onClick={() => handlePredictionClick(fixture.id, fixture.team1_id, fixture.Team1?.name)}
                                                    className={`flex-1 flex flex-col items-center p-4 rounded-2xl transition-all duration-300 relative overflow-hidden
                                                        ${myPred?.predicted_winner_id === fixture.team1_id
                                                            ? 'bg-green-50 ring-2 ring-green-500 scale-105 shadow-md'
                                                            : 'hover:bg-slate-50 hover:scale-105'}`}
                                                >
                                                    <div className="w-20 h-20 mb-3 relative drop-shadow-md">
                                                        <img
                                                            src={getImageUrl(fixture.Team1?.image_path)}
                                                            alt={fixture.Team1?.short_name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <p className="font-bold text-slate-800 text-lg">{fixture.Team1?.short_name || 'Team 1'}</p>
                                                    {myPred?.predicted_winner_id === fixture.team1_id &&
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                            <FiCheckCircle size={12} />
                                                        </motion.div>
                                                    }
                                                </button>

                                                <div className="mx-4 flex flex-col items-center">
                                                    <span className="text-2xl font-black text-slate-200">VS</span>
                                                </div>

                                                {/* Team 2 */}
                                                <button
                                                    onClick={() => handlePredictionClick(fixture.id, fixture.team2_id, fixture.Team2?.name)}
                                                    className={`flex-1 flex flex-col items-center p-4 rounded-2xl transition-all duration-300 relative overflow-hidden
                                                        ${myPred?.predicted_winner_id === fixture.team2_id
                                                            ? 'bg-green-50 ring-2 ring-green-500 scale-105 shadow-md'
                                                            : 'hover:bg-slate-50 hover:scale-105'}`}
                                                >
                                                    <div className="w-20 h-20 mb-3 relative drop-shadow-md">
                                                        <img
                                                            src={getImageUrl(fixture.Team2?.image_path)}
                                                            alt={fixture.Team2?.short_name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <p className="font-bold text-slate-800 text-lg">{fixture.Team2?.short_name || 'Team 2'}</p>
                                                    {myPred?.predicted_winner_id === fixture.team2_id &&
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                            <FiCheckCircle size={12} />
                                                        </motion.div>
                                                    }
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="bg-white p-4 text-center border-t border-slate-50">
                                            {myPred ? (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">Prediction Saved</span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-deep-blue transition-colors">Click team to predict</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {fixtures.length > itemsPerPage && (
                            <div className="flex justify-center gap-2 mb-8">
                                <button
                                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    &larr; Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => paginate(i + 1)}
                                        className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-deep-blue text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="fantasy"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {!selectedFantasyFixture ? (
                            <div>
                                <h3 className="text-2xl font-black mb-6 text-slate-800 pl-2 border-l-4 border-deep-blue">Select a Match</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {currentFixtures.map((fixture, index) => (
                                        <motion.div
                                            key={fixture.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => handleFantasyFixtureSelect(fixture)}
                                            className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 group"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{new Date(fixture.match_date).toLocaleDateString()}</span>
                                                <span className="text-xs font-bold text-deep-blue opacity-0 group-hover:opacity-100 transition-opacity">Create Team &rarr;</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <img src={getImageUrl(fixture.Team1?.image_path)} className="w-16 h-16 object-contain drop-shadow-sm" />
                                                    <span className="font-extrabold text-slate-700">{fixture.Team1?.short_name}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-200 bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full">VS</span>
                                                <div className="flex flex-col items-center gap-2">
                                                    <img src={getImageUrl(fixture.Team2?.image_path)} className="w-16 h-16 object-contain drop-shadow-sm" />
                                                    <span className="font-extrabold text-slate-700">{fixture.Team2?.short_name}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {fixtures.length > itemsPerPage && (
                                    <div className="flex justify-center gap-2 mb-8">
                                        <button
                                            onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                        >
                                            &larr; Prev
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => paginate(i + 1)}
                                                className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? 'bg-deep-blue text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                                        >
                                            Next &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={() => { setSelectedFantasyFixture(null); setMyFantasyTeam(null); setSelectedSquad([]); }}
                                    className="mb-6 text-sm font-bold text-slate-500 hover:text-deep-blue flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
                                >
                                    &larr; Back to Matches
                                </button>

                                {myFantasyTeam ? (
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-slate-100">
                                        <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
                                            <FiUsers className="text-4xl text-deep-blue" />
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-800 mb-2">{myFantasyTeam.team_name}</h2>
                                        <p className="text-slate-500 mb-10 text-lg">Total Points: <span className="text-green-600 font-black text-2xl">{myFantasyTeam.total_points}</span></p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                                            {myFantasyTeam.FantasyPlayers?.map(fp => (
                                                <div key={fp.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                                                    <img src={getImageUrl(fp.Player.image_path || fp.Player.image)} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                                    <div>
                                                        <p className="font-bold text-slate-800">{fp.Player.name}</p>
                                                        <span className="text-[10px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full">{fp.Player.role}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-200px)]">
                                        {/* Player Selection - Left Side */}
                                        <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col h-full overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm z-10 sticky top-0">
                                                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                                    <span className="text-deep-blue">Select Players</span>
                                                    <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded-full border">{selectedFantasyFixture.Team1?.short_name} vs {selectedFantasyFixture.Team2?.short_name}</span>
                                                </h3>
                                            </div>

                                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {availablePlayers
                                                        .filter(p => p.team_id === selectedFantasyFixture.team1_id || p.team_id === selectedFantasyFixture.team2_id)
                                                        .map(player => {
                                                            const isSelected = selectedSquad.find(p => p.id === player.id);
                                                            return (
                                                                <div
                                                                    key={player.id}
                                                                    onClick={() => togglePlayerSelect(player)}
                                                                    className={`cursor-pointer p-3 rounded-2xl border flex items-center justify-between transition-all duration-200 group
                                                                    ${isSelected
                                                                            ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500'
                                                                            : 'border-slate-100 hover:border-blue-300 hover:shadow-md hover:bg-slate-50'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            <img src={getImageUrl(player.image_path || player.image)} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                                                            <span className={`absolute -bottom-1 -right-1 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm
                                                                            ${player.team_id === selectedFantasyFixture.team1_id ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                                            >
                                                                                {player.Team?.short_name}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <p className={`font-bold text-sm ${isSelected ? 'text-green-800' : 'text-slate-700'}`}>{player.name}</p>
                                                                            <p className="text-xs text-slate-400">{player.role}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                                                    ${isSelected ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                                                        {isSelected ? <FiCheckCircle size={16} /> : <FiPlus size={18} />}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* My Squad Preview - Right Side */}
                                        <div className="lg:col-span-4 bg-deep-blue text-white rounded-[2rem] shadow-2xl p-6 h-full flex flex-col relative overflow-hidden">
                                            {/* Decorative Background */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

                                            <div className="flex justify-between items-end mb-6 relative z-10">
                                                <div>
                                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Your Squad</p>
                                                    <h3 className="font-black text-3xl">{selectedSquad.length}<span className="text-blue-400/50 text-xl">/11</span></h3>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <FiUsers />
                                                </div>
                                            </div>

                                            <input
                                                type="text"
                                                placeholder="Team Name..."
                                                className="w-full p-4 bg-white/10 border border-white/10 rounded-xl mb-6 focus:ring-2 focus:ring-white/30 outline-none text-white placeholder-blue-200/50 font-bold backdrop-blur-sm"
                                                value={fantasyTeamName}
                                                onChange={(e) => setFantasyTeamName(e.target.value)}
                                            />

                                            <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar-dark z-10">
                                                <AnimatePresence>
                                                    {selectedSquad.length === 0 && (
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 opacity-50">
                                                            <FiUsers className="text-4xl mx-auto mb-2" />
                                                            <p className="text-sm">Select players to build your team</p>
                                                        </motion.div>
                                                    )}
                                                    {selectedSquad.map(p => (
                                                        <motion.div
                                                            key={p.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            className="flex items-center gap-3 p-2 mb-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                                                        >
                                                            <img src={getImageUrl(p.image_path || p.image)} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm truncate">{p.name}</p>
                                                                <p className="text-[10px] text-blue-200">{p.role} • {p.Team?.short_name}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => togglePlayerSelect(p)}
                                                                className="w-8 h-8 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                                            >
                                                                <FiX size={14} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>

                                            <button
                                                onClick={createFantasyTeam}
                                                disabled={selectedSquad.length === 0}
                                                className="w-full bg-white text-deep-blue py-4 rounded-xl font-black shadow-lg hover:shadow-white/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all z-10"
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
