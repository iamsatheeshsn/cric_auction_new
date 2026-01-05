
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiShare2 } from 'react-icons/fi';
import html2canvas from 'html2canvas';

const ShareCardModal = ({ isOpen, onClose, title, children }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // Wait for images to load if any (safety delay)
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                useCORS: true, // For external images
                backgroundColor: null, // Transparent if needed, or specific color
                logging: false,
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${title.replace(/\s+/g, '_')}_ShareCard.png`;
            link.click();
        } catch (error) {
            console.error("Error generating share card:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-white/10"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-gray-800/50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FiShare2 className="text-blue-400" />
                                {title}
                            </h3>
                            <button onClick={onClose} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
                                <FiX />
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 overflow-auto bg-black/50 p-8 flex items-center justify-center">
                            {/* The Card Container - Scaled down for preview if needed, but rendered full size for capture */}
                            {/* We use specific transform to fit it on screen but capture full resolution */}
                            <div className="relative transform origin-top md:scale-75 lg:scale-90 xl:scale-100 transition-transform">
                                <div ref={cardRef} className="shadow-2xl shadow-black">
                                    {children}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-gray-800/50 rounded-b-2xl flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl text-gray-300 font-bold hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FiDownload className="text-xl" />
                                        Download Image
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareCardModal;
