import React, { useRef, useState } from 'react';
import { Upload, FileImage, FileVideo } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300
        flex flex-col items-center justify-center gap-4
        ${
          isDragging
            ? 'border-[#e6e0d4] bg-[#2a2a2a]'
            : 'border-[#444] hover:border-[#666] bg-[#111]'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
        accept="image/*,video/*"
      />
      
      <div className={`p-4 rounded-full ${isDragging ? 'bg-[#333]' : 'bg-[#1a1a1a]'}`}>
        <Upload size={32} className="text-[#e6e0d4]" />
      </div>
      
      <div className="text-center px-4">
        <h3 className="text-lg font-bold text-[#e6e0d4] mb-1">
          Upload Image or Video
        </h3>
        <p className="text-sm text-gray-500 font-mono">
          Drag & drop or click to browse
        </p>
      </div>

      <div className="flex gap-4 text-xs text-gray-600 font-mono mt-2">
        <span className="flex items-center gap-1">
            <FileImage size={12} /> JPG, PNG, WEBP
        </span>
        <span className="flex items-center gap-1">
            <FileVideo size={12} /> MP4, WEBM
        </span>
      </div>
    </div>
  );
};
