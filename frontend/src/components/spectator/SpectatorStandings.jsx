import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const SpectatorStandings = ({ auctionId }) => {
    const [points, setPoints] = useState([]);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const res = await api.get(`/points/${auctionId}`);
                setPoints(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPoints();
    }, [auctionId]);

    const getImageUrl = (path) => {
        if (!path) return 'https://placehold.co/400x400/1e293b/475569?text=Team';
        if (path.toString().startsWith('http')) return path;
        const normalizedPath = path.toString().replace(/\\/g, '/');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return `http://localhost:5000${cleanPath}`;
    };

    return (
        <div className="p-4 lg:p-8 overflow-y-auto h-full pb-20">
            <h2 className="text-2xl font-black uppercase text-white mb-6 tracking-wide border-l-4 border-gold pl-4">Points Table</h2>

            <div className="overflow-x-auto rounded-xl border border-white/10 shadow-2xl">
                <table className="w-full text-left text-sm lg:text-base">
                    <thead className="bg-slate-800 text-gold uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Pos</th>
                            <th className="px-6 py-4">Team</th>
                            <th className="px-6 py-4 text-center">P</th>
                            <th className="px-6 py-4 text-center">W</th>
                            <th className="px-6 py-4 text-center">L</th>
                            <th className="px-6 py-4 text-center">T</th>
                            <th className="px-6 py-4 text-center">NR</th>
                            <th className="px-6 py-4 text-right">NRR</th>
                            <th className="px-6 py-4 text-right">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-white/5">
                        {points.map((t, index) => (
                            <tr key={t.id} className="hover:bg-white/10 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-gray-400">#{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 p-1">
                                        <img src={getImageUrl(t.image_path || t.logo || t.logo_url)} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="hidden md:inline">{t.name}</span>
                                    <span className="md:hidden">{t.short_name}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-300">{t.played}</td>
                                <td className="px-6 py-4 text-center text-green-400 font-bold">{t.won}</td>
                                <td className="px-6 py-4 text-center text-red-400">{t.lost}</td>
                                <td className="px-6 py-4 text-center text-gray-400">{t.tied}</td>
                                <td className="px-6 py-4 text-center text-gray-400">{t.nr}</td>
                                <td className="px-6 py-4 text-right font-mono text-blue-300">{t.nrr}</td>
                                <td className="px-6 py-4 text-right font-bold text-xl text-white">{t.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {points.length === 0 && <div className="p-8 text-center text-gray-500">No standings available yet.</div>}
            </div>
        </div>
    );
};

export default SpectatorStandings;
