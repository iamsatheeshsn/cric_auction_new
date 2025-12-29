import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';
import { FiPieChart } from 'react-icons/fi';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [allPlayers, setAllPlayers] = useState([]);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const res = await api.get('/auctions');
                setAuctions(res.data.auctions || []);
                // Default to first active/upcoming auction if available, else first one
                if (res.data.auctions && res.data.auctions.length > 0) {
                    if (!selectedAuction) {
                        setSelectedAuction(res.data.auctions[0].id);
                    }
                }
            } catch (err) {
                console.error("Fetch Auctions Failed", err);
            }
        };
        fetchAuctions();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const query = selectedAuction ? `?auction_id=${selectedAuction}` : '';
                const res = await api.get(`/analytics${query}`);
                setData(res.data);
            } catch (err) {
                console.error("Fetch Analytics Failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        setCurrentPage(1); // Reset to page 1 when filter changes
    }, [selectedAuction]);

    useEffect(() => {
        if (selectedAuction) {
            // Fetch all players (disable/max limit) for analytics calculations
            api.get(`/players/auction/${selectedAuction}?limit=1000`).then(res => {
                setAllPlayers(res.data.players || []);
            });
        }
    }, [selectedAuction]);

    if (loading) return <Layout><div className="flex justify-center p-12">Loading Analytics...</div></Layout>;
    if (!data) return <Layout><div className="flex justify-center p-12 text-red-500">Failed to load data.</div></Layout>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    // Prepare data for Budget Pie Chart (Total Spent vs Remaining)
    const totalBudget = data.budgetStats.reduce((sum, item) => sum + item.budget, 0);
    const totalSpent = data.budgetStats.reduce((sum, item) => sum + item.spent, 0);
    const budgetPieData = [
        { name: 'Spent', value: totalSpent },
        { name: 'Remaining', value: totalBudget - totalSpent }
    ];

    // Pagination Logic
    const sortedTeams = [...data.budgetStats].sort((a, b) => b.spent - a.spent);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeams = sortedTeams.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedTeams.length / itemsPerPage);

    // Heatmap Logic
    const roles = ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];
    // We need to construct a matrix: Team vs Role counts. 
    // Assuming data.teamRoleStats exists or we derive it.
    // The current backend might not send this. I'll check if we can derive from budgetStats if it has nested info, 
    // or I might need to fetch players to build this matrix client-side.
    // For now, I'll add a fetchPlayers state to build this matrix.



    const getTeamRoleCount = (teamId, role) => {
        return allPlayers.filter(p => p.team_id == teamId && p.role?.trim() === role).length;
    };

    const handleExport = () => {
        import('../utils/ReportGenerator')
            .then(({ generateAuctionReport }) => {
                const auctionName = auctions.find(a => a.id === parseInt(selectedAuction))?.name || 'Auction';
                generateAuctionReport(auctionName, sortedTeams, allPlayers);
            })
            .catch(error => {
                console.error("Export Failed", error);
                // Assuming you have toast imported or just alert
                alert("Failed to generate report. Please check console.");
            });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-deep-blue">Auction Analytics</h1>
                    <p className="text-gray-500">Deep dive into auction spending and strategies</p>
                </div>
                <div className="w-full md:w-auto flex gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                        Download Report
                    </button>
                    <select
                        value={selectedAuction}
                        onChange={(e) => setSelectedAuction(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-deep-blue bg-white font-medium text-gray-700 dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                    >
                        {auctions.map(auction => (
                            <option key={auction.id} value={auction.id}>
                                {auction.name} ({new Date(auction.auction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Budget Utilization Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-6">
                        <FiPieChart className="text-blue-500" /> Total Budget Utilization
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={budgetPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {budgetPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#FF8042', '#00C49F'][index]} />
                                    ))}
                                </Pie>
                                <ReTooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-6">
                        <FiPieChart className="text-orange-500" /> Player Roles
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.roleStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="role"
                                >
                                    {data.roleStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <ReTooltip formatter={(value) => `${value} Players`} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Team Balance Heatmap */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <FiPieChart className="text-red-500" /> Squad Balance Heatmap
                    </h3>
                </div>
                <div className="p-6 overflow-x-auto">
                    <div className="grid grid-cols-5 gap-1 min-w-[600px]">
                        {/* Header Row */}
                        <div className="p-2 font-bold text-gray-500 dark:text-gray-400">Team</div>
                        {roles.map(r => <div key={r} className="p-2 font-bold text-gray-500 dark:text-gray-400 text-center">{r}</div>)}

                        {/* Data Rows */}
                        {sortedTeams.map(team => (
                            <React.Fragment key={team.id}>
                                <div className="p-2 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 border-t border-gray-100 dark:border-white/5">
                                    <span className="truncate">{team.full_name}</span>
                                </div>
                                {roles.map(role => {
                                    const count = getTeamRoleCount(team.id, role);
                                    // Intensity Color Logic
                                    let bgClass = 'bg-gray-50 dark:bg-white/5';
                                    if (count > 0) bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                                    if (count >= 3) bgClass = 'bg-blue-100 dark:bg-blue-900/40';
                                    if (count >= 5) bgClass = 'bg-blue-200 dark:bg-blue-900/60';
                                    if (count >= 7) bgClass = 'bg-blue-300 dark:bg-blue-900/80';

                                    return (
                                        <div key={role} className={`p-2 flex items-center justify-center border-t border-gray-100 dark:border-white/5 ${bgClass}`}>
                                            <span className="font-mono font-bold text-deep-blue dark:text-blue-300">{count}</span>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team Details Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Team Financials</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-6 py-4">Team</th>
                                <th className="px-6 py-4 text-right">Total Purse</th>
                                <th className="px-6 py-4 text-right">Spent</th>
                                <th className="px-6 py-4 text-right">Remaining</th>
                                <th className="px-6 py-4 text-center">% Used</th>
                                <th className="px-6 py-4 text-center">Players</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentTeams.map((team) => {
                                const percent = ((team.spent / team.budget) * 100).toFixed(1);
                                return (
                                    <tr key={team.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                                            {team.image_path && (
                                                <img
                                                    src={`http://localhost:5000/${team.image_path.replace(/\\/g, '/')}`}
                                                    alt={team.full_name}
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                />
                                            )}
                                            {team.full_name}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">₹{team.budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">₹{team.spent.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-green-600">₹{team.remaining.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${parseFloat(percent) > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold w-10 text-right">{percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold">{team.playerCount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedTeams.length)} of {sortedTeams.length} entries
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md text-sm font-bold ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-3 py-1 rounded-md text-sm font-bold ${currentPage === i + 1 ? 'bg-deep-blue text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md text-sm font-bold ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout >
    );
};

export default Analytics;
