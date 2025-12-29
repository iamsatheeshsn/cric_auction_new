import React from 'react';

const WinProbability = ({ probability, team1, team2 }) => {
    // probability object: { team1: 50, team2: 50 }
    if (!probability) return null;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 mb-8">
            <h3 className="font-bold text-gray-700 dark:text-white mb-4 uppercase tracking-wide">Win Probability (WASP)</h3>

            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-blue-600 flex items-center justify-start pl-4 text-xs font-bold text-white transition-all duration-1000"
                    style={{ width: `${probability.team1}%` }}
                >
                    {probability.team1 > 10 && `${Math.round(probability.team1)}%`}
                </div>
                <div
                    className="h-full bg-orange-500 flex items-center justify-end pr-4 text-xs font-bold text-white transition-all duration-1000"
                    style={{ width: `${probability.team2}%` }}
                >
                    {probability.team2 > 10 && `${Math.round(probability.team2)}%`}
                </div>

                {/* Center Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white mix-blend-overlay"></div>
            </div>

            <div className="flex justify-between mt-2 text-sm font-bold text-gray-500">
                <span className="text-blue-600">{team1 || 'Team 1'}</span>
                <span className="text-orange-500">{team2 || 'Team 2'}</span>
            </div>
        </div>
    );
};

export default WinProbability;
