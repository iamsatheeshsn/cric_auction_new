import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FiDownload, FiImage, FiLayers, FiType, FiCalendar, FiUser, FiInfo, FiUploadCloud } from 'react-icons/fi';
import ManOfTheMatchCard from './templates/ManOfTheMatchCard';

/* Reusable Floating Label Input Component */
const FloatingInput = ({ label, name, value, onChange }) => (
    <div className="relative">
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="block px-4 pb-2.5 pt-5 w-full text-sm font-bold text-slate-800 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer transition-all shadow-sm"
            placeholder=" "
        />
        <label
            htmlFor={name}
            className="absolute text-xs font-bold text-slate-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none uppercase tracking-wider"
        >
            {label}
        </label>
    </div>
);

const SocialCardGenerator = () => {
    const cardRef = useRef(null);
    const [template, setTemplate] = useState('mom');
    const [zoom, setZoom] = useState(0.45);

    // Default Data
    const [formData, setFormData] = useState({
        matchTitle: 'IPL 2024 - Match 12',
        playerName: 'Virat Kohli',
        teamName: 'Royal Challengers Bangalore',
        playerImage: 'https://via.placeholder.com/400x400?text=Player+Photo',
        runs: '82',
        balls: '50',
        wickets: '0',
        runsConceded: '0',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        matchResult: 'RCB won by 6 wickets'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, playerImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                allowTaint: true
            });

            const link = document.createElement('a');
            link.download = `SocialCard-${template}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Image generation failed:", err);
            alert("Failed to generate image. Try using a local image if this persists.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full font-sans text-slate-800 dark:text-gray-100">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-[400px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-80px)] shadow-2xl relative z-20">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-slate-800 dark:text-white">
                        <span className="p-2 bg-blue-600 rounded-lg text-white"><FiImage /></span>
                        Social <span className="text-blue-600">Studio</span>
                    </h2>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/50 dark:bg-slate-900/50">

                    {/* Template Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Style</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTemplate('mom')}
                                className={`px-2 py-3 rounded-lg border text-sm font-bold transition-all ${template === 'mom' ? 'border-blue-500 bg-white text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                            >
                                POTM
                            </button>
                            <button disabled className="px-2 py-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-300 text-sm font-bold cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-600">
                                Century
                            </button>
                            <button disabled className="px-2 py-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-300 text-sm font-bold cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-600">
                                Standings
                            </button>
                        </div>
                    </div>

                    {/* Match Details Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                            <FiInfo className="text-blue-500" /> Match Information
                        </div>

                        <div className="space-y-3">
                            <FloatingInput name="matchTitle" label="Title / Series" value={formData.matchTitle} onChange={handleChange} />
                            <FloatingInput name="matchResult" label="Result Summary" value={formData.matchResult} onChange={handleChange} />
                            <FloatingInput name="date" label="Date" value={formData.date} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Player Stats Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                            <FiUser className="text-blue-500" /> Player Spotlight
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                <FloatingInput name="playerName" label="Player Name" value={formData.playerName} onChange={handleChange} />
                                <FloatingInput name="teamName" label="Team Name" value={formData.teamName} onChange={handleChange} />
                            </div>

                            {/* Image Upload */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Player Photo</label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
                                    <label htmlFor="img-upload" className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all bg-white dark:bg-slate-800 group-hover:shadow-md">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                            <FiUploadCloud className="text-2xl text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to Upload PNG</span>
                                        <span className="text-[10px] text-slate-400 mt-1">Supports transparent images</span>
                                    </label>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest text-center border-b border-slate-100 dark:border-slate-700 pb-2">Performance Stats</label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <div className="text-center relative">
                                        <input name="runs" value={formData.runs} onChange={handleChange} className="input-stat" placeholder="0" />
                                        <div className="stat-label">Runs</div>
                                    </div>
                                    <div className="text-center relative">
                                        <input name="balls" value={formData.balls} onChange={handleChange} className="input-stat" placeholder="0" />
                                        <div className="stat-label">Balls</div>
                                    </div>
                                    <div className="text-center relative">
                                        <input name="wickets" value={formData.wickets} onChange={handleChange} className="input-stat" placeholder="0" />
                                        <div className="stat-label">Wickets</div>
                                    </div>
                                    <div className="text-center relative">
                                        <input name="runsConceded" value={formData.runsConceded} onChange={handleChange} className="input-stat" placeholder="0" />
                                        <div className="stat-label">Runs Conc.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <button
                        onClick={handleDownload}
                        className="w-full bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]"
                    >
                        <FiDownload className="text-lg" />
                        <span>Download High-Res</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Exported as 2160x2160 PNG</p>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-100 dark:bg-[#0f172a] relative overflow-hidden flex flex-col pt-4 pr-4 pb-4">
                <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner relative overflow-hidden flex flex-col">
                    {/* Texture Background */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    {/* Toolbar */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Preview
                        </div>

                        <div className="pointer-events-auto flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase">Zoom</div>
                            <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-8 text-right">
                                {Math.round(zoom * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
                        {/* Scale wrapper */}
                        <div
                            className="transition-transform duration-200 shadow-2xl rounded-sm ring-1 ring-black/10 ease-out"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                        >
                            <div ref={cardRef}>
                                {template === 'mom' && <ManOfTheMatchCard data={formData} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .input-stat {
                    @apply w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-black rounded-lg px-2 py-3 text-2xl font-black text-center outline-none transition-all text-slate-800 dark:text-white shadow-inner;
                }
                .stat-label {
                    @apply text-[10px] font-bold text-slate-400 uppercase mt-1.5;
                }
            `}</style>
        </div>
    );
};

export default SocialCardGenerator;
