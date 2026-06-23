import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { CanvasSize } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';

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
  const [isCreating, setIsCreating] = useState(false);
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

      <div className="bg-surface-dark-3 border border-gray-700/50 rounded-xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scaleIn relative z-10 border-t-white/10">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-surface-dark-4 to-surface-dark-3">
          <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center text-brand-600 shadow-[0_0_15px_rgba(125,42,232,0.2)]">
              <Icons.FolderPlus className="w-6 h-6" />
            </div>
            Create New Design
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icons.X className="w-6 h-6" />
          </Button>
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
                  disabled={isCreating}
                  onClick={() => { setIsCreating(true); onCreate(size); }}
                  className="flex items-center justify-between p-4 bg-surface-dark-2/50 border border-gray-800 rounded-xl hover:border-brand-600/50 hover:bg-surface-dark-4 transition-all group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-600 to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-brand-600 group-hover:bg-brand-600/10 transition-all">
                      {getIcon(size.icon)}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-white">{size.name}</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {size.width} × {size.height} px
                      </span>
                    </div>
                  </div>
                  {isCreating ? (
                    <svg className="w-4 h-4 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  ) : (
                    <Icons.Plus className="w-4 h-4 text-gray-700 group-hover:text-brand-600 transition-transform group-hover:rotate-90" />
                  )}
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
            <div className="flex-1 flex flex-col justify-between bg-surface-dark-2/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm shadow-inner">
              <div className="space-y-4">
                <div className="group">
                  <label
                    htmlFor="custom-design-name"
                    className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-brand-600 transition-colors"
                  >
                    Design Name
                  </label>
                  <div className="relative">
                    <Icons.Edit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-light group-focus-within:text-brand-600" />
                    <input
                      id="custom-design-name"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-600 transition-all"
                      placeholder="My Awesome Design"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="group">
                    <label
                      htmlFor="custom-width"
                      className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-brand-600 transition-colors"
                    >
                      Width (px)
                    </label>
                    <input
                      id="custom-width"
                      type="number"
                      min={1}
                      max={10000}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-600 transition-all"
                    />
                  </div>
                  <div className="group">
                    <label
                      htmlFor="custom-height"
                      className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-wider group-focus-within:text-brand-600 transition-colors"
                    >
                      Height (px)
                    </label>
                    <input
                      id="custom-height"
                      type="number"
                      min={1}
                      max={10000}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => { setIsCreating(true); handleCustomCreate(); }}
                  disabled={isCreating}
                  className="w-full group"
                >
                  {isCreating ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  ) : (
                    <Icons.Magic className="w-5 h-5 group-hover:animate-pulse" />
                  )}
                  Launch Editor
                </Button>
                <p className="text-[9px] text-center text-muted-light mt-4 font-bold uppercase tracking-[0.1em]">
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
