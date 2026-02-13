
import React, { useRef, useState } from 'react';
import { Icons } from '../../constants';

interface UploadsPanelProps {
  onFileUpload: (files: File[]) => void;
  uploads: string[];
  onAddImageLayer?: (src: string) => void;
  onDeleteUpload?: (index: number) => void;
}

export const UploadsPanel: React.FC<UploadsPanelProps> = ({
  onFileUpload,
  uploads,
  onAddImageLayer,
  onDeleteUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          validFiles.push(files[i]);
        }
      }
      if (validFiles.length > 0) onFileUpload(validFiles);
    }
  };

  // Note: For now filtering is local/placeholder based on simple string checks or just the 'All' state 
  // until we have real metadata.
  const filteredUploads = uploads;

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Uploads className="w-5 h-5 text-[#7d2ae8]" />
        Media Library
      </h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all mb-6 group bg-[#1e1e1e] ${isDragging
          ? 'border-[#7d2ae8] bg-[#7d2ae8]/10 scale-102'
          : 'border-gray-700 hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5'
          }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isDragging
          ? 'bg-[#7d2ae8] scale-110'
          : 'bg-gray-800 group-hover:scale-105'
          }`}>
          <Icons.Upload className={`w-5 h-5 ${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
        </div>
        <span className={`text-[11px] font-bold transition-colors ${isDragging ? 'text-[#7d2ae8]' : 'text-gray-300 group-hover:text-white'}`}>
          {isDragging ? 'Drop images here' : 'Upload Media'}
        </span>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              onFileUpload(files);
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Uploads</h4>
        <span className="text-[9px] text-gray-600 font-medium">{uploads.length} items</span>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
        {filteredUploads && filteredUploads.length > 0 ? (
          filteredUploads.map((url, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-lg border border-gray-800 overflow-hidden relative group cursor-pointer bg-[#1e1e1e] hover:border-[#7d2ae8] transition-all"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', url);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <img src={url} className="w-full h-full object-cover pointer-events-none" loading="lazy" />

              {/* Minimalist Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onAddImageLayer && onAddImageLayer(url)}
                  className="w-10 h-10 rounded-full bg-[#7d2ae8] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  title="Add to Canvas"
                >
                  <Icons.Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteUpload && onDeleteUpload(idx)}
                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl"
                  title="Remove"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-600 mt-10 flex flex-col items-center">
            <Icons.Image className="w-10 h-10 opacity-10 mb-2" />
            <p className="text-[10px] font-medium uppercase tracking-widest">No matching media</p>
          </div>
        )}
      </div>
    </div>
  );
};
