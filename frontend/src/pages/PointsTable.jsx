import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { FiAward, FiActivity, FiFilter } from 'react-icons/fi';

const PointsTable = () => {
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState('');
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (selectedAuction) {
            fetchPointsTable(selectedAuction);
        }
    }, [selectedAuction]);

    const fetchAuctions = async () => {
        try {
            const res = await api.get('/auctions');
            if (res.data.auctions.length > 0) {
                setAuctions(res.data.auctions);
                // Ensure we only set if not already set, or force first one
                if (!selectedAuction) {
                    setSelectedAuction(res.data.auctions[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPointsTable = async (auctionId) => {
        setLoading(true);
        try {
            const res = await api.get(`/points/${auctionId}`);
            setTableData(res.data);
        } catch (err) {
            console.error("Points fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/60?text=Team';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-deep-blue flex items-center gap-3">
                        <FiAward className="text-yellow-500" /> Points Table
                    </h1>
                    <p className="text-gray-500 mt-1">Tournament Standings & Net Run Rates</p>
                </div>

                <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-80 shadow-sm"
                        value={selectedAuction}
                        onChange={(e) => setSelectedAuction(e.target.value)}
                    >
                        {auctions.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({new Date(a.auction_date).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-4 text-center w-16">Pos</th>
                                    <th className="p-4">Team</th>
                                    <th className="p-4 text-center">P</th>
                                    <th className="p-4 text-center">W</th>
                                    <th className="p-4 text-center">L</th>
                                    <th className="p-4 text-center">T</th>
                                    <th className="p-4 text-center">NR</th>
                                    <th className="p-4 text-center font-bold text-deep-blue text-sm">Pts</th>
                                    <th className="p-4 text-center">NRR</th>
                                    <th className="p-4 text-center">Form</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tableData.length > 0 ? tableData.map((team, index) => (
                                    <motion.tr
                                        key={team.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`hover:bg-blue-50/50 transition-colors ${index < 4 ? 'bg-gradient-to-r from-green-50/30 to-transparent' : ''}`}
                                    >
                                        <td className="p-4 text-center font-bold text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getImageUrl(team.logo)}
                                                        alt={team.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-bold text-gray-800">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-medium text-gray-600">{team.played}</td>
                                        <td className="p-4 text-center text-green-600 font-bold">{team.won}</td>
                                        <td className="p-4 text-center text-red-500">{team.lost}</td>
                                        <td className="p-4 text-center text-gray-500">{team.tied}</td>
                                        <td className="p-4 text-center text-gray-400">{team.nr}</td>
                                        <td className="p-4 text-center font-black text-xl text-deep-blue">{team.points}</td>
                                        <td className="p-4 text-center font-mono text-sm font-bold text-gray-600">{team.nrr > 0 ? '+' : ''}{team.nrr}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    // Placeholder for form. Future feature?
                                                    <div key={i} className={`w-2 h-2 rounded-full ${i < team.won ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                                                ))}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-gray-400">
                                            No matches completed for this tournament yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PointsTable;
