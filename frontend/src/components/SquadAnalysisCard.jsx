import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const SquadAnalysisCard = ({ team }) => {
    const { teamName, roles, ratings, insights } = team;

    // Data for Pie Chart
    const data = [
        { name: 'Batsman', value: roles.batsman },
        { name: 'Bowler', value: roles.bowler },
        { name: 'All Rounder', value: roles.allRounder },
        { name: 'Wicket Keeper', value: roles.wicketKeeper },
    ].filter(d => d.value > 0);

    const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

    const getInsightIcon = (type) => {
        switch (type) {
            case 'strength': return <FiCheckCircle className="text-green-500" />;
            case 'weakness': return <FiAlertCircle className="text-red-500" />;
            case 'warning': return <FiAlertTriangle className="text-yellow-500" />;
            default: return <FiCheckCircle className="text-blue-500" />;
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 8) return 'bg-green-500';
        if (rating >= 5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                {team.teamImage && (
                    <img
                        src={`http://localhost:5000/${team.teamImage.replace(/\\/g, '/')}`}
                        alt={teamName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                )}
                <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate">{teamName}</h3>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-6">

                {/* Available Roles Pie Chart */}
                <div className="h-40 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} Players`} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-gray-400">Roles</span>
                    </div>
                </div>

                {/* Ratings */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-600 dark:text-gray-300">Batting Strength</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{ratings.batting}/10</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getRatingColor(ratings.batting)}`}
                                style={{ width: `${ratings.batting * 10}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-600 dark:text-gray-300">Bowling Depth</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{ratings.bowling}/10</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getRatingColor(ratings.bowling)}`}
                                style={{ width: `${ratings.bowling * 10}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Key Insights</h4>
                    {insights.length > 0 ? (
                        <ul className="space-y-2">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="mt-0.5 shrink-0">{getInsightIcon(insight.type)}</span>
                                    <span>{insight.text}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 italic">No specific insights generated.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SquadAnalysisCard;
