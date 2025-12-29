import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCalendar, FiMapPin, FiActivity, FiX, FiInfo, FiEdit, FiTrash2, FiCopy } from 'react-icons/fi';
import api from '../api/axios';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';

const Auctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        auction_date: '',
        place: '',
        type: 'Cricket',
        points_per_team: 100,
        min_bid: 100,
        bid_increase_by: 50,
        image: null
    });

    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAuctions();
    }, [currentPage, search]);

    const fetchAuctions = async () => {
        try {
            const res = await api.get(`/auctions?page=${currentPage}&limit=9&search=${search}`);
            setAuctions(res.data.auctions);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Failed to load auctions");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        try {
            if (isEdit) {
                await api.put(`/auctions/${editId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Auction updated successfully');
            } else {
                await api.post('/auctions', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Auction created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchAuctions();
        } catch (error) {
            console.error("Failed to create/update auction", error);
            toast.error('Failed to save auction');
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setEditId(null);
        setFormData({
            name: '',
            auction_date: '',
            place: '',
            type: 'Cricket',
            points_per_team: 100,
            min_bid: 100,
            bid_increase_by: 50,
            image: null
        });
    };

    const handleEdit = (auction) => {
        setIsEdit(true);
        setEditId(auction.id);
        setFormData({
            name: auction.name,
            auction_date: auction.auction_date,
            place: auction.place,
            type: auction.type,
            points_per_team: auction.points_per_team,
            min_bid: auction.min_bid,
            bid_increase_by: auction.bid_increase_by,
            image: null // New image optional
        });
        setShowModal(true);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [auctionToDelete, setAuctionToDelete] = useState(null);

    const handleDeleteClick = (auction) => {
        setAuctionToDelete(auction);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!auctionToDelete) return;
        try {
            await api.delete(`/auctions/${auctionToDelete.id}`);
            toast.success('Auction deleted successfully');
            fetchAuctions();
        } catch (error) {
            console.error("Failed to delete auction", error);
            toast.error('Failed to delete auction');
        }
        setDeleteModalOpen(false);
        setAuctionToDelete(null);
    };

    // Import Data Logic
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importTargetId, setImportTargetId] = useState(null);
    const [importSourceId, setImportSourceId] = useState('');
    const [importOptions, setImportOptions] = useState({ teams: true, players: true });

    const openImportModal = (id) => {
        setImportTargetId(id);
        setImportSourceId('');
        setImportOptions({ teams: true, players: true });
        setImportModalOpen(true);
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auctions/copy-data', {
                sourceAuctionId: importSourceId,
                targetAuctionId: importTargetId,
                includeTeams: importOptions.teams,
                includePlayers: importOptions.players
            });

            const { stats } = res.data;
            let msg = 'Import Complete: ';
            if (importOptions.teams) msg += `Teams: ${stats.teams.imported} added, ${stats.teams.skipped} skipped. `;
            if (importOptions.players) msg += `Players: ${stats.players.imported} added, ${stats.players.skipped} skipped.`;

            if (stats.teams.imported === 0 && stats.players.imported === 0 && (importOptions.teams || importOptions.players)) {
                toast.info(`No new data imported. Duplicates skipped: Teams(${stats.teams.skipped}), Players(${stats.players.skipped})`);
            } else {
                toast.success(msg);
            }

            setImportModalOpen(false);
        } catch (error) {
            console.error("Import failed full:", error.response?.data);
            toast.error(`Failed to import: ${error.response?.data?.error || 'Unknown error'}`);
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Auctions</h1>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search Auctions..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-deep-blue"
                    />
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-deep-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md"
                    >
                        <FiPlus /> New Auction
                    </button>
                </div>
            </div>

            {auctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <FiActivity className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Auctions Found</h3>
                    <p className="text-gray-500 max-w-md">Get started by creating your first auction using the "New Auction" button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctions.map(auction => (
                        <motion.div
                            key={auction.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 group flex flex-col"
                        >
                            {/* Card Image Area */}
                            <div className="h-48 bg-gray-200 relative overflow-hidden">
                                {auction.image_path ? (
                                    <img
                                        src={`http://localhost:5000/${auction.image_path}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        alt={auction.name}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-slate-50 text-gray-300 group-hover:bg-slate-100 transition-colors">
                                        <FiActivity className="text-5xl" />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                                {/* Type Badge */}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-deep-blue shadow-sm">
                                    {auction.type}
                                </div>

                                {/* Action Buttons (Overlay) */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => openImportModal(auction.id)}
                                        disabled={auction.status !== 'Upcoming'}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm ${auction.status !== 'Upcoming' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/90 text-green-600 hover:bg-green-500 hover:text-white'}`}
                                        title={auction.status !== 'Upcoming' ? "Cannot import to started auction" : "Import Data"}
                                    >
                                        <FiCopy className="text-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(auction)}
                                        disabled={auction.status !== 'Upcoming'}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm ${auction.status !== 'Upcoming' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/90 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                                        title={auction.status !== 'Upcoming' ? "Cannot edit started auction" : "Edit Auction"}
                                    >
                                        <FiEdit className="text-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(auction)}
                                        disabled={auction.status !== 'Upcoming'}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm ${auction.status !== 'Upcoming' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white/90 text-red-600 hover:bg-red-500 hover:text-white'}`}
                                        title={auction.status !== 'Upcoming' ? "Cannot delete started auction" : "Delete Auction"}
                                    >
                                        <FiTrash2 className="text-sm" />
                                    </button>
                                </div>

                                {/* Title overlay at bottom of image */}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl font-bold text-white truncate shadow-black drop-shadow-md" title={auction.name}>{auction.name}</h3>
                                    <p className="text-white/80 text-xs font-medium">ID: #{auction.id}</p>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FiCalendar className="text-deep-blue shrink-0" />
                                        <span className="truncate" title={formatDate(auction.auction_date)}>{formatDate(auction.auction_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiMapPin className="text-deep-blue shrink-0" />
                                        <span className="truncate" title={auction.place}>{auction.place}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 w-full text-center truncate">
                                            Pts: {auction.points_per_team}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded border w-full text-center uppercase tracking-wider ${auction.status === 'Live' ? 'bg-green-100 text-green-700 border-green-200 animate-pulse' :
                                            auction.status === 'Completed' ? 'bg-red-50 text-red-500 border-red-100' :
                                                auction.status === 'Paused' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                            {auction.status || 'Upcoming'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                    <Link to={`/players/${auction.id}`} className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100 border border-gray-200 transition-colors">
                                        Players
                                    </Link>
                                    <Link to={`/teams/${auction.id}`} className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100 border border-gray-200 transition-colors">
                                        Teams
                                    </Link>
                                    {auction.status === 'Completed' ? (
                                        <Link to={`/fixtures/${auction.id}`} className="col-span-2 flex items-center justify-center px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100 border border-gray-200 transition-colors">
                                            Fixtures
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            title="Fixtures are available only after auction completion"
                                            className="col-span-2 flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-semibold text-xs border border-gray-200 cursor-not-allowed"
                                        >
                                            Fixtures
                                        </button>
                                    )}
                                    {auction.status === 'Completed' ? (
                                        <button
                                            onClick={() => toast.error("This auction has ended.")}
                                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed"
                                        >
                                            <FiActivity /> Auction Ended
                                        </button>
                                    ) : (
                                        <Link to={`/auction-room/${auction.id}`} className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-deep-blue to-blue-800 text-white font-bold text-sm hover:shadow-lg hover:to-blue-900 transition-all transform active:scale-[0.98]">
                                            <FiActivity /> Enter Auction Room
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
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

            {/* Create Auction Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Auction' : 'Create New Auction'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="label">Auction Name *</label>
                                    <input required name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="e.g. IPL 2025 Mega Auction" />
                                </div>

                                <div>
                                    <label className="label">Auction Date *</label>
                                    <input required type="date" name="auction_date" value={formData.auction_date} onChange={handleInputChange} className="input-field" />
                                </div>

                                <div>
                                    <label className="label">Place *</label>
                                    <input required name="place" value={formData.place} onChange={handleInputChange} className="input-field" placeholder="e.g. Mumbai" />
                                </div>

                                <div>
                                    <label className="label">Points Per Team *</label>
                                    <input required type="number" name="points_per_team" value={formData.points_per_team} onChange={handleInputChange} className="input-field" />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="label">Min Bid</label>
                                        <input required type="number" name="min_bid" value={formData.min_bid} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="label">Bid Incr.</label>
                                        <input required type="number" name="bid_increase_by" value={formData.bid_increase_by} onChange={handleInputChange} className="input-field" />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Type</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                                        <option value="Cricket">Cricket</option>
                                        <option value="Football">Football</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Auction Image</label>
                                    <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                                </div>

                                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-deep-blue text-white rounded-lg hover:shadow-lg hover:bg-blue-900 transition-all">
                                        {isEdit ? 'Update Auction' : 'Create Auction'}
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
                title="Delete Auction?"
                message={`Are you sure you want to delete "${auctionToDelete?.name}"? This action cannot be undone.`}
            />

            {/* Import Data Modal */}
            <AnimatePresence>
                {importModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-800">Import Data</h2>
                                <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                    <FiX className="text-xl" />
                                </button>
                            </div>
                            <form onSubmit={handleImportSubmit} className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Source Auction</label>
                                    <select
                                        required
                                        value={importSourceId}
                                        onChange={(e) => setImportSourceId(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-deep-blue focus:outline-none"
                                    >
                                        <option value="">Select Source Auction</option>
                                        {auctions.filter(a => a.id !== importTargetId).map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-6 space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.teams}
                                            onChange={(e) => setImportOptions({ ...importOptions, teams: e.target.checked })}
                                            className="w-4 h-4 text-deep-blue rounded focus:ring-deep-blue"
                                        />
                                        <span className="text-gray-700">Import Teams</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={importOptions.players}
                                            onChange={(e) => setImportOptions({ ...importOptions, players: e.target.checked })}
                                            className="w-4 h-4 text-deep-blue rounded focus:ring-deep-blue"
                                        />
                                        <span className="text-gray-700">Import Players</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setImportModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-blue-900 shadow-md">
                                        Start Import
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout >
    );
};

export default Auctions;
