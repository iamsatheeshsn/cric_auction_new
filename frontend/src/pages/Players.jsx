import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUser, FiX, FiArrowLeft, FiTrash2, FiEdit, FiPrinter, FiRefreshCw, FiUpload, FiDownload } from 'react-icons/fi';
import api from '../api/axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerInfoModal from '../components/PlayerInfoModal';
import PlayerRegistrationModal from '../components/PlayerRegistrationModal';

const Players = () => {
    const { auctionId } = useParams();
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const printPendingRef = useRef(false);

    const [auction, setAuction] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [formData, setFormData] = useState({
        name: '', role: 'Batsman', dob: '', mobile_number: '', father_name: '',
        batting_type: 'Right Hand', bowling_type: 'Right Arm Fast',
        tshirt_size: 'M', trouser_size: 'M', notes: '',
        payment_transaction_id: '', is_owner: 'false', team_id: '',
        points: 0, jersey_no: '', player_link: '',
        image: null, payment_screenshot: null
    });

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (auctionId) {
            fetchAuctionDetails();
            fetchTeams();
        }
        fetchPlayers();
    }, [auctionId, currentPage, search, roleFilter, statusFilter, limit]);

    // Handle print completion
    useEffect(() => {
        const handleAfterPrint = () => {
            if (limit > 10) {
                setLimit(10);
                setCurrentPage(1);
            }
        };

        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [limit]);

    const fetchAuctionDetails = async () => {
        try {
            const res = await api.get(`/auctions/${auctionId}`);
            setAuction(res.data);
        } catch (error) {
            console.error("Failed to load auction");
        }
    };

    const fetchPlayers = async () => {
        try {
            let res;
            if (auctionId) {
                // Auction Specific Players
                res = await api.get(`/players/auction/${auctionId}?page=${currentPage}&limit=${limit}&search=${search}&role=${roleFilter}&status=${statusFilter}&_t=${Date.now()}`);

                // Sort by order_id (PID), fallback to ID
                const statusPriority = { 'Sold': 1, 'Unsold': 2, 'Available': 3 };
                const sortedPlayers = (res.data.players || []).sort((a, b) => {
                    const statusA = statusPriority[a.status] || 4;
                    const statusB = statusPriority[b.status] || 4;
                    if (statusA !== statusB) return statusA - statusB;

                    const pidA = a.order_id || 999999;
                    const pidB = b.order_id || 999999;
                    return pidA - pidB || parseInt(a.id) - parseInt(b.id);
                });
                setPlayers(sortedPlayers);
            } else {
                // Global Players
                res = await api.get(`/players?page=${currentPage}&limit=${limit}&search=${search}&role=${roleFilter}`);
                setPlayers(res.data.players || []);
            }

            setTotalPages(res.data.totalPages);

            if (printPendingRef.current) {
                printPendingRef.current = false;
                setTimeout(() => window.print(), 500);
            }
        } catch (error) {
            console.error("Failed to load players");
        }
    };

    const handlePrintAll = () => {
        setLimit(1000);
        printPendingRef.current = true;
        setCurrentPage(1);
    };

    const fetchTeams = async () => {
        try {
            const res = await api.get(`/teams/auction/${auctionId}?limit=100`);
            setTeams(res.data.teams);
        } catch (error) {
            console.error("Failed to load teams");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        setFormData(prev => ({ ...prev, [field]: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        if (auctionId) data.append('auction_id', auctionId);
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            if (isEdit) {
                await api.put(`/players/${editId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Player updated successfully');
            } else {
                await api.post('/players', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Player added successfully');
            }
            setShowModal(false);
            fetchPlayers();
            resetForm();
        } catch (error) {
            console.error("Failed to create/update player", error);
            toast.error('Failed to save player');
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setEditId(null);
        setFormData({
            name: '', role: 'Batsman', dob: '', mobile_number: '', father_name: '',
            batting_type: 'Right Hand', bowling_type: 'Right Arm Fast',
            tshirt_size: 'M', trouser_size: 'M', notes: '',
            payment_transaction_id: '', is_owner: 'false', team_id: '',
            points: 0, jersey_no: '', player_link: '',
            image: null, payment_screenshot: null
        });
    };

    const handleEdit = (player) => {
        setIsEdit(true);
        setEditId(player.id);
        const playerTeamId = player.Team ? player.Team.id : (player.team_id || '');
        setFormData({
            name: player.name,
            role: player.role,
            dob: player.dob ? player.dob.split('T')[0] : '',
            mobile_number: player.mobile_number,
            father_name: player.father_name,
            batting_type: player.batting_type,
            bowling_type: player.bowling_type,
            tshirt_size: player.tshirt_size,
            trouser_size: player.trouser_size,
            notes: player.notes,
            payment_transaction_id: player.payment_transaction_id,
            is_owner: player.is_owner ? 'true' : 'false',
            team_id: playerTeamId,
            points: player.points,
            jersey_no: player.jersey_no || '',
            player_link: player.player_link,
            image: null,
            payment_screenshot: null
        });
        setShowModal(true);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState(null);

    const handleDeleteClick = (player) => {
        setPlayerToDelete(player);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!playerToDelete) return;
        try {
            await api.delete(`/players/${playerToDelete.id}`);
            toast.success('Player deleted successfully');
            fetchPlayers();
        } catch (error) {
            console.error("Failed to delete player");
            toast.error('Failed to delete player');
        }
        setDeleteModalOpen(false);
        setPlayerToDelete(null);
    };

    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) return toast.error("Please select a file");

        const data = new FormData();
        data.append('file', importFile);
        if (auctionId) data.append('auction_id', auctionId);

        console.log("Importing file:", importFile.name, importFile.type);
        for (let pair of data.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }

        setIsImporting(true);
        try {
            const res = await api.post('/players/bulk-import', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(res.data.message || 'Players imported successfully');
            setShowImportModal(false);
            setImportFile(null);
            fetchPlayers();
        } catch (error) {
            console.error("Import failed:", error);
            toast.error(error.response?.data?.message || 'Failed to import players');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-4 mb-8 print:hidden">
                <div className="flex gap-4">
                    {auctionId && (
                        <>
                            <Link to="/auctions" className="text-gray-500 hover:text-deep-blue flex items-center gap-2 w-fit">
                                <FiArrowLeft /> Back to Auctions
                            </Link>
                            <Link to={`/teams/${auctionId}`} className="text-gray-500 hover:text-deep-blue flex items-center gap-2 w-fit">
                                Example: Teams
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{auctionId ? 'Players' : 'Global Player Pool'}</h1>
                        {auction && <p className="text-gray-500">for {auction.name}</p>}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Search Players..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-deep-blue text-sm"
                        />
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-deep-blue text-sm bg-white"
                        >
                            <option value="">All Roles</option>
                            <option value="Batsman">Batsman</option>
                            <option value="Bowler">Bowler</option>
                            <option value="All Rounder">All Rounder</option>
                            <option value="Wicket Keeper">Wicket Keeper</option>
                        </select>

                        {auctionId && (
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-deep-blue text-sm bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Unsold">Unsold</option>
                                <option value="Sold">Sold</option>
                            </select>
                        )}

                        <button
                            onClick={handlePrintAll}
                            className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 w-10 h-10 rounded-lg hover:bg-gray-50 transition-colors shadow-sm ml-2"
                            title="Print All"
                        >
                            <FiPrinter size={20} />
                        </button>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm ml-2"
                        >
                            <FiUpload /> Import
                        </button>

                        {(auction?.status === 'Upcoming' || !auctionId) && (
                            auctionId ? (
                                <button
                                    onClick={() => setShowRegisterModal(true)}
                                    className="flex items-center gap-2 bg-deep-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md ml-2"
                                >
                                    <FiPlus /> Register Player
                                </button>
                            ) : (
                                <button
                                    onClick={() => { resetForm(); setShowModal(true); }}
                                    className="flex items-center gap-2 bg-deep-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md ml-2"
                                >
                                    <FiPlus /> Add Player
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{auctionId ? 'Players List' : 'All Players'}</h1>
                {auction && <p className="text-gray-500">{auction.name}</p>}
            </div>

            {players.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <FiUser className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Players Found</h3>
                    <p className="text-gray-500 max-w-md">Add players using the "Add Player" button above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 print:bg-white print:border-gray-300">
                            <tr>
                                {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">PID</th>}
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Player</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                                {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Team</th>}
                                {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>}
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                            {players.map((player, index) => (
                                <tr key={player.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                                    {auctionId && (
                                        <td className="p-4 text-sm font-bold text-gray-400">
                                            #{player.order_id || '-'}
                                        </td>
                                    )}
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden print:border print:border-gray-200">
                                            {player.image_path ? (
                                                <img src={`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100"><FiUser className="text-gray-400" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <p
                                                className="font-semibold text-gray-800 cursor-pointer hover:text-deep-blue transition-colors"
                                                onClick={() => setSelectedPlayer(player)}
                                            >
                                                {player.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{player.mobile_number}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="font-semibold">{player.role}</div>
                                        {player.stats && (
                                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                <span title="Matches">M: {player.stats.matches}</span> |
                                                <span title="Runs">R: {player.stats.runs}</span> |
                                                <span title="Wickets">W: {player.stats.wickets}</span>
                                            </div>
                                        )}
                                    </td>
                                    {auctionId && (
                                        <>
                                            <td className="p-4 text-sm text-gray-600 font-medium">
                                                {player.Team ? player.Team.short_name : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded print:border print:border-gray-200 ${player.status === 'Sold' ? 'bg-green-100 text-green-700' :
                                                    player.status === 'Unsold' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700' // Available
                                                    }`}>
                                                    {player.status}
                                                </span>
                                            </td>
                                        </>
                                    )}
                                    <td className="p-4 flex gap-2 print:hidden">
                                        {(player.status !== 'Sold' || !auctionId) && (auction?.status === 'Upcoming' || !auctionId) && (
                                            <>
                                                <button onClick={() => handleEdit(player)} className="text-blue-400 hover:text-blue-600">
                                                    <FiEdit />
                                                </button>
                                                <button onClick={() => handleDeleteClick(player)} className="text-red-400 hover:text-red-600">
                                                    <FiTrash2 />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2 print:hidden">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                    >
                        Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded border ${currentPage === page ? 'bg-deep-blue text-white border-deep-blue' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-800">Import Players</h2>
                                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <FiX className="text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-2">1. Download the sample CSV format</p>
                                    <a
                                        href="http://localhost:5000/api/players/sample-csv"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-bold text-deep-blue hover:underline"
                                    >
                                        <FiDownload /> Download Sample CSV
                                    </a>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowImportModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!importFile || isImporting}
                                        className="px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-blue-900 transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isImporting ? <FiRefreshCw className="animate-spin" /> : <FiUpload />}
                                        {isImporting ? 'Importing...' : 'Upload & Import'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Player Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
                        >
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Player' : 'Add New Player'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Personal Info */}
                                    <div className="md:col-span-3 pb-2 border-b border-gray-100"><h3 className="font-bold text-gray-500 uppercase text-xs">Personal Details</h3></div>

                                    <div>
                                        <label className="label">Player Image *</label>
                                        <input type="file" onChange={(e) => handleFileChange(e, 'image')} className="file-input" />
                                    </div>
                                    <div>
                                        <label className="label">Player Name *</label>
                                        <input required disabled={!!auctionId} name="name" value={formData.name} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="label">Father Name</label>
                                        <input disabled={!!auctionId} name="father_name" value={formData.father_name} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="label">Date of Birth *</label>
                                        <input required disabled={!!auctionId} type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="label">Mobile No</label>
                                        <input disabled={!!auctionId} name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="label">Preferred Jersey No</label>
                                        <input disabled={!!auctionId} name="jersey_no" value={formData.jersey_no} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>

                                    {/* Cricketing Info */}
                                    <div className="md:col-span-3 pb-2 border-b border-gray-100 mt-4"><h3 className="font-bold text-gray-500 uppercase text-xs">Cricketing Details</h3></div>

                                    <div>
                                        <label className="label">Player Role *</label>
                                        <select disabled={!!auctionId} name="role" value={formData.role} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500">
                                            <option>Batsman</option>
                                            <option>Bowler</option>
                                            <option>All Rounder</option>
                                            <option>Wicket Keeper</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Batting Type</label>
                                        <select disabled={!!auctionId} name="batting_type" value={formData.batting_type} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500">
                                            <option>Right Hand</option>
                                            <option>Left Hand</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Bowling Type</label>
                                        <select disabled={!!auctionId} name="bowling_type" value={formData.bowling_type} onChange={handleInputChange} className="input-field disabled:bg-gray-100 disabled:text-gray-500">
                                            <option>Right Arm Fast</option>
                                            <option>Right Arm Medium</option>
                                            <option>Right Arm Spin</option>
                                            <option>Left Arm Fast</option>
                                            <option>Left Arm Spin</option>
                                        </select>
                                    </div>

                                    {/* Kit & Status */}
                                    <div className="md:col-span-3 pb-2 border-b border-gray-100 mt-4"><h3 className="font-bold text-gray-500 uppercase text-xs">Kit & Status</h3></div>

                                    <div>
                                        <label className="label">T-Shirt Size</label>
                                        <input name="tshirt_size" value={formData.tshirt_size} onChange={handleInputChange} className="input-field" placeholder="S, M, L, XL" />
                                    </div>
                                    <div>
                                        <label className="label">Trouser Size</label>
                                        <input name="trouser_size" value={formData.trouser_size} onChange={handleInputChange} className="input-field" placeholder="30, 32, 34" />
                                    </div>
                                    <div>
                                        <label className="label">Is Owner/Icon?</label>
                                        <select name="is_owner" value={formData.is_owner} onChange={handleInputChange} className="input-field">
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Team</label>
                                        <select name="team_id" value={formData.team_id} onChange={handleInputChange} className="input-field">
                                            <option value="">Select Team</option>
                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Points</label>
                                        <input type="number" name="points" value={formData.points} onChange={handleInputChange} className="input-field" />
                                    </div>

                                    {/* Payment */}
                                    <div className="md:col-span-3 pb-2 border-b border-gray-100 mt-4"><h3 className="font-bold text-gray-500 uppercase text-xs">Payment & Extra</h3></div>

                                    <div>
                                        <label className="label">G-Pay Trans-ID</label>
                                        <input name="payment_transaction_id" value={formData.payment_transaction_id} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label">Upload G-Pay Screenshot</label>
                                        <input type="file" onChange={(e) => handleFileChange(e, 'payment_screenshot')} className="file-input" />
                                    </div>
                                    <div>
                                        <label className="label">Player Link</label>
                                        <input name="player_link" value={formData.player_link} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="label">Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-field h-20" />
                                    </div>

                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-deep-blue text-white rounded-lg hover:shadow-lg hover:bg-blue-900 transition-all">
                                        {isEdit ? 'Update Player' : 'Add Player'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Player?"
                message={`Are you sure you want to delete "${playerToDelete?.name}"?`}
            />

            {/* Player Info Filter Modal */}
            <PlayerInfoModal
                player={selectedPlayer}
                isOpen={!!selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
            />

            {/* Registration Modal */}
            <PlayerRegistrationModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                auctionId={auctionId}
                onPlayerRegistered={fetchPlayers}
            />
        </Layout>
    );
};

export default Players;
