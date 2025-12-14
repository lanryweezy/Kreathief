
import React, { useRef } from 'react';
import { Icons } from '../../constants';

interface UploadsPanelProps {
  onFileUpload: (file: File) => void;
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

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4">
       <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Uploads className="w-5 h-5 text-[#7d2ae8]" />
        Media Library
      </h3>

       <div 
         onClick={() => fileInputRef.current?.click()}
         className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5 transition-colors mb-6 group bg-[#1e1e1e]"
       >
         <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Icons.Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
         </div>
         <span className="text-xs font-bold text-gray-300 group-hover:text-white">Upload Media</span>
         <span className="text-[10px] text-gray-500 mt-1">Drag & drop or click</span>
         <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
               if (e.target.files && e.target.files.length > 0) {
                  onFileUpload(e.target.files[0]);
               }
            }}
         />
       </div>
       
       <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase">Recent</h4>
          <span className="text-[10px] text-gray-600">{uploads.length} items</span>
       </div>
       
       <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 pb-10">
          {uploads && uploads.length > 0 ? (
            uploads.map((url, idx) => (
                <div 
                  key={idx}
                  className="aspect-square rounded-lg border border-gray-700 overflow-hidden relative group cursor-pointer bg-[#1e1e1e] hover:border-[#7d2ae8] transition-all"
                  draggable
                  onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', url);
                      e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                   <img src={url} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                   
                   {/* Hover Overlay */}
                   <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-3">
                      <button 
                        onClick={() => onAddImageLayer && onAddImageLayer(url)}
                        className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white text-[10px] py-2 px-3 rounded w-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                      >
                        Add to Canvas
                      </button>
                      <button 
                        onClick={() => onDeleteUpload && onDeleteUpload(idx)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] py-2 px-3 rounded w-full flex items-center justify-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform delay-75"
                      >
                        <Icons.Trash className="w-3 h-3" /> Remove
                      </button>
                   </div>
                </div>
            ))
          ) : (
             <div className="col-span-2 text-center text-gray-500 mt-10 flex flex-col items-center">
                <Icons.Image className="w-10 h-10 opacity-20 mb-2" />
                <p className="text-xs">No uploads yet</p>
             </div>
          )}
       </div>
    </div>
  );
};
