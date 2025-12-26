import React from 'react';

// Color Palette
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const DonutChart = ({ data, size = 200 }) => {
    if (!data || data.length === 0) {
        return <div className="text-gray-400 text-sm italic">No data available</div>;
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    // Prevent divide by zero if total is 0
    if (total === 0) {
        return <div className="text-gray-400 text-sm italic flex items-center justify-center h-full">No data to display</div>;
    }

    let cumulativeAngle = 0;

    const createArc = (startAngle, endAngle) => {
        const radius = size / 2;
        const innerRadius = radius * 0.6;
        const x1 = radius + radius * Math.cos(startAngle);
        const y1 = radius + radius * Math.sin(startAngle);
        const x2 = radius + radius * Math.cos(endAngle);
        const y2 = radius + radius * Math.sin(endAngle);

        const innerX1 = radius + innerRadius * Math.cos(startAngle);
        const innerY1 = radius + innerRadius * Math.sin(startAngle);
        const innerX2 = radius + innerRadius * Math.cos(endAngle);
        const innerY2 = radius + innerRadius * Math.sin(endAngle);

        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1} Z`;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 bg-gray-50/50 p-4 rounded-xl">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 drop-shadow-sm">
                {data.map((item, index) => {
                    const angle = (item.value / total) * 2 * Math.PI;
                    const endAngle = cumulativeAngle + angle;
                    const path = createArc(cumulativeAngle, endAngle);
                    cumulativeAngle = endAngle;

                    return (
                        <path
                            key={index}
                            d={path}
                            fill={COLORS[index % COLORS.length]}
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer hover:scale-105 transform origin-center"
                        >
                            <title>{item.name}: {item.value}</title>
                        </path>
                    );
                })}
                {/* Center Text (Optional: Total) */}
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-gray-700 pointer-events-none">
                    {total}
                </text>
            </svg>
            <div className="flex flex-col gap-3 min-w-[120px]">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <div className="flex flex-col leading-none">
                            <span className="text-xs text-gray-500 font-medium">{item.name}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-gray-800">{item.value}</span>
                                <span className="text-[10px] text-gray-400">({((item.value / total) * 100).toFixed(1)}%)</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const BarChart = ({ data, height = 200 }) => {
    if (!data || data.length === 0) {
        return <div className="text-gray-400 text-sm italic">No data available</div>;
    }

    // Prevent divide by zero if maxVal is 0
    const maxVal = Math.max(...data.map(d => d.value)) || 1;

    return (
        <div className="flex items-end gap-4 h-full w-full" style={{ height: `${height}px` }}>
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.name}: {item.value.toLocaleString()}
                    </div>

                    <div
                        className="w-full bg-deep-blue rounded-t-lg transition-all duration-500 hover:bg-blue-600 relative overflow-hidden"
                        style={{ height: `${(item.value / maxVal) * 100}%` }}
                    >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-gray-700 truncate w-20">{item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{(item.value / 100000).toFixed(1)}L</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
