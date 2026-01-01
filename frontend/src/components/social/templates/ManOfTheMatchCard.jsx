import React from 'react';

const ManOfTheMatchCard = ({ data }) => {
    // data: { matchTitle, playerImage, playerName, teamName, runs, balls, wickets, runsConceded, date, matchResult }
    const {
        matchTitle = "IPL 2024 - Match 5",
        playerImage = "https://via.placeholder.com/400x400?text=Player",
        playerName = "Virat Kohli",
        teamName = "Royal Challengers Bangalore",
        runs = "82",
        balls = "54",
        wickets = "0",
        runsConceded = "0",
        date = "Oct 24, 2024",
        matchResult = "RCB won by 6 wickets"
    } = data || {};

    return (
        <div id="social-card-mom" className="w-[1080px] h-[1080px] bg-slate-900 relative overflow-hidden flex flex-col text-white font-sans">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-900"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* Accent Shapes */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500 rounded-full blur-[150px] opacity-20 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-x-1/3 translate-y-1/3"></div>

            {/* Header */}
            <div className="relative z-10 px-12 pt-12 flex justify-between items-start">
                <div className="max-w-xl">
                    <h3 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest mb-2 leading-tight">{matchTitle}</h3>
                    <p className="text-xl text-gray-400">{date}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shrink-0 ml-4">
                    <span className="text-2xl font-black uppercase tracking-wider">Man of the Match</span>
                </div>
            </div>

            {/* Main Content - Player Image & Stats */}
            <div className="flex-1 relative z-10 flex items-end justify-center pb-0">
                <img
                    src={playerImage}
                    alt={playerName}
                    className="h-[800px] object-cover object-bottom drop-shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                    }}
                />

                {/* Name Overlay */}
                <div className="absolute bottom-64 text-center w-full z-30 px-12 flex flex-col items-center gap-6">
                    <h1 className="text-7xl font-black uppercase italic tracking-tighter drop-shadow-2xl leading-tight">
                        {playerName.split(' ').map((n, i) => (
                            <span key={i} className={i === 1 ? "text-yellow-500 block" : "block"}>{n}</span>
                        ))}
                    </h1>
                    <p className="text-2xl font-bold text-gray-300 uppercase tracking-widest bg-black/40 inline-block px-8 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                        {teamName}
                    </p>
                </div>
            </div>

            {/* Footer Stats Strip */}
            <div className="relative z-40 bg-white/10 backdrop-blur-xl border-t border-white/10 h-48 flex items-center justify-between px-16 gap-8">
                <div className="flex items-center gap-12 flex-1">
                    {/* Batting Stat */}
                    {(runs !== "0" || runs === "0" && balls !== "0") && (
                        <div className="text-center min-w-[150px]">
                            <p className="text-xl font-bold text-gray-400 uppercase tracking-wider mb-1">Runs</p>
                            <p className="text-6xl font-black text-white leading-none">{runs}<span className="text-3xl text-gray-500 ml-1">({balls})</span></p>
                        </div>
                    )}

                    {/* Divider if both exist */}
                    {(runs !== "0" && wickets !== "0") && <div className="w-px h-24 bg-white/20"></div>}

                    {/* Bowling Stat */}
                    {(wickets !== "0" || runsConceded !== "0") && (
                        <div className="text-center min-w-[150px]">
                            <p className="text-xl font-bold text-gray-400 uppercase tracking-wider mb-1">Figures</p>
                            <p className="text-6xl font-black text-white leading-none">{wickets}<span className="text-3xl text-gray-500 ml-1">/{runsConceded}</span></p>
                        </div>
                    )}
                </div>

                {/* Match Result */}
                <div className="text-right max-w-sm">
                    <p className="text-lg font-bold text-yellow-500 uppercase tracking-widest mb-2 border-b-2 border-yellow-500 inline-block pb-1">Match Result</p>
                    <p className="text-2xl font-bold text-white leading-snug">{matchResult}</p>
                </div>
            </div>
        </div>
    );
};

export default ManOfTheMatchCard;
