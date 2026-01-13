
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useSponsors } from '../../context/SponsorContext';
import FileUploader from '../../components/common/FileUploader';
import { FiTrash2, FiMove, FiSave, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SponsorSettings = () => {
    const { sponsors, addSponsor, removeSponsor, updateSponsorOrder } = useSponsors();
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = ({ file, preview, name }) => {
        setUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            addSponsor({
                name: name.split('.')[0],
                logoUrl: preview
            });
            setUploading(false);
            toast.success("Sponsor logo added successfully!");
        }, 500);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to remove this sponsor?")) {
            removeSponsor(id);
            toast.info("Sponsor removed.");
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50 p-8 pb-32">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Sponsor Management</h1>
                            <p className="text-slate-500 font-medium mt-1">Manage partner logos for overlay and projector views.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Upload Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-4">Add New Sponsor</h3>
                                <FileUploader onFileSelect={handleFileSelect} label="Upload Logo (PNG/JPG)" />
                                {uploading && <p className="text-sm text-blue-500 mt-2 text-center animate-pulse">Processing...</p>}

                                <div className="mt-6 bg-blue-50 p-4 rounded-xl text-sm text-blue-700 flex items-start gap-3">
                                    <FiAlertCircle className="shrink-0 mt-0.5" />
                                    <p>Logos will be automatically resized for the overlay bar. Transparent PNGs work best.</p>
                                </div>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-6 flex items-center justify-between">
                                    <span>Active Sponsors ({sponsors.length})</span>
                                </h3>

                                {sponsors.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <p>No sponsors added yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {sponsors.map((sponsor, index) => (
                                            <div key={sponsor.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all">
                                                <div className="aspect-video bg-white rounded-lg flex items-center justify-center p-4 mb-3">
                                                    <img src={sponsor.logoUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-600 truncate px-1">{sponsor.name}</span>
                                                    <button
                                                        onClick={() => handleDelete(sponsor.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SponsorSettings;
