
import React from 'react';

const MatchSummaryCard = ({ data }) => {
    // data: { matchTitle, team1, team2, result, mvp }
    // team: { name, score, wickets, overs, logo/color }
    const {
        matchTitle = "Match 12 - League Stage",
        date = new Date().toDateString(),
        team1 = { name: "RCB", score: 212, wickets: 4, overs: 20 },
        team2 = { name: "CSK", score: 190, wickets: 8, overs: 20 },
        result = "RCB won by 22 runs",
        mvp = { name: "Virat Kohli", stats: "82 (50) & 1 Catch" }
    } = data || {};

    return (
        <div id="social-card-summary" className="w-[1080px] h-[1080px] bg-slate-900 relative overflow-hidden flex flex-col items-center justify-between text-white font-sans p-12">

            {/* Background Details */}
            <div className="absolute inset-0 bg-slate-900"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-900/40 to-transparent"></div>

            {/* Glows */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[150px] opacity-20"></div>

            {/* Header */}
            <div className="z-10 text-center space-y-2 mt-8">
                <h3 className="text-3xl uppercase tracking-widest text-gray-400 font-bold">{matchTitle}</h3>
                <p className="text-gray-500 font-mono text-lg">{date}</p>
            </div>

            {/* Scoreboard Area */}
            <div className="z-10 flex items-center justify-center w-full gap-16">

                {/* Team 1 */}
                <div className="flex flex-col items-center gap-6">
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
                        {/* Placeholder for Logo */}
                        <span className="text-6xl font-black text-white/20">{team1.name?.substring(0, 1)}</span>
                    </div>
                    <div className="text-center w-64">
                        <h2 className="text-4xl font-black text-white mb-2 leading-tight break-words">{team1.name}</h2>
                        <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/10 inline-block">
                            <span className="text-5xl font-bold font-mono">{team1.score}/{team1.wickets}</span>
                            <span className="text-xl text-gray-400 ml-2">({team1.overs})</span>
                        </div>
                    </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                    <span className="text-7xl font-black text-white/10 italic">VS</span>
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center gap-6">
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
                        <span className="text-6xl font-black text-white/20">{team2.name?.substring(0, 1)}</span>
                    </div>
                    <div className="text-center w-64">
                        <h2 className="text-4xl font-black text-white mb-2 leading-tight break-words">{team2.name}</h2>
                        <div className="bg-white/10 px-6 py-2 rounded-2xl border border-white/10 inline-block">
                            <span className="text-5xl font-bold font-mono">{team2.score}/{team2.wickets}</span>
                            <span className="text-xl text-gray-400 ml-2">({team2.overs})</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Result Tag */}
            <div className="z-10 bg-white text-slate-900 px-12 py-4 rounded-full shadow-2xl shadow-blue-500/20 transform -rotate-1">
                <h2 className="text-4xl font-black uppercase tracking-tight">{result}</h2>
            </div>

            {/* MVP Section */}
            <div className="z-10 w-full mb-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg shadow-yellow-500/20">
                            MVP
                        </div>
                        <div>
                            <h4 className="text-3xl font-bold text-white mb-1">{mvp.name}</h4>
                            <p className="text-xl text-yellow-400 font-mono">{mvp.stats}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 uppercase tracking-widest text-sm">Player of the Match</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MatchSummaryCard;
