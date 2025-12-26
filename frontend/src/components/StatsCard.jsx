import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, colorClass, borderClass, subText }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderClass} flex items-center justify-between relative overflow-hidden group`}
        >
            {/* Background Icon Watermark */}
            <div className={`absolute -right-4 -bottom-4 opacity-5 transform rotate-12 scale-150 transition-transform group-hover:scale-175 ${colorClass}`}>
                <Icon size={100} />
            </div>

            <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
                    {subText && <span className="text-xs text-gray-400 font-medium">{subText}</span>}
                </div>
            </div>

            <div className={`w-12 h-12 rounded-full ${colorClass.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center ${colorClass}`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
};

export default StatsCard;
