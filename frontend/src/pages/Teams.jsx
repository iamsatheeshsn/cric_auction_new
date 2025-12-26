import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUsers, FiX, FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';

import PlayerInfoModal from '../components/PlayerInfoModal';

const Teams = () => {
    const { auctionId } = useParams();
    const [teams, setTeams] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [auction, setAuction] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);

    // Squad View State
    const [viewSquad, setViewSquad] = useState(null);
    const [infoPlayer, setInfoPlayer] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        short_name: '',
        players_per_team: 15,
        purse_remaining: 0, // Added to track update
        image: null
    });

    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAuctionDetails();
        fetchTeams();
    }, [auctionId, currentPage, search]);

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
            const res = await api.get(`/teams/auction/${auctionId}?page=${currentPage}&limit=8&search=${search}`);
            setTeams(res.data.teams);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Failed to load teams");
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
        data.append('auction_id', auctionId);
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        try {
            if (isEdit) {
                await api.put(`/teams/${editId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Team updated successfully');
            } else {
                await api.post('/teams', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Team added successfully');
            }
            setShowModal(false);
            fetchTeams();
            resetForm();
        } catch (error) {
            console.error("Failed to create/update team", error);
            toast.error('Failed to save team');
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setEditId(null);
        setFormData({
            name: '',
            short_name: '',
            players_per_team: 15,
            purse_remaining: 0,
            image: null
        });
    };

    const handleEdit = (team) => {
        setIsEdit(true);
        setEditId(team.id);
        setFormData({
            name: team.name,
            short_name: team.short_name,
            players_per_team: team.players_per_team,
            purse_remaining: team.purse_remaining,
            image: null
        });
        setShowModal(true);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);

    const handleDeleteClick = (team) => {
        setTeamToDelete(team);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!teamToDelete) return;
        try {
            await api.delete(`/teams/${teamToDelete.id}`);
            toast.success('Team deleted successfully');
            fetchTeams();
        } catch (error) {
            console.error("Failed to delete team", error);
            toast.error('Failed to delete team');
        }
        setDeleteModalOpen(false);
        setTeamToDelete(null);
    };

    const handleViewSquad = (team) => {
        setViewSquad(team);
    };

    return (
        <Layout>
            <div className="flex flex-col gap-4 mb-8">
                <Link to="/auctions" className="text-gray-500 hover:text-deep-blue flex items-center gap-2 w-fit">
                    <FiArrowLeft /> Back to Auctions
                </Link>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
                        {auction && <p className="text-gray-500">for {auction.name}</p>}
                    </div>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Search Teams..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-deep-blue"
                        />
                        {auction?.status === 'Upcoming' && (
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="flex items-center gap-2 bg-deep-blue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors shadow-md"
                            >
                                <FiPlus /> Add Team
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 text-center col-span-full">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <FiUsers className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Teams Found</h3>
                    <p className="text-gray-500 max-w-md">Add teams to this auction using the "Add Team" button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teams.map(team => (
                        <div
                            key={team.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 p-6 flex flex-col items-center text-center relative group"
                        >
                            <div className="absolute top-2 right-2 flex gap-1 hidden group-hover:flex">
                                {auction?.status === 'Upcoming' && (
                                    <>
                                        <button onClick={() => handleEdit(team)} className="text-gray-300 hover:text-blue-600 transition-colors">
                                            <FiEdit />
                                        </button>
                                        <button onClick={() => handleDeleteClick(team)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <FiTrash2 />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner">
                                {team.image_path ? (
                                    <img src={`http://localhost:5000/${team.image_path}`} className="w-full h-full object-cover" alt={team.name} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        <FiUsers className="text-3xl" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                            <span className="text-sm font-bold text-gold px-2 py-0.5 bg-deep-blue rounded mt-1">{team.short_name}</span>



                            <div className="mt-4 w-full grid grid-cols-2 gap-2 text-sm text-gray-600 border-t pt-4">
                                <div className="text-center">
                                    <p className="font-bold text-gray-800">{team.purse_remaining?.toLocaleString()}</p>
                                    <p className="text-xs">Purse Rem.</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-gray-800">{team.Players?.length || 0}<span className="text-gray-400">/{team.players_per_team}</span></p>
                                    <p className="text-xs">Inv. Usage</p>
                                </div>
                            </div>

                            {/* View Squad Button */}
                            < button
                                onClick={() => handleViewSquad(team)}
                                className="mt-4 w-full py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors"
                            >
                                View Squad
                            </button>
                        </div>
                    ))
                    }
                </div >
            )}

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
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
                )
            }

            {/* Squad Modal */}
            <AnimatePresence>
                {viewSquad && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-deep-blue to-blue-800 text-white p-6 relative flex-shrink-0">
                                <button onClick={() => setViewSquad(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20">
                                    <FiX size={20} />
                                </button>

                                <div className="flex flex-col md:flex-row gap-6 items-center md:items-end relative z-10">
                                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {viewSquad.image_path ? (
                                                <img src={`http://localhost:5000/${viewSquad.image_path}`} className="w-full h-full object-cover" alt={viewSquad.name} />
                                            ) : (
                                                <FiUsers className="text-gray-400 text-3xl" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h2 className="text-3xl font-black">{viewSquad.name}</h2>
                                        <div className="flex gap-4 mt-2 justify-center md:justify-start">
                                            <div className="bg-white/20 px-3 py-1 rounded text-sm font-bold">
                                                Funds Left: ₹{viewSquad.purse_remaining?.toLocaleString()}
                                            </div>
                                            <div className="bg-white/20 px-3 py-1 rounded text-sm font-bold">
                                                Squad: {viewSquad.Players?.length || 0}/{viewSquad.players_per_team}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 h-full w-1/3 opacity-5 pointer-events-none">
                                    {viewSquad.image_path && <img src={`http://localhost:5000/${viewSquad.image_path}`} className="w-full h-full object-cover" alt="" />}
                                </div>
                            </div>

                            {/* Players Grid */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                {viewSquad.Players && viewSquad.Players.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {viewSquad.Players.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => setInfoPlayer(p)}
                                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:-translate-y-1 hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                        {p.image_path ? (
                                                            <img src={`http://localhost:5000/${p.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt={p.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><FiUsers /></div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors" title={p.name}>{p.name}</h4>
                                                        <p className="text-xs text-blue-600 font-bold">{p.role}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">PID: {p.order_id || p.id}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sold For</span>
                                                    <span className="font-bold text-green-600">₹{p.sold_price?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <FiUsers size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No players purchased yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Team Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Team' : 'Add New Team'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <FiX className="text-2xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-4">
                                <div>
                                    <label className="label">Team Name *</label>
                                    <input required name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="e.g. Chennai Super Kings" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Team Short Name *</label>
                                        <input required name="short_name" value={formData.short_name} onChange={handleInputChange} className="input-field" placeholder="e.g. CSK" />
                                    </div>
                                    <div>
                                        <label className="label">Players Per Team *</label>
                                        <input required type="number" name="players_per_team" value={formData.players_per_team} onChange={handleInputChange} className="input-field" />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Team Image *</label>
                                    <input required={!isEdit} type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-deep-blue text-white rounded-lg hover:shadow-lg hover:bg-blue-900 transition-all">
                                        {isEdit ? 'Update Team' : 'Add Team'}
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
                title="Delete Team?"
                message={`Are you sure you want to delete "${teamToDelete?.name}"?`}
            />
        </Layout >
    );
};

export default Teams;
