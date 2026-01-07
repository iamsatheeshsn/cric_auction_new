import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPieChart, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PollDisplay = ({ auctionId }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [poll, setPoll] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!auctionId) return;

        // Fetch active poll on load
        const fetchPoll = async () => {
            try {
                const res = await api.get(`/polls/active/${auctionId}`);
                if (res.data) {
                    setPoll(res.data);
                    setIsVisible(true);
                    // Check if voted
                    const myVote = res.data.PollVotes?.find(v => v.user_id === user?.id);
                    if (myVote) setHasVoted(true);

                    // Init results
                    calculateResults(res.data.PollVotes || [], res.data.options);
                }
            } catch (err) {
                console.error("Poll fetch error", err);
            }
        };

        fetchPoll();

        if (socket) {
            socket.on('new_poll', (newPoll) => {
                setPoll(newPoll);
                setHasVoted(false);
                setResults([]);
                setIsVisible(true);
                toast.info("New Poll Live!");
            });

            socket.on('poll_updated', (data) => {
                if (poll && poll.id === data.pollId) {
                    // Update results
                    calculateResults(data.votes, poll.options);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('new_poll');
                socket.off('poll_updated');
            }
        };
    }, [auctionId, socket, user, poll]); // poll dep added to handle updates correctly

    const calculateResults = (votes, options) => {
        const total = votes.length;
        if (total === 0) {
            setResults(options.map(() => 0));
            return;
        }

        const counts = new Array(options.length).fill(0);
        votes.forEach(v => {
            if (counts[v.option_index] !== undefined) counts[v.option_index]++;
        });

        const percs = counts.map(c => Math.round((c / total) * 100));
        setResults(percs);
    };

    const handleVote = (index) => {
        if (!user) {
            toast.error("Login to vote");
            return;
        }

        socket.emit('submit_vote', {
            pollId: poll.id,
            userId: user.id,
            optionIndex: index,
            auctionId
        });
        setHasVoted(true);
    };

    if (!poll || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="fixed bottom-24 right-4 z-40 bg-white p-6 rounded-2xl shadow-xl border border-blue-100 max-w-xs w-full"
            >
                <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-slate-800 flex items-center gap-2">
                        <FiPieChart className="text-blue-600" />
                        Quick Poll
                    </h4>
                    <button onClick={() => setIsVisible(false)} className="text-gray-300 hover:text-red-500"><FiX /></button>
                </div>

                <p className="font-bold text-gray-700 mb-4 text-sm">{poll.question}</p>

                <div className="space-y-2">
                    {JSON.parse(poll.options).map((opt, idx) => (
                        <div key={idx} className="relative">
                            {hasVoted ? (
                                <div className="relative h-10 w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${results[idx] || 0}%` }}
                                        transition={{ duration: 1 }}
                                        className={`absolute top-0 left-0 h-full ${results[idx] > 50 ? 'bg-green-100' : 'bg-blue-50'}`}
                                    ></motion.div>
                                    <div className="absolute inset-0 flex items-center justify-between px-3">
                                        <span className="text-xs font-bold text-slate-700 z-10">{opt}</span>
                                        <span className="text-xs font-black text-slate-500 z-10">{results[idx] || 0}%</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleVote(idx)}
                                    className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-xs font-bold text-gray-600 flex justify-between group"
                                >
                                    {opt}
                                    <span className="opacity-0 group-hover:opacity-100 text-blue-500"><FiCheck /></span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {hasVoted && <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">Thanks for voting!</p>}
            </motion.div>
        </AnimatePresence>
    );
};

export default PollDisplay;
