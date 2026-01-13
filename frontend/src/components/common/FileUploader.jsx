
import React, { useCallback } from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';

const FileUploader = ({ onFileSelect, accept = "image/*", label = "Drop image here or click to upload" }) => {

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            onFileSelect({
                file,
                preview: reader.result,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 pointer-events-none">
                <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <FiUploadCloud size={24} />
                </div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-slate-300">Supports PNG, JPG, GIF (Max 2MB)</p>
            </div>
        </div>
    );
};

export default FileUploader;
