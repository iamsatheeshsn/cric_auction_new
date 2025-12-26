import React from 'react';

const Logo = ({ className = "w-10 h-10", textClassName = "text-xl", vertical = false }) => {
    return (
        <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-3`}>
            <svg
                viewBox="0 0 100 100"
                className={className}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="45%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                    <linearGradient id="blackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1f2937" />
                        <stop offset="100%" stopColor="#000000" />
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* Outer Ring */}
                <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" filter="url(#shadow)" />
                <circle cx="50" cy="50" r="41" fill="url(#blackGradient)" />

                {/* Stumps / Wickets */}
                <rect x="38" y="25" width="4" height="40" rx="1" fill="#e5e7eb" opacity="0.8" />
                <rect x="48" y="25" width="4" height="40" rx="1" fill="#e5e7eb" opacity="0.9" />
                <rect x="58" y="25" width="4" height="40" rx="1" fill="#e5e7eb" opacity="0.8" />

                {/* Bails */}
                <path d="M38 23 h11 v2 h-11 z" fill="#d1d5db" />
                <path d="M51 23 h11 v2 h-11 z" fill="#d1d5db" />

                {/* Gavel Head */}
                <path
                    d="M25 55 L75 55 L80 45 L20 45 Z"
                    fill="url(#goldGradient)"
                    stroke="#78350f"
                    strokeWidth="1"
                />
                <rect x="45" y="50" width="10" height="35" rx="2" fill="#92400e" />

                {/* Cricket Ball */}
                <circle cx="50" cy="70" r="10" fill="#dc2626" stroke="white" strokeWidth="1" />
                <path d="M42 66 Q50 74 58 66" stroke="white" strokeWidth="1" fill="none" opacity="0.8" />

            </svg>
            <h1 className={`font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase ${textClassName} drop-shadow-sm`}>
                Cric<span className="text-white">Auction</span>
            </h1>
        </div>
    );
};

export default Logo;
