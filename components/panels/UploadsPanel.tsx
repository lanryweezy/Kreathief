import React, { useRef, useState } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useFileHandler } from '../../hooks/useFileHandler';
import { generateLayerId } from '../../utils/layers/layerUtils';
import { EmptyState } from '../EmptyState';
import { log } from '../../utils/log';
import { parsePsdToLayers } from '../../services/psdService';

interface UploadsPanelProps {}

export const UploadsPanel: React.FC<UploadsPanelProps> = () => {
  const addLayer = useStore((state) => state.addLayer);
  const onAddLayers = useStore((state) => state.addLayers);
  const canvasSize = useStore((state) => state.canvasSize);
  const uploads = useStore((state) => state.uploads);
  const { handleFileUploads } = useFileHandler();
  const deleteUpload = useStore((state) => state.deleteUpload);

  const onAddImageLayer = (src: string) => {
    addLayer({
      id: generateLayerId('image'),
      type: 'image',
      name: 'Image Layer',
      src,
      x: canvasSize.width / 2 - 150,
      y: canvasSize.height / 2 - 150,
      width: 300,
      height: 300,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
      skewX: 0,
      skewY: 0,
    });
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const psdInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingPsd, setIsParsingPsd] = useState(false);

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
      const psdFiles: File[] = [];
      const imageFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        if (files[i].name.toLowerCase().endsWith('.psd')) {
          psdFiles.push(files[i]);
        } else if (files[i].type.startsWith('image/')) {
          imageFiles.push(files[i]);
        }
      }

      if (imageFiles.length > 0) {
        handleFileUploads(imageFiles);
      }
      if (psdFiles.length > 0) {
        handlePsdFiles(psdFiles);
      }
    }
  };

  const handlePsdFiles = async (files: File[]) => {
    if (!onAddLayers) {
      return;
    }
    setIsParsingPsd(true);
    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const layers = await parsePsdToLayers(buffer);
        if (layers.length > 0) {
          onAddLayers(layers);
        }
      }
    } catch (err) {
      log.error('[UploadsPanel] PSD Import failed', err);
      alert('Failed to parse PSD file.');
    } finally {
      setIsParsingPsd(false);
    }
  };

  const filteredUploads = uploads;

  return (
    <div className="flex flex-col h-full bg-[#13161a] p-4 overflow-hidden">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Icons.Uploads className="w-5 h-5 text-[#7d2ae8]" />
        Media Library
      </h3>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {/* Standard Image Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all group bg-[#1e1e1e] ${
            isDragging
              ? 'border-[#7d2ae8] bg-[#7d2ae8]/10'
              : 'border-gray-700 hover:border-[#7d2ae8] hover:bg-[#7d2ae8]/5'
          }`}
        >
          <Icons.Upload
            className={`w-5 h-5 mb-2 ${isDragging ? 'text-[#7d2ae8]' : 'text-gray-400 group-hover:text-white'}`}
          />
          <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">Upload Media</span>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFileUploads(Array.from(e.target.files))}
          />
        </div>

        {/* PSD Import Button */}
        <button
          onClick={() => psdInputRef.current?.click()}
          disabled={isParsingPsd}
          className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 transition-all group disabled:opacity-50"
        >
          {isParsingPsd ? (
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          ) : (
            <Icons.Layout className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          )}
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-bold text-white leading-none">Import PSD Template</span>
            <span className="text-[9px] text-blue-300 opacity-60">Layers, Text & Images</span>
          </div>
          <input
            type="file"
            ref={psdInputRef}
            className="hidden"
            accept=".psd"
            onChange={(e) => e.target.files && handlePsdFiles(Array.from(e.target.files))}
          />
        </button>
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onAddImageLayer && onAddImageLayer(url)}
                  className="w-8 h-8 rounded-full bg-[#7d2ae8] text-white flex items-center justify-center hover:scale-110 shadow-xl"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteUpload && deleteUpload(idx)}
                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-600 mt-4">
            <EmptyState
              icon={Icons.Image}
              title="No uploads yet"
              description="Drag and drop or click to upload your media here."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadsPanel;
