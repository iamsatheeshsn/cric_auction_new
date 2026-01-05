import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUser, FiX, FiArrowLeft, FiTrash2, FiEdit, FiPrinter, FiRefreshCw, FiUpload, FiDownload, FiSearch, FiFilter, FiSmartphone, FiMoreVertical } from 'react-icons/fi';
import api from '../api/axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import PlayerInfoModal from '../components/PlayerInfoModal';
import PlayerRegistrationModal from '../components/PlayerRegistrationModal';

const FormSection = ({ title, children }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{title}</h4>
        {children}
    </div>
);

const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
        case 'batsman': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'bowler': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'all rounder': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'wicket keeper': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getRoleBgClass = (role) => {
    switch (role?.toLowerCase()) {
        case 'batsman': return 'bg-gradient-to-br from-white to-blue-50/50 hover:to-blue-50';
        case 'bowler': return 'bg-gradient-to-br from-white to-emerald-50/50 hover:to-emerald-50';
        case 'all rounder': return 'bg-gradient-to-br from-white to-purple-50/50 hover:to-purple-50';
        case 'wicket keeper': return 'bg-gradient-to-br from-white to-orange-50/50 hover:to-orange-50';
        default: return 'bg-white';
    }
};

const Players = () => {
    const { auctionId } = useParams();
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(12);
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
    const [previewImage, setPreviewImage] = useState(null);

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
            if (limit > 12) {
                setLimit(12);
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
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, [field]: file }));
            if (field === 'image') {
                setPreviewImage(URL.createObjectURL(file));
            }
        }
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
        setPreviewImage(null);
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
        if (player.image_path) {
            setPreviewImage(`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`);
        } else {
            setPreviewImage(null);
        }
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
            <div className="flex flex-col gap-6 mb-8 print:hidden">
                {/* Breadcrumbs & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {auctionId && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Link to="/auctions" className="hover:text-deep-blue transition-colors">Auctions</Link>
                                <span className="text-gray-300">/</span>
                                <span className="text-gray-800 font-medium">Players</span>
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{auctionId ? 'Players List' : 'Global Player Pool'}</h1>
                        {auction && <p className="text-gray-500 text-sm mt-1">Managing players for <span className="font-semibold text-deep-blue">{auction.name}</span></p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrintAll}
                            className="p-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:border-gray-300 shadow-sm"
                            title="Print List"
                        >
                            <FiPrinter size={20} />
                        </button>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:border-gray-300 shadow-sm font-medium"
                        >
                            <FiUpload className="text-lg" /> <span className="hidden sm:inline">Import CSV</span>
                        </button>

                        {(auction?.status === 'Upcoming' || !auctionId) && (
                            <button
                                onClick={() => {
                                    if (auctionId) setShowRegisterModal(true);
                                    else { resetForm(); setShowModal(true); }
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-deep-blue text-white rounded-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 font-medium transform hover:-translate-y-0.5"
                            >
                                <FiPlus className="text-lg" />
                                <span>{auctionId ? 'Register Player' : 'Add New Player'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200/60 flex flex-col md:flex-row gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <FiSearch className="text-lg" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, mobile, etc..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 font-medium h-full"
                        />
                    </div>

                    <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>

                    <div className="flex gap-2 p-1 overflow-x-auto">
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 bg-gray-50 border border-transparent hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-deep-blue/20 cursor-pointer min-w-[140px]"
                        >
                            <option value="">All Roles</option>
                            <option value="Batsman">Batsman</option>
                            <option value="Bowler">Bowler</option>
                            <option value="All Rounder">All Rounder</option>
                            <option value="Wicket Keeper">WK / Batsman</option>
                        </select>

                        {auctionId && (
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="px-4 py-2 bg-gray-50 border border-transparent hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-deep-blue/20 cursor-pointer min-w-[140px]"
                            >
                                <option value="">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Unsold">Unsold</option>
                                <option value="Sold">Sold</option>
                            </select>
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
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FiUser className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Players Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">There are no players matching your search criteria.</p>
                </div>
            ) : (
                <>
                    {/* Grid View for Screen */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:hidden">
                        {players.map(player => (
                            <div key={player.id} className={`group rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden ${getRoleBgClass(player.role)}`}>

                                {/* Top Right Actions */}
                                {(player.status !== 'Sold' || !auctionId) && (auction?.status === 'Upcoming' || !auctionId) && (
                                    <div className="absolute top-2 right-2 flex gap-1 transform translate-x-10 group-hover:translate-x-0 transition-transform duration-200 z-10">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(player); }} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all" title="Edit">
                                            <FiEdit size={14} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(player); }} className="p-1.5 text-gray-400 hover:text-red-600 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all" title="Delete">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-4 items-center mb-3">
                                    <div onClick={() => setSelectedPlayer(player)} className="w-16 h-16 rounded-full bg-white overflow-hidden cursor-pointer border-2 border-white shadow-md group-hover:scale-105 transition-transform relative shrink-0">
                                        {player.image_path ? (
                                            <img src={`http://localhost:5000/${player.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300"><FiUser size={24} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 onClick={() => setSelectedPlayer(player)} className="font-bold text-gray-900 cursor-pointer hover:text-deep-blue transition-colors truncate text-base leading-snug">{player.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeColor(player.role)}`}>{player.role}</span>
                                            {auctionId && (
                                                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${player.status === 'Sold' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    player.status === 'Unsold' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    {player.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Career Stats Compact */}
                                <div className="grid grid-cols-3 gap-1 mb-3 bg-white/60 rounded-lg p-1.5 border border-gray-100/50">
                                    <div className="text-center">
                                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Mat</span>
                                        <span className="block text-xs font-bold text-gray-700">{player.stats?.matches || 0}</span>
                                    </div>
                                    <div className="text-center border-l border-gray-200/60">
                                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Run</span>
                                        <span className="block text-xs font-bold text-gray-700">{player.stats?.runs || 0}</span>
                                    </div>
                                    <div className="text-center border-l border-gray-200/60">
                                        <span className="block text-[9px] font-bold text-gray-400 uppercase">Wkt</span>
                                        <span className="block text-xs font-bold text-gray-700">{player.stats?.wickets || 0}</span>
                                    </div>
                                </div>

                                {auctionId ? (
                                    <div className="flex justify-between items-center bg-white/80 rounded-lg p-2 px-3 border border-gray-100 mt-auto shadow-sm">
                                        <div className="text-center">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Team</p>
                                            <p className="font-bold text-xs text-gray-800 truncate max-w-[80px]">{player.Team ? player.Team.short_name : '-'}</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100 pl-3">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Price</p>
                                            <p className="font-bold text-xs text-gray-800">
                                                {player.sold_price ? `₹${player.sold_price}` : (player.base_price ? `₹${player.base_price}` : '-')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <FiSmartphone size={10} />
                                            <span>{player.mobile_number || '-'}</span>
                                        </div>
                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-mono">#{player.id}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Table View for Print - Preserved Original Table */}
                    <div className="hidden print:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 print:bg-white print:border-gray-300">
                                <tr>
                                    {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">PID</th>}
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Player</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                                    {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Team</th>}
                                    {auctionId && <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                                {players.map((player, index) => (
                                    <tr key={player.id} className="print:hover:bg-transparent">
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
                                                <p className="font-semibold text-gray-800">{player.name}</p>
                                                <p className="text-xs text-gray-500">{player.mobile_number}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="font-semibold">{player.role}</div>
                                        </td>
                                        {auctionId && (
                                            <>
                                                <td className="p-4 text-sm text-gray-600 font-medium">
                                                    {player.Team ? player.Team.short_name : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded print:border print:border-gray-200 ${player.status === 'Sold' ? 'bg-green-100 text-green-700' :
                                                        player.status === 'Unsold' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {player.status}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-10 gap-3 print:hidden items-center">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-deep-blue/30 hover:text-deep-blue transition-all shadow-sm group"
                    >
                        <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm items-center">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'bg-deep-blue text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-deep-blue'}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-deep-blue/30 hover:text-deep-blue transition-all shadow-sm group"
                    >
                        <FiArrowLeft className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            )}

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="p-1.5 bg-white/10 rounded-lg"><FiUpload /></div>
                                    Import Players
                                </h2>
                                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                                    <FiX className="text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <div className="mt-0.5 text-blue-600"><FiDownload /></div>
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium mb-1">Download Sample Format</p>
                                        <p className="text-xs text-blue-700 mb-2">Use the standard CSV template to avoid errors during import.</p>
                                        <a
                                            href="http://localhost:5000/api/players/sample-csv"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-deep-blue hover:underline bg-white px-3 py-1.5 rounded-lg border border-blue-200 inline-block"
                                        >
                                            Download Sample CSV
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload CSV File</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors group cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setImportFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-deep-blue">
                                            <FiUpload className="text-xl" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{importFile ? importFile.name : 'Click to browse or drag file here'}</p>
                                        <p className="text-xs text-gray-400 mt-1">Only .csv files are supported</p>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowImportModal(false)}
                                        className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!importFile || isImporting}
                                        className="px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200 text-sm font-medium disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
                        >
                            <div className="bg-gradient-to-r from-deep-blue to-blue-800 p-6 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {isEdit ? <FiEdit /> : <FiPlus />} {isEdit ? 'Edit Player' : 'Add New Player'}
                                    </h2>
                                    <p className="text-blue-200 text-sm mt-1">
                                        {isEdit ? 'Update player details.' : 'Fill in the details to add a new player.'}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
                                <div className="space-y-6">

                                    <FormSection title="Personal Information">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Profile Photo</label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center text-center cursor-pointer hover:border-deep-blue hover:bg-blue-50 transition-all relative group bg-gray-50 overflow-hidden">
                                                    <input type="file" onChange={(e) => handleFileChange(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    {previewImage ? (
                                                        <>
                                                            <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                                            <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform relative z-20">
                                                                <FiEdit className="text-2xl text-deep-blue" />
                                                            </div>
                                                            <span className="text-xs text-gray-800 font-bold relative z-20 bg-white/80 px-2 py-0.5 rounded-full">Change Photo</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform relative z-20">
                                                                <FiUser className="text-2xl text-deep-blue" />
                                                            </div>
                                                            <span className="text-xs text-gray-500 font-medium group-hover:text-deep-blue relative z-20">Upload Image</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                                                    <input required disabled={!!auctionId} name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800" placeholder="e.g. MS Dhoni" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father's Name</label>
                                                    <input disabled={!!auctionId} name="father_name" value={formData.father_name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth *</label>
                                                    <input required disabled={!!auctionId} type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
                                                    <input disabled={!!auctionId} name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Jersey No</label>
                                                    <input disabled={!!auctionId} name="jersey_no" value={formData.jersey_no} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800" />
                                                </div>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormSection title="Cricketing Profile">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Player Role *</label>
                                                    <select disabled={!!auctionId} name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800">
                                                        <option>Batsman</option>
                                                        <option>Bowler</option>
                                                        <option>All Rounder</option>
                                                        <option>Wicket Keeper</option>
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batting Style</label>
                                                        <select disabled={!!auctionId} name="batting_type" value={formData.batting_type} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800">
                                                            <option>Right Hand</option>
                                                            <option>Left Hand</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bowling Style</label>
                                                        <select disabled={!!auctionId} name="bowling_type" value={formData.bowling_type} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium disabled:bg-gray-50 text-gray-800">
                                                            <option>Right Arm Fast</option>
                                                            <option>Right Arm Medium</option>
                                                            <option>Right Arm Spin</option>
                                                            <option>Left Arm Fast</option>
                                                            <option>Left Arm Spin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection title="Kit & Auction Details">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">T-Shirt Size</label>
                                                        <input name="tshirt_size" value={formData.tshirt_size} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800" placeholder="S, M, L, XL" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trouser Size</label>
                                                        <input name="trouser_size" value={formData.trouser_size} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800" placeholder="30, 32, 34" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status (Owner/Icon)</label>
                                                        <select name="is_owner" value={formData.is_owner} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800">
                                                            <option value="false">No</option>
                                                            <option value="true">Yes</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Assignment</label>
                                                        <select name="team_id" value={formData.team_id} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800">
                                                            <option value="">Select Team</option>
                                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Points / Price</label>
                                                    <input type="number" name="points" value={formData.points} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800" />
                                                </div>
                                            </div>
                                        </FormSection>
                                    </div>

                                    <FormSection title="Registration & Payment">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transaction ID</label>
                                                <input name="payment_transaction_id" value={formData.payment_transaction_id} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800" placeholder="For paid registrations" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Screenshot</label>
                                                <input type="file" onChange={(e) => handleFileChange(e, 'payment_screenshot')} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Public Profile Link</label>
                                            <input name="player_link" value={formData.player_link} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800" placeholder="e.g. CricHeroes Profile URL" />
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Additional Notes</label>
                                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue outline-none transition-all font-medium text-gray-800 h-20 resize-none" placeholder="Any special requirements or comments..." />
                                        </div>
                                    </FormSection>

                                </div>

                                <div className="mt-4 pt-6 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 bg-gradient-to-r from-deep-blue to-blue-700 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-blue-200"
                                    >
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
