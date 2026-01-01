import React from 'react';

const CenturyCard = ({ data }) => {
    // data: { matchTitle, playerImage, playerName, teamName, runs, balls, four, six, date, matchResult }
    const {
        matchTitle = "IPL 2024",
        playerImage = "https://via.placeholder.com/400x400?text=Player",
        playerName = "Player Name",
        teamName = "Team Name",
        runs = "100",
        balls = "50",
        fours = "10",
        sixes = "4",
        date = "Oct 24, 2024"
    } = data || {};

    return (
        <div id="social-card-century" className="w-[1080px] h-[1080px] bg-slate-900 relative overflow-hidden flex flex-col text-white font-sans">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#2a1b05] to-slate-900"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            {/* Gold Accents */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-600 rounded-full blur-[180px] opacity-20 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600 rounded-full blur-[150px] opacity-20 -translate-x-1/3 translate-y-1/3"></div>

            {/* Header */}
            <div className="relative z-10 px-12 pt-12 flex justify-between items-start">
                <div className="max-w-xl">
                    <h3 className="text-3xl font-bold text-gray-400 uppercase tracking-widest mb-1">{matchTitle}</h3>
                    <p className="text-xl text-yellow-600 font-semibold">{date}</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 px-8 py-2 transform -skew-x-12 shadow-lg border-2 border-yellow-200">
                        <span className="text-4xl font-black uppercase tracking-widest text-black transform skew-x-12 inline-block">Century Alert</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-center">

                {/* Massive Score Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-white/[0.03] leading-none select-none z-0">
                    {runs}
                </div>

                {/* Player Image */}
                <div className="w-full h-[650px] relative z-20 flex justify-center items-end mt-12">
                    <img
                        src={playerImage}
                        alt={playerName}
                        className="h-full object-cover drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                        }}
                    />
                </div>

                {/* Player Info */}
                <div className="absolute bottom-52 z-30 text-center w-full px-12 flex flex-col items-center gap-6">
                    <h1 className="text-7xl font-black uppercase italic tracking-tighter drop-shadow-2xl leading-tight text-white mb-2">
                        {playerName}
                    </h1>
                    <p className="text-2xl font-bold text-yellow-500 uppercase tracking-[0.3em] bg-black/50 inline-block px-12 py-3 rounded-full border border-yellow-500/30 backdrop-blur-md">
                        {teamName}
                    </p>
                </div>
            </div>

            {/* Footer Stats Grid */}
            <div className="relative z-40 bg-black/40 backdrop-blur-xl border-t border-white/5 h-48 grid grid-cols-4 divide-x divide-white/10">
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl text-gray-400 uppercase font-bold tracking-widest mb-2">Runs</span>
                    <span className="text-7xl font-black text-yellow-400">{runs}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl text-gray-400 uppercase font-bold tracking-widest mb-2">Balls</span>
                    <span className="text-7xl font-black text-white">{balls}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl text-gray-400 uppercase font-bold tracking-widest mb-2">4s</span>
                    <span className="text-7xl font-black text-white">{fours}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl text-gray-400 uppercase font-bold tracking-widest mb-2">6s</span>
                    <span className="text-7xl font-black text-white">{sixes}</span>
                </div>
            </div>
        </div>
    );
};

export default CenturyCard;
