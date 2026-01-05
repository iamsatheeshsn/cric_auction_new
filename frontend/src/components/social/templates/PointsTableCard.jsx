import React from 'react';

const PointsTableCard = ({ data }) => {
    // data: { matchTitle, standings: [ { pos, team, p, w, l, pts, nrr } ] }
    const {
        matchTitle = "IPL 2024 - League Standings",
        date = new Date().toLocaleDateString(),
        standings = [
            { pos: 1, team: "RR", p: 8, w: 7, l: 1, pts: 14, nrr: "+0.698" },
            { pos: 2, team: "KKR", p: 7, w: 5, l: 2, pts: 10, nrr: "+1.206" },
            { pos: 3, team: "SRH", p: 7, w: 5, l: 2, pts: 10, nrr: "+0.914" },
            { pos: 4, team: "CSK", p: 7, w: 4, l: 3, pts: 8, nrr: "+0.529" },
            { pos: 5, team: "LSG", p: 8, w: 4, l: 4, pts: 8, nrr: "+0.123" },
        ],
        showQualifiers = false // Default to false to avoid showing Qs prematurely
    } = data || {};

    return (
        <div id="social-card-points" className="w-[1080px] min-h-[1080px] h-fit bg-slate-900 relative overflow-hidden flex flex-col text-white font-sans">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-900"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>

            {/* Gradient Glows */}
            <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[200px] opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-violet-600 rounded-full blur-[200px] opacity-20"></div>

            {/* Header */}
            <div className="relative z-10 px-16 pt-16 pb-8 flex justify-between items-end border-b border-white/5">
                <div>
                    <h3 className="text-5xl font-black uppercase italic tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Points Table</h3>
                    <p className="text-xl text-gray-400 tracking-widest uppercase">{matchTitle}</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-lg">
                    <span className="text-lg font-mono text-gray-300">Updated: {date}</span>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 relative z-10 p-16">
                <div className="w-full h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 bg-white/5 py-6 px-8 text-xl font-bold uppercase tracking-wider text-gray-400">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-4 pl-4">Team</div>
                        <div className="col-span-1 text-center">P</div>
                        <div className="col-span-1 text-center">W</div>
                        <div className="col-span-1 text-center">L</div>
                        <div className="col-span-2 text-center text-white">Pts</div>
                        <div className="col-span-2 text-right">NRR</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 flex flex-col justify-center gap-3 px-4 py-4">
                        {standings.map((team, index) => {
                            const isQualifying = showQualifiers && index < 4;
                            return (
                                <div key={index}
                                    className={`grid grid-cols-12 items-center py-4 px-6 rounded-xl border border-white/5 bg-white/5 flex-shrink-0 min-h-[100px] ${isQualifying ? 'ring-1 ring-blue-500/30 bg-gradient-to-r from-blue-500/10 to-transparent' : ''}`}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        <span className={`w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl ${isQualifying ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-gray-400'}`}>
                                            {team.pos || index + 1}
                                        </span>
                                    </div>
                                    <div className="col-span-4 pl-4 flex items-center gap-4 min-w-0">
                                        {/* Logo */}
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
                                            {team.logo ? (
                                                <img src={`http://localhost:5000/${team.logo}`} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            ) : (
                                                <span className="text-xs uppercase font-bold text-gray-500">Logo</span>
                                            )}
                                        </div>
                                        <span className="text-2xl font-bold uppercase tracking-tight leading-tight block w-full break-words" title={team.team}>{team.team}</span>
                                    </div>
                                    <div className="col-span-1 text-center text-3xl font-bold text-gray-300">{team.p}</div>
                                    <div className="col-span-1 text-center text-3xl font-bold text-green-400">{team.w}</div>
                                    <div className="col-span-1 text-center text-3xl font-bold text-red-400">{team.l}</div>
                                    <div className="col-span-2 text-center">
                                        <span className="text-4xl font-black text-white bg-white/10 px-4 py-1 rounded-lg shadow-inner">{team.pts}</span>
                                    </div>
                                    <div className="col-span-2 text-right text-2xl font-mono text-gray-300">{team.nrr}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PointsTableCard;
