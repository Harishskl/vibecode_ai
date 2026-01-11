import React, { useCallback, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndPassFile(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (validTypes.includes(file.type)) {
      onFileSelect(file);
    } else {
      alert("Unsupported file type. Please upload JPG, PNG, WEBP, MP4, or WebM.");
    }
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto border-2 border-dashed border-slate-700 hover:border-neon-blue rounded-xl p-8 transition-colors duration-300 bg-slate-900/50 cursor-pointer group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
        accept="image/*,video/*"
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="p-4 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors">
          <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Upload Media</h3>
          <p className="text-slate-400 text-sm mt-1">Drag & drop or click to upload</p>
          <p className="text-slate-500 text-xs mt-2">Supports JPG, PNG, WEBP, MP4</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;