import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, colorClass, borderClass, subText }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-between overflow-hidden transition-all duration-300 group`}
        >
            {/* Top Highlight Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${colorClass.replace('text-', 'bg-').split(' ')[0]} opacity-80`} />

            {/* Background Icon Watermark */}
            <div className={`absolute -right-6 -bottom-6 opacity-[0.08] transform rotate-12 scale-[2.5] transition-transform group-hover:scale-[3] group-hover:rotate-6 ${colorClass} grayscale group-hover:grayscale-0`}>
                <Icon />
            </div>

            <div className="z-10 relative">
                <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-2">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">{value}</h2>
                    {subText && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">{subText}</span>}
                </div>
            </div>

            <div className={`w-12 h-12 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('400', '900')} flex items-center justify-center ${colorClass} shadow-inner`}>
                <Icon size={24} />
            </div>
        </motion.div>
    );
};

export default StatsCard;
