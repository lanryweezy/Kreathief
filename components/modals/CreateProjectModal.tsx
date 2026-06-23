import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { CanvasSize } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (size: CanvasSize, initialState?: any) => void;
}

const PRESET_SIZES: (CanvasSize & { icon: string })[] = [
  { width: 1080, height: 1080, name: 'Instagram Post', icon: 'Instagram' },
  { width: 1080, height: 1920, name: 'Story / Reel', icon: 'Smartphone' },
  { width: 1280, height: 720, name: 'YouTube Thumbnail', icon: 'Youtube' },
  { width: 1920, height: 1080, name: 'Presentation', icon: 'Monitor' },
  { width: 1200, height: 630, name: 'Facebook Post', icon: 'Facebook' },
  { width: 1500, height: 500, name: 'Twitter Header', icon: 'Twitter' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1080');
  const [customName, setCustomName] = useState('Untitled Design');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleCustomCreate = () => {
    onCreate({
      width: parseInt(customWidth) || 1080,
      height: parseInt(customHeight) || 1080,
      name: customName || 'Custom Design',
    });
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Magic;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fadeIn" onClick={onClose} />

      <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scaleIn relative z-10 border-t-white/10">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-[#252627] to-[#1e1e1e]">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 bg-[#7d2ae8]/20 rounded-xl flex items-center justify-center text-[#7d2ae8] shadow-[0_0_15px_rgba(125,42,232,0.2)]">
              <Icons.FolderPlus className="w-6 h-6" />
            </div>
            Create New Design
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Presets */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Popular Presets</h3>
              <div className="h-px flex-1 bg-gray-800 ml-4"></div>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {PRESET_SIZES.map((size) => (
                <button
                  key={size.name}
                  onClick={() => onCreate(size)}
                  className="flex items-center justify-between p-4 bg-[#13161a]/50 border border-gray-800 rounded-2xl hover:border-[#7d2ae8]/50 hover:bg-[#252627] transition-all group overflow-hidden relative"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#7d2ae8] to-[#00c4cc] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-[#7d2ae8] group-hover:bg-[#7d2ae8]/10 transition-all">
                      {getIcon(size.icon)}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-white">{size.name}</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {size.width} × {size.height} px
                      </span>
                    </div>
                  </div>
                  <Icons.Plus className="w-4 h-4 text-gray-700 group-hover:text-[#7d2ae8] transition-transform group-hover:rotate-90" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Custom Setup</h3>
              <div className="h-px flex-1 bg-gray-800 ml-4"></div>
            </div>
            <div className="flex-1 flex flex-col justify-between bg-[#13161a]/50 p-6 rounded-3xl border border-gray-800 backdrop-blur-sm shadow-inner">
              <div className="space-y-4">
                <div className="group">
                  <label
                    htmlFor="custom-design-name"
                    className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-[#7d2ae8] transition-colors"
                  >
                    Design Name
                  </label>
                  <div className="relative">
                    <Icons.Edit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#7d2ae8]" />
                    <input
                      id="custom-design-name"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8] transition-all"
                      placeholder="My Awesome Design"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label
                      htmlFor="custom-width"
                      className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-[#7d2ae8] transition-colors"
                    >
                      Width (px)
                    </label>
                    <input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8] transition-all"
                    />
                  </div>
                  <div className="group">
                    <label
                      htmlFor="custom-height"
                      className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-[#7d2ae8] transition-colors"
                    >
                      Height (px)
                    </label>
                    <input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7d2ae8] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCustomCreate}
                  className="w-full bg-gradient-to-r from-[#7d2ae8] to-[#6b23c5] hover:to-[#5a1bb0] text-white py-4 rounded-2xl font-black shadow-[0_10px_30px_rgba(125,42,232,0.3)] transition-all transform hover:-translate-y-1 active:translate-y-0.5 active:shadow-inner flex items-center justify-center gap-2 group"
                >
                  <Icons.Magic className="w-5 h-5 group-hover:animate-pulse" />
                  Launch Editor
                </button>
                <p className="text-[9px] text-center text-gray-600 mt-4 font-bold uppercase tracking-[0.1em]">
                  Unleash your creativity with AI-powered tools
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
