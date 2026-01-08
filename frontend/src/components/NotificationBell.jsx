import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheck, FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <FiCheckCircle className="text-green-500" />;
            case 'WARNING': return <FiAlertTriangle className="text-yellow-500" />;
            case 'ERROR': return <FiXCircle className="text-red-500" />;
            default: return <FiInfo className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
                <FiBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <h3 className="font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAsRead()}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <FiCheck /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`p-4 border-b border-gray-700/50 hover:bg-gray-800 transition-colors relative group ${!note.isRead ? 'bg-gray-800/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(note.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm ${!note.isRead ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                    {note.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(note.createdAt).toLocaleString()}
                                                </p>

                                                {note.link && (
                                                    <Link
                                                        to={note.link}
                                                        onClick={() => {
                                                            markAsRead(note.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="inline-block mt-2 text-xs text-blue-400 hover:underline"
                                                    >
                                                        View Details
                                                    </Link>
                                                )}
                                            </div>
                                            {!note.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Clicked Mark Read for:", note);
                                                        if (!note.id) console.error("NOTE ID IS MISSING:", note);
                                                        markAsRead(note.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-opacity"
                                                    title="Mark as read"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
