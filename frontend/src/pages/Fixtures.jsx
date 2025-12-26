import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiRefreshCw, FiPrinter, FiTrash2, FiCalendar, FiMapPin, FiPlus, FiX, FiEdit, FiSearch, FiChevronLeft, FiChevronRight, FiActivity, FiUsers } from 'react-icons/fi';
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
        venue: ''
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

    // Generate Modal State
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateConfig, setGenerateConfig] = useState({
        match_date: '',
        venue: ''
    });

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
            setNewMatch({ team1_id: '', team2_id: '', match_date: '', venue: '' });
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
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Match #{match.match_order}</span>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={() => handleEditClick(match)}
                                            disabled={match.status === 'Completed' || match.status === 'Live'}
                                            className={`text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-full transition-colors ${match.status === 'Completed' || match.status === 'Live' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={match.status === 'Completed' || match.status === 'Live' ? "Cannot edit active/completed match" : "Edit Date/Venue"}
                                        >
                                            <FiEdit size={14} />
                                        </button>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Create New Match</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateMatch} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team 1</label>
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue focus:border-transparent outline-none"
                                        value={newMatch.team1_id}
                                        onChange={(e) => setNewMatch({ ...newMatch, team1_id: e.target.value })}
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id} disabled={team.id == newMatch.team2_id}>{team.name} ({team.short_name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-center items-center py-2 text-gray-400 font-bold">VS</div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team 2</label>
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue focus:border-transparent outline-none"
                                        value={newMatch.team2_id}
                                        onChange={(e) => setNewMatch({ ...newMatch, team2_id: e.target.value })}
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id} disabled={team.id == newMatch.team1_id}>{team.name} ({team.short_name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                            value={newMatch.match_date}
                                            onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-deep-blue outline-none"
                                            placeholder="Stadium Name"
                                            value={newMatch.venue}
                                            onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-deep-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors shadow-sm"
                                    >
                                        Create Match
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
        </Layout>
    );
};

export default Fixtures;
