import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiRefreshCw, FiPrinter, FiTrash2, FiCalendar, FiMapPin, FiPlus, FiX, FiEdit, FiSearch, FiChevronLeft, FiChevronRight, FiActivity, FiUsers, FiShield, FiAward, FiStar, FiCheckCircle, FiShare2, FiMonitor } from 'react-icons/fi';
import ShareCardModal from '../components/social/ShareCardModal';
import MatchSummaryCard from '../components/social/templates/MatchSummaryCard';
import api from '../api/axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';

const Fixtures = () => {

    const { auctionId } = useParams();
    const [fixtures, setFixtures] = useState([]);
    const [teams, setTeams] = useState([]); // For dropdown
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Derived State
    const filteredFixtures = fixtures.filter(f => {
        const term = searchTerm.toLowerCase();
        return (
            f.Team1?.name.toLowerCase().includes(term) ||
            f.Team2?.name.toLowerCase().includes(term) ||
            (f.venue && f.venue.toLowerCase().includes(term))
        );
    });

    const totalPages = Math.ceil(filteredFixtures.length / itemsPerPage);
    const displayedFixtures = filteredFixtures.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Manual Creation Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMatch, setNewMatch] = useState({
        team1_id: '',
        team2_id: '',
        match_date: '',
        venue: '',
        match_type: 'Tournament'
    });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingFixture, setEditingFixture] = useState(null);
    const [editForm, setEditForm] = useState({ match_date: '', venue: '' });

    // Confirmation Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'generate', 'delete', 'deleteItem'
    const [fixtureToDelete, setFixtureToDelete] = useState(null);

    useEffect(() => {
        fetchAuctionDetails();
        fetchFixtures();
        fetchTeams();
    }, [auctionId]);

    const fetchAuctionDetails = async () => {
        try {
            const res = await api.get(`/auctions/${auctionId}`);
            setAuction(res.data);
        } catch (error) {
            console.error("Failed to load auction");
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await api.get(`/teams/all/${auctionId}`);
            setTeams(res.data);
        } catch (error) {
            console.error("Failed to load teams");
        }
    };

    const fetchFixtures = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/fixtures/${auctionId}`);
            setFixtures(res.data);
        } catch (error) {
            console.error("Failed to load fixtures");
            toast.error("Failed to load fixtures");
        } finally {
            setLoading(false);
        }
    };

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateConfig, setGenerateConfig] = useState({
        match_date: '',
        venue: ''
    });

    // Share Modal State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareMatchData, setShareMatchData] = useState(null);

    const handleShareClick = (match) => {
        // Construct Summary Data
        const team1 = match.Team1;
        const team2 = match.Team2;
        const isTeam1Win = match.winning_team_id === team1.id;

        // MVP (Mocked or Real if we had it fully)
        // Accessing result from `result_description` mostly.
        // And scores need to be passed or parsed.
        // Assuming match has team1_runs, team1_wickets, etc. if from `simulateMatch`.
        // Let's rely on standard fields.

        const data = {
            matchTitle: `Match #${match.match_order} - ${auction?.name || 'Tournament'}`,
            date: new Date(match.match_date).toDateString(),
            team1: {
                name: team1.sort_name || team1.name,
                score: match.team1_runs || 0,
                wickets: match.team1_wickets || 0,
                overs: match.team1_overs || 0
            },
            team2: {
                name: team2.sort_name || team2.name,
                score: match.team2_runs || 0,
                wickets: match.team2_wickets || 0,
                overs: match.team2_overs || 0
            },
            result: match.result_description || 'Match Completed',
            mvp: {
                name: "TBD",
                stats: "Player of the Match"
            } // MVP is not fully in generic fixture object list, ignoring for now or fetching details?
            // Ideally we fetch details. But for now let's show placeholder or "TBD"
        };

        setShareMatchData(data);
        setShareModalOpen(true);
    };

    const handleGenerate = () => {
        // Set defaults
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const defaultDateTime = now.toISOString().slice(0, 16);

        setGenerateConfig({
            match_date: defaultDateTime,
            venue: auction?.place || ''
        });
        setShowGenerateModal(true);
    };

    const confirmGenerate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fixtures/generate', {
                auctionId,
                match_date: generateConfig.match_date,
                venue: generateConfig.venue
            });
            toast.success('Fixtures generated successfully!');
            setShowGenerateModal(false);
            fetchFixtures();
        } catch (error) {
            console.error("Generate failed", error);
            toast.error(error.response?.data?.message || 'Generation failed');
        }
    };

    const handleClear = async () => {
        setModalAction('delete');
        setConfirmModalOpen(true);
    };

    const handleDeleteItem = (id) => {
        setFixtureToDelete(id);
        setModalAction('deleteItem');
        setConfirmModalOpen(true);
    };

    const handleEditClick = (match) => {
        setEditingFixture(match);
        setEditForm({
            match_date: match.match_date ? match.match_date.slice(0, 16) : '', // format datetime-local
            venue: match.venue || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateFixture = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/fixtures/item/${editingFixture.id}`, editForm);
            toast.success("Fixture updated successfully!");
            setShowEditModal(false);
            setEditingFixture(null);
            fetchFixtures();
        } catch (error) {
            console.error("Failed to update fixture", error);
            toast.error("Failed to update fixture");
        }
    };

    const confirmAction = async () => {
        try {
            if (modalAction === 'delete') {
                await api.delete(`/fixtures/${auctionId}`);
                toast.success('Fixtures cleared successfully!');
                fetchFixtures();
            } else if (modalAction === 'deleteItem') {
                await api.delete(`/fixtures/item/${fixtureToDelete}`);
                toast.success('Fixture deleted successfully!');
                fetchFixtures();
            }
        } catch (error) {
            console.error("Action failed", error);
            const msg = error.response?.data?.message || 'Operation failed';
            toast.error(msg);
        } finally {
            setConfirmModalOpen(false);
            setModalAction(null);
            setFixtureToDelete(null);
        }
    };

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fixtures', {
                auctionId,
                ...newMatch
            });
            toast.success("Match created successfully!");
            setShowCreateModal(false);
            setNewMatch({ team1_id: '', team2_id: '', match_date: '', venue: '', match_type: 'Tournament' });
            fetchFixtures();
        } catch (error) {
            console.error("Failed to create match", error);
            toast.error(error.response?.data?.message || "Failed to create match");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Layout>
            <div className="flex flex-col gap-4 mb-8 print:hidden">
                <Link to="/auctions" className="text-gray-500 hover:text-deep-blue flex items-center gap-2 w-fit">
                    <FiArrowLeft /> Back to Auctions
                </Link>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Match Fixtures</h1>
                        {auction && <p className="text-gray-500">for {auction.name}</p>}
                    </div>

                    {/* Search Bar */}
                    {fixtures.length > 0 && (
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search teams or venue..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-blue outline-none text-sm w-64"
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm"
                        >
                            <FiPlus /> New Match
                        </button>

                        {fixtures.length === 0 ? (
                            <button
                                onClick={handleGenerate}
                                className="flex items-center gap-2 bg-deep-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md text-sm"
                            >
                                <FiRefreshCw /> Auto Generate Matches
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                >
                                    <FiPrinter /> Print
                                </button>
                                <button
                                    onClick={handleClear}
                                    disabled={fixtures.some(f => f.status === 'Completed' || f.status === 'Live')}
                                    className={`flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg transition-colors border border-red-100 text-sm ${fixtures.some(f => f.status === 'Completed' || f.status === 'Live') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
                                    title={fixtures.some(f => f.status === 'Completed' || f.status === 'Live') ? "Cannot reset active tournament" : "Reset Fixtures"}
                                >
                                    <FiTrash2 /> Reset
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Fixtures</h1>
                {auction && <p className="text-xl text-gray-600">{auction.name}</p>}
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue"></div></div>
            ) : fixtures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 text-center print:hidden">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <FiCalendar className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Fixtures Scheduled</h3>
                    <p className="text-gray-500 max-w-md">Click "Auto Generate Matches" or "New Match" to schedule games.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-6">
                        {displayedFixtures.map((match, index) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow print:shadow-none print:border-gray-800"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Match #{match.match_order}</span>
                                        {match.match_type === 'Friendly' && (
                                            <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-yellow-200">Friendly</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {/* Share Button for Completed Matches */}
                                        {match.status === 'Completed' && (
                                            <button
                                                onClick={() => handleShareClick(match)}
                                                className="text-purple-500 hover:text-purple-700 bg-purple-50 p-1.5 rounded-full transition-colors"
                                                title="Share Match Result"
                                            >
                                                <FiShare2 size={14} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleEditClick(match)}
                                            disabled={match.status === 'Completed' || match.status === 'Live'}
                                            className={`text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-full transition-colors ${match.status === 'Completed' || match.status === 'Live' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={match.status === 'Completed' || match.status === 'Live' ? "Cannot edit active/completed match" : "Edit Date/Venue"}
                                        >
                                            <FiEdit size={14} />
                                        </button>

                                        {/* Watch Live Button */}
                                        {(match.status === 'Live' || match.status === 'Completed') && (
                                            <Link
                                                to={`/match-center/${match.id}`}
                                                className="text-white hover:text-white bg-red-500 hover:bg-red-600 p-1.5 rounded-full transition-colors shadow-sm animate-pulse"
                                                title="Watch in Match Center"
                                            >
                                                <FiMonitor size={14} />
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleDeleteItem(match.id)}
                                            disabled={match.status === 'Completed' || match.status === 'Live'}
                                            className={`text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-full transition-colors ${match.status === 'Completed' || match.status === 'Live' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Delete Match"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>


                                <div className="flex items-center justify-between gap-4">
                                    {/* Team 1 */}
                                    <div className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-slate-50 shadow-sm flex-shrink-0">
                                            {match.Team1?.image_path ? (
                                                <img src={`http://localhost:5000/${match.Team1.image_path}`} className="w-full h-full object-cover" />
                                            ) : <FiUsers className="w-full h-full p-3 text-gray-300" />}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-gray-800 text-sm">{match.Team1?.name}</h3>
                                            <span className="text-xs font-bold text-deep-blue bg-blue-50 px-1.5 py-0.5 rounded">{match.Team1?.short_name}</span>
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-2xl font-black text-gray-200">VS</span>
                                    </div>

                                    {/* Team 2 */}
                                    <div className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-slate-50 shadow-sm flex-shrink-0">
                                            {match.Team2?.image_path ? (
                                                <img src={`http://localhost:5000/${match.Team2.image_path}`} className="w-full h-full object-cover" />
                                            ) : <FiUsers className="w-full h-full p-3 text-gray-300" />}
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-gray-800 text-sm">{match.Team2?.name}</h3>
                                            <span className="text-xs font-bold text-deep-blue bg-blue-50 px-1.5 py-0.5 rounded">{match.Team2?.short_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Result Display */}
                                {match.status === 'Completed' && match.result_description && (
                                    <div className="bg-green-50 text-green-700 text-center py-2 rounded-lg mt-3 mb-1 text-sm font-bold border border-green-100">
                                        {match.result_description}
                                    </div>
                                )}

                                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><FiMapPin /> {match.venue || 'TBD'}</span>
                                    <div className="flex gap-2">
                                        <span className="flex items-center gap-1">
                                            <FiCalendar />
                                            {match.match_date ? (
                                                new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                                                ' at ' +
                                                new Date(match.match_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                            ) : 'Date TBD'}
                                        </span>
                                        {match.status === 'Live' ? (
                                            <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold animate-pulse border border-red-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Live
                                            </span>
                                        ) : match.status === 'Completed' ? (
                                            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">
                                                Completed
                                            </span>
                                        ) : null}
                                        <Link
                                            to={`/match-scoring/${match.id}`}
                                            className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                                        >
                                            <FiActivity /> {match.status === 'Completed' ? 'View' : 'Score'}
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-8 gap-4 print:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <FiChevronLeft />
                            </button>
                            <span className="text-sm font-medium text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create Match Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-deep-blue to-blue-800 p-6 text-white flex justify-between items-start shrink-0">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        <FiCalendar className="text-blue-300" /> New Match
                                    </h3>
                                    <p className="text-blue-200 text-sm mt-1">Schedule a new fixture for the auction.</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateMatch} className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
                                <FormSection title="Choose Teams">
                                    <div className="flex items-center gap-4 justify-between">
                                        <div className="flex-1">
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-deep-blue">
                                                    <FiShield />
                                                </div>
                                                <select
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-transparent outline-none transition-all font-medium appearance-none cursor-pointer hover:bg-white"
                                                    value={newMatch.team1_id}
                                                    onChange={(e) => setNewMatch({ ...newMatch, team1_id: e.target.value })}
                                                >
                                                    <option value="">Team 1</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id} disabled={team.id == newMatch.team2_id}>{team.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 font-black text-xs border-2 border-white shadow-sm z-10">
                                            VS
                                        </div>

                                        <div className="flex-1">
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-deep-blue">
                                                    <FiShield />
                                                </div>
                                                <select
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-transparent outline-none transition-all font-medium appearance-none cursor-pointer hover:bg-white"
                                                    value={newMatch.team2_id}
                                                    onChange={(e) => setNewMatch({ ...newMatch, team2_id: e.target.value })}
                                                >
                                                    <option value="">Team 2</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id} disabled={team.id == newMatch.team1_id}>{team.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </FormSection>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormSection title="Match Type">
                                        <div className="grid grid-cols-2 gap-4 h-full">
                                            <MatchTypeCard
                                                type="Tournament"
                                                icon={<FiAward className="text-xl" />}
                                                selected={newMatch.match_type === 'Tournament'}
                                                onClick={() => setNewMatch({ ...newMatch, match_type: 'Tournament' })}
                                                description="Points & NRR counted"
                                            />
                                            <MatchTypeCard
                                                type="Friendly"
                                                icon={<FiStar className="text-xl" />}
                                                selected={newMatch.match_type === 'Friendly'}
                                                onClick={() => setNewMatch({ ...newMatch, match_type: 'Friendly' })}
                                                description="Practice match only"
                                            />
                                        </div>
                                    </FormSection>

                                    <FormSection title="Details">
                                        <div className="flex flex-col gap-4">
                                            <div className="relative group">
                                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block ml-1">Date & Time</label>
                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-blue outline-none transition-all font-medium text-gray-700"
                                                        value={newMatch.match_date}
                                                        onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block ml-1">Venue</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <FiMapPin />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-blue outline-none transition-all font-medium text-gray-700 placeholder-gray-400"
                                                        placeholder="e.g. Wankhede Stadium"
                                                        value={newMatch.venue}
                                                        onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </FormSection>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 bg-gradient-to-r from-deep-blue to-blue-700 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-blue-200"
                                    >
                                        Schedule Match
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Match Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Edit Match Details</h3>
                                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateFixture} className="p-6 space-y-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center mb-4">
                                    <span className="font-bold text-gray-700">{editingFixture?.Team1?.name}</span>
                                    <span className="mx-2 text-gray-400">vs</span>
                                    <span className="font-bold text-gray-700">{editingFixture?.Team2?.name}</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                        value={editForm.match_date}
                                        onChange={(e) => setEditForm({ ...editForm, match_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                        placeholder="Stadium Name"
                                        value={editForm.venue}
                                        onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-deep-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors shadow-sm"
                                    >
                                        Update Match
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Generate Fixtures Config Modal */}
            <AnimatePresence>
                {showGenerateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Auto Generate Fixtures</h3>
                                <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
                            </div>
                            <form onSubmit={confirmGenerate} className="p-6 space-y-4">
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                                    This will create a round-robin schedule for all {teams.length} teams.
                                    Existing fixtures will <strong>not</strong> be overwritten.
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time (Default)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                        value={generateConfig.match_date}
                                        onChange={(e) => setGenerateConfig({ ...generateConfig, match_date: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Applies to all generated matches (can be edited later)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue (Default)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                        placeholder="Stadium Name"
                                        value={generateConfig.venue}
                                        onChange={(e) => setGenerateConfig({ ...generateConfig, venue: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenerateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-deep-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors shadow-sm"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmAction}
                title={modalAction === 'generate' ? "Generate Fixtures?" : modalAction === 'delete' ? "Reset Fixtures?" : "Delete Match?"}
                message={modalAction === 'generate'
                    ? "This will create a round-robin schedule for all current teams. Ensure all teams are added before proceeding."
                    : modalAction === 'delete' ? "This will delete all existing matches. This action cannot be undone."
                        : "Are you sure you want to delete this match?"}
                confirmText={modalAction === 'generate' ? "Yes, Generate" : "Yes, Delete"}
                confirmButtonClass={modalAction === 'generate' ? "bg-deep-blue hover:bg-blue-900" : "bg-red-600 hover:bg-red-700"}
            />

            {/* Share Modal */}
            <ShareCardModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share Match Result"
            >
                <MatchSummaryCard data={shareMatchData} />
            </ShareCardModal>
        </Layout>
    );
};

// Helper Components for Create Modal
const FormSection = ({ title, children }) => (
    <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h4>
        {children}
    </div>
);

const MatchTypeCard = ({ type, icon, selected, onClick, description }) => (
    <div
        onClick={onClick}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected
            ? (type === 'Tournament' ? 'border-deep-blue bg-blue-50/50' : 'border-yellow-400 bg-yellow-50/50')
            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            }`}
    >
        {selected && (
            <div className={`absolute top-2 right-2 text-lg ${type === 'Tournament' ? 'text-deep-blue' : 'text-yellow-600'}`}>
                <FiCheckCircle />
            </div>
        )}
        <div className={`text-3xl ${selected ? (type === 'Tournament' ? 'text-deep-blue' : 'text-yellow-500') : 'text-gray-300'}`}>
            {icon}
        </div>
        <span className={`font-bold ${selected ? 'text-gray-800' : 'text-gray-500'}`}>{type}</span>
        <span className="text-[10px] text-gray-400 text-center font-medium">{description}</span>
    </div>
);

export default Fixtures;
