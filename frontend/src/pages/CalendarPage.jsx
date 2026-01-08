import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaTrophy, FaGavel, FaMapMarkerAlt, FaClock, FaCrown, FaCheckCircle } from 'react-icons/fa';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredEvent, setHoveredEvent] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/calendar');
                setEvents(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching calendar events:", error);
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const renderCalendarGrid = () => {
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const days = [];
        const today = new Date();

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[140px] bg-white/5 rounded-2xl opacity-30"></div>);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const currentLoopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const isToday = today.getDate() === i && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

            const daysEvents = events.filter(e => {
                const eventDate = new Date(e.start);
                return eventDate.getDate() === i && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
            });

            const isHoveredDay = daysEvents.some(e => e.id === hoveredEvent);

            days.push(
                <motion.div
                    key={i}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    className={`min-h-[140px] p-3 rounded-2xl relative transition-all duration-300 backdrop-blur-md border 
                        ${isHoveredDay ? 'z-50' : 'z-0'}
                        ${isToday
                            ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50 shadow-neon-blue'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                >
                    {/* Date Number */}
                    <div className={`flex justify-between items-start mb-2`}>
                        <span className={`text-lg font-bold font-mono ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                            {String(i).padStart(2, '0')}
                        </span>
                        {isToday && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    </div>

                    {/* Events List */}
                    <div className="space-y-2">
                        {daysEvents.map(event => (
                            <motion.div
                                key={event.id}
                                layoutId={event.id}
                                onMouseEnter={() => setHoveredEvent(event.id)}
                                onMouseLeave={() => setHoveredEvent(null)}
                                className={`group relative p-2 rounded-xl border text-xs cursor-pointer shadow-lg backdrop-blur-sm transition-all duration-300
                                    ${hoveredEvent === event.id ? 'z-[60]' : 'z-auto'}
                                    ${event.type === 'auction'
                                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-100 hover:border-amber-400/60'
                                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-100 hover:border-emerald-400/60'
                                    }`}
                            >
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${event.type === 'auction' ? 'from-amber-400/10' : 'from-emerald-400/10'} to-transparent`} />

                                <div className="relative flex items-center gap-2">
                                    {/* Logos */}
                                    <div className="flex-shrink-0 flex -space-x-2 overflow-hidden">
                                        {event.type === 'auction' ? (
                                            event.image ? (
                                                <img
                                                    src={`http://localhost:5000/${event.image.replace(/\\/g, '/')}`}
                                                    alt="Auction"
                                                    className="w-6 h-6 rounded-full object-cover border-2 border-amber-500/50"
                                                />
                                            ) : (
                                                <div className={`p-1.5 rounded-lg bg-amber-500/20 text-amber-400`}>
                                                    <FaGavel />
                                                </div>
                                            )
                                        ) : (
                                            // Match Logos
                                            <>
                                                {/* Team 1 */}
                                                <div className="relative">
                                                    {event.details?.team1_logo ? (
                                                        <img
                                                            src={`http://localhost:5000/${event.details.team1_logo.replace(/\\/g, '/')}`}
                                                            alt="T1"
                                                            className={`w-6 h-6 rounded-full object-cover border-2 ${event.status === 'Completed' && event.details.winner_id === event.details.team1_id ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'border-emerald-500/50'} relative z-10`}
                                                        />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full bg-emerald-800 flex items-center justify-center text-[10px] border-2 ${event.status === 'Completed' && event.details.winner_id === event.details.team1_id ? 'border-yellow-400 shadow-neon-gold' : 'border-emerald-500/50'} relative z-10`}>T1</div>
                                                    )}
                                                    {event.status === 'Completed' && event.details.winner_id === event.details.team1_id && (
                                                        <div className="absolute -top-2 -left-1 text-yellow-400 z-20 drop-shadow-md transform -rotate-12">
                                                            <FaCrown size={10} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Team 2 */}
                                                <div className="relative -ml-2">
                                                    {event.details?.team2_logo ? (
                                                        <img
                                                            src={`http://localhost:5000/${event.details.team2_logo.replace(/\\/g, '/')}`}
                                                            alt="T2"
                                                            className={`w-6 h-6 rounded-full object-cover border-2 ${event.status === 'Completed' && event.details.winner_id === event.details.team2_id ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] z-20' : 'border-emerald-500/50 z-0'}`}
                                                        />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full bg-emerald-800 flex items-center justify-center text-[10px] border-2 ${event.status === 'Completed' && event.details.winner_id === event.details.team2_id ? 'border-yellow-400 shadow-neon-gold z-20' : 'border-emerald-500/50 z-0'}`}>T2</div>
                                                    )}
                                                    {event.status === 'Completed' && event.details.winner_id === event.details.team2_id && (
                                                        <div className="absolute -top-2 -right-1 text-yellow-400 z-30 drop-shadow-md transform rotate-12">
                                                            <FaCrown size={10} />
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="truncate font-medium flex-1 text-[11px] leading-tight flex items-center gap-1">
                                        <span className="truncate">{event.title}</span>
                                        {event.status === 'Completed' && (
                                            <FaCheckCircle className="text-emerald-400 flex-shrink-0" size={10} title="Completed" />
                                        )}
                                    </div>
                                </div>

                                {/* Tooltip Popover (Simulated with absolute positioning) */}
                                <AnimatePresence>
                                    {hoveredEvent === event.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute left-0 right-0 top-full mt-2 z-50 p-3 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl text-left"
                                            style={{ minWidth: '200px' }}
                                        >
                                            <h4 className="font-bold text-white mb-2">{event.title}</h4>

                                            {/* Winner / Result Display for Completed Matches */}
                                            {event.status === 'Completed' && event.details.winner_id && (
                                                <div className="flex gap-4 mb-3 pb-3 border-b border-white/10 items-center">
                                                    {/* Winner Image Container */}
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-amber-600 shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                                                            <img
                                                                src={`http://localhost:5000/${(event.details.winner_id === event.details.team1_id ? event.details.team1_logo : event.details.team2_logo)?.replace(/\\/g, '/')}`}
                                                                alt="Winner"
                                                                className="w-full h-full rounded-full object-cover border-2 border-gray-900"
                                                            />
                                                        </div>
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-lg filters drop-shadow-lg animate-bounce z-20">
                                                            <FaCrown size={16} />
                                                        </div>
                                                    </div>

                                                    {/* Winner Text Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <FaTrophy className="text-yellow-400 text-[10px]" />
                                                            <span className="text-[10px] font-bold text-yellow-400 tracking-wider uppercase">Winner</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-white leading-tight break-words">
                                                            {event.details.result || "Match Completed"}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1 text-gray-400 text-[10px] uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <FaMapMarkerAlt className="text-blue-400" /> {event.details?.venue || event.details?.place || 'TBA'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaClock className="text-blue-400" /> {event.status}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
            {/* Rich Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative z-10 p-8 h-screen flex flex-col">
                {/* Header */}
                <header className="flex justify-between items-end mb-8 px-2">
                    <div>
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight"
                        >
                            CALENDAR
                        </motion.h1>
                        <motion.p
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-blue-400 font-medium tracking-widest uppercase text-sm mt-1"
                        >
                            Matches & Auctions Schedule
                        </motion.p>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
                        <button onClick={prevMonth} className="p-3 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all active:scale-95">
                            <FaChevronLeft size={18} />
                        </button>
                        <h2 className="text-2xl font-bold text-white min-w-[200px] text-center font-mono">
                            {monthNames[currentDate.getMonth()]} <span className="text-gray-500">{currentDate.getFullYear()}</span>
                        </h2>
                        <button onClick={nextMonth} className="p-3 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all active:scale-95">
                            <FaChevronRight size={18} />
                        </button>
                    </div>
                </header>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-4 mb-4 px-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-[0.2em] py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentDate.toString()}
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="grid grid-cols-7 gap-4"
                        >
                            {loading ? (
                                <div className="col-span-7 h-96 flex flex-col items-center justify-center text-white/30">
                                    <FaCalendarAlt size={48} className="mb-4 animate-bounce" />
                                    <div className="text-xl font-light tracking-wide">Loading Schedule...</div>
                                </div>
                            ) : renderCalendarGrid()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
