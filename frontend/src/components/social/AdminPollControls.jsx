import React, { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminPollControls = ({ auctionId }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    if (!user || user.role !== 'admin') return null;

    const addOption = () => {
        if (options.length < 4) setOptions([...options, '']);
    };

    const removeOption = (idx) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== idx));
        }
    };

    const handleOptionChange = (txt, idx) => {
        const newOpts = [...options];
        newOpts[idx] = txt;
        setOptions(newOpts);
    };

    const createPoll = () => {
        if (!question.trim()) return toast.error("Enter question");
        if (options.some(o => !o.trim())) return toast.error("Fill all options");

        socket.emit('create_poll', {
            auctionId,
            question,
            options: options, // backend model expects JSON string or array depending on config, let's send array, model is JSON type
            userId: user.id
        });
        toast.success("Poll Launched!");
        setQuestion('');
        setOptions(['', '']);
    };

    return (
        <div className="bg-slate-800 p-4 rounded-2xl mb-6 border border-slate-700">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">📊</span> Admin Controls: Create Poll
            </h4>

            <input
                type="text"
                placeholder="Poll Question?"
                className="w-full bg-slate-700 text-white rounded-xl p-3 mb-3 text-sm font-bold placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                value={question}
                onChange={e => setQuestion(e.target.value)}
            />

            <div className="space-y-2 mb-3">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 bg-slate-700 text-white rounded-lg p-2 text-sm border border-slate-600 outline-none"
                            value={opt}
                            onChange={e => handleOptionChange(e.target.value, idx)}
                        />
                        {options.length > 2 && (
                            <button onClick={() => removeOption(idx)} className="text-red-400 hover:bg-slate-700 p-2 rounded-lg">
                                <FiTrash2 />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                {options.length < 4 && (
                    <button onClick={addOption} className="bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-600 flex items-center gap-1">
                        <FiPlus /> Option
                    </button>
                )}
                <button
                    onClick={createPoll}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                >
                    Launch Poll Now
                </button>
            </div>
        </div>
    );
};

export default AdminPollControls;
