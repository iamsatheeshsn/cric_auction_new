import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FiDownload, FiImage, FiLayers, FiType, FiCalendar, FiUser, FiInfo, FiUploadCloud, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
import ManOfTheMatchCard from './templates/ManOfTheMatchCard';
import CenturyCard from './templates/CenturyCard';
import PointsTableCard from './templates/PointsTableCard';

/* Reusable Floating Label Input Component */
const FloatingInput = ({ label, name, value, onChange, type = "text" }) => (
    <div className="relative">
        <input
            type={type}
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
    const exportRef = useRef(null);
    const [template, setTemplate] = useState('mom');
    const [zoom, setZoom] = useState(0.45);

    // Default Data
    const [formData, setFormData] = useState({
        matchTitle: 'IPL 2024 - League Standings',
        playerName: 'Virat Kohli',
        teamName: 'Royal Challengers Bangalore',
        playerImage: 'https://via.placeholder.com/400x400?text=Player+Photo',
        runs: '82',
        balls: '50',
        wickets: '0',
        runsConceded: '0',
        fours: '10',
        sixes: '4',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        matchResult: 'RCB won by 6 wickets',
        standings: [
            { pos: 1, team: "RR", p: 8, w: 7, l: 1, pts: 14, nrr: "+0.69" },
            { pos: 2, team: "KKR", p: 7, w: 5, l: 2, pts: 10, nrr: "+1.20" },
            { pos: 3, team: "SRH", p: 7, w: 5, l: 2, pts: 10, nrr: "+0.91" },
            { pos: 4, team: "CSK", p: 7, w: 4, l: 3, pts: 8, nrr: "+0.52" },
            { pos: 5, team: "LSG", p: 8, w: 4, l: 4, pts: 8, nrr: "+0.12" },
        ]
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStandingsChange = (index, field, value) => {
        const newStandings = [...formData.standings];
        newStandings[index] = { ...newStandings[index], [field]: value };
        setFormData({ ...formData, standings: newStandings });
    };

    const handleAddTeam = () => {
        const newTeam = {
            pos: formData.standings.length + 1,
            team: "NEW TEAM",
            p: "0",
            w: "0",
            l: "0",
            pts: "0",
            nrr: "+0.00"
        };
        setFormData({ ...formData, standings: [...formData.standings, newTeam] });
    };

    const handleRemoveTeam = (index) => {
        const newStandings = formData.standings.filter((_, i) => i !== index);
        // Recalculate positions
        const reindexed = newStandings.map((t, i) => ({ ...t, pos: i + 1 }));
        setFormData({ ...formData, standings: reindexed });
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
        if (!exportRef.current) return;

        try {
            const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                allowTaint: true,
                logging: false,
                width: 1080,
                // height: null, // Let it adapt to content
                windowWidth: 1080
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

    // Helper to render the active template
    const renderTemplate = () => {
        switch (template) {
            case 'mom': return <ManOfTheMatchCard data={formData} />;
            case 'century': return <CenturyCard data={formData} />;
            case 'standings': return <PointsTableCard data={formData} />;
            default: return null;
        }
    };

    const renderInputs = () => {
        if (template === 'standings') {
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                        <FiList className="text-blue-500" /> Table Data
                    </div>
                    <FloatingInput name="matchTitle" label="League / Series Name" value={formData.matchTitle} onChange={handleChange} />

                    <div className="space-y-4">
                        {formData.standings.map((team, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Position {team.pos}</div>
                                    <button
                                        onClick={() => handleRemoveTeam(index)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Remove Team"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    <div className="col-span-2">
                                        <input className="w-full text-xs font-bold p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600" placeholder="Team" value={team.team} onChange={(e) => handleStandingsChange(index, 'team', e.target.value)} />
                                    </div>
                                    <input className="col-span-1 w-full text-xs font-bold p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-center" placeholder="P" value={team.p} onChange={(e) => handleStandingsChange(index, 'p', e.target.value)} />
                                    <input className="col-span-1 w-full text-xs font-bold p-2 text-green-600 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-center" placeholder="W" value={team.w} onChange={(e) => handleStandingsChange(index, 'w', e.target.value)} />
                                    <input className="col-span-1 w-full text-xs font-bold p-2 text-red-500 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-center" placeholder="L" value={team.l} onChange={(e) => handleStandingsChange(index, 'l', e.target.value)} />
                                    <input className="col-span-1 w-full text-xs font-black p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-center" placeholder="Pts" value={team.pts} onChange={(e) => handleStandingsChange(index, 'pts', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAddTeam}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-bold text-xs uppercase hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        <FiPlus /> Add Team Row
                    </button>
                </div>
            );
        }

        return (
            <>
                {/* Match Details Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                        <FiInfo className="text-blue-500" /> Match Information
                    </div>
                    <div className="space-y-3">
                        <FloatingInput name="matchTitle" label="Title / Series" value={formData.matchTitle} onChange={handleChange} />
                        {template === 'mom' && <FloatingInput name="matchResult" label="Result Summary" value={formData.matchResult} onChange={handleChange} />}
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
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest text-center border-b border-slate-200 dark:border-slate-700 pb-2">Performance Stats</label>
                            <div className="grid grid-cols-2 gap-4">
                                <FloatingInput name="runs" label="Runs" value={formData.runs} onChange={handleChange} />
                                <FloatingInput name="balls" label="Balls" value={formData.balls} onChange={handleChange} />
                                {template === 'mom' && (
                                    <>
                                        <FloatingInput name="wickets" label="Wickets" value={formData.wickets} onChange={handleChange} />
                                        <FloatingInput name="runsConceded" label="Runs Conc." value={formData.runsConceded} onChange={handleChange} />
                                    </>
                                )}
                                {template === 'century' && (
                                    <>
                                        <FloatingInput name="fours" label="Fours (4s)" value={formData.fours} onChange={handleChange} />
                                        <FloatingInput name="sixes" label="Sixes (6s)" value={formData.sixes} onChange={handleChange} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full font-sans text-slate-800 dark:text-gray-100">
            {/* Hidden Export Container - Always at 100% scale but height:auto for adaptable height */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '1080px', height: 'auto', overflow: 'hidden' }}>
                <div ref={exportRef}>
                    {renderTemplate()}
                </div>
            </div>

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
                            <button
                                onClick={() => setTemplate('century')}
                                className={`px-2 py-3 rounded-lg border text-sm font-bold transition-all ${template === 'century' ? 'border-blue-500 bg-white text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                            >
                                Century
                            </button>
                            <button
                                onClick={() => setTemplate('standings')}
                                className={`px-2 py-3 rounded-lg border text-sm font-bold transition-all ${template === 'standings' ? 'border-blue-500 bg-white text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 bg-slate-100 text-slate-500 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                            >
                                Standings
                            </button>
                        </div>
                    </div>

                    {renderInputs()}

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
                    <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                        {/* Scale wrapper */}
                        <div
                            className="transition-transform duration-200 shadow-2xl rounded-sm ring-1 ring-black/10 ease-out"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                        >
                            <div ref={cardRef}>
                                {renderTemplate()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Custom scrollbar or other global overrides if needed */
            `}</style>
        </div>
    );
};

export default SocialCardGenerator;
