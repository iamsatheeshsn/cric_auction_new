import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiSend, FiMessageSquare, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBox = ({ auctionId }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!auctionId) return;

        // Join Room
        if (socket) {
            socket.emit('join_room', auctionId);
        }

        // Load history
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/${auctionId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load chat", err);
            }
        };

        fetchHistory();

        // Listen for new messages
        if (socket) {
            socket.on('receive_message', (msg) => {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            });
        }

        return () => {
            if (socket) socket.off('receive_message');
        };
    }, [auctionId, socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const msgData = {
            auctionId,
            userId: user.id,
            username: user.username,
            displayName: user.display_name || user.username,
            content: input
        };

        socket.emit('send_message', msgData);
        setInput('');
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
            >
                {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
                {!isOpen && <span className="font-bold hidden md:inline">Live Chat</span>}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl border border-gray-200 mt-4 w-80 md:w-96 flex flex-col overflow-hidden pointer-events-auto"
                        style={{ height: '500px' }}
                    >
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Auction Room Chat
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><FiMinimize2 /></button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 custom-scrollbar">
                            {messages.map((msg, index) => {
                                const isMe = user && msg.user_id === user.id;
                                return (
                                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}>
                                            {!isMe && <p className="text-[10px] font-bold text-gray-500 mb-0.5">{msg.User?.display_name || msg.User?.username || 'User'}</p>}
                                            <p>{msg.content}</p>
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-1 px-1">
                                            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Say something..."
                                className="flex-1 bg-gray-100 text-gray-800 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FiSend />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBox;
