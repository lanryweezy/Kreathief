
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { Dropdown } from './Dropdown';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  documentColors?: string[];
  label?: string;
  small?: boolean;
}

const DEFAULT_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
  '#C0C0C0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080',
  '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6',
  '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  documentColors = [],
  label,
  small
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const popoverRef = useRef<HTMLButtonElement>(null);

  // Load recent colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kreathief_recent_colors');
    if (saved) {
      try {
        setRecentColors(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent colors', e);
      }
    }
  }, []);

  const addToRecent = (color: string) => {
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 10);
    setRecentColors(updated);
    localStorage.setItem('kreathief_recent_colors', JSON.stringify(updated));
  };

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      onChange(e.target.value);
      addToRecent(e.target.value);
    }
  };

  const uniqueDocColors = Array.from(new Set(documentColors)).slice(0, 14);

  return (
    <div className="relative group">
      {label && <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">{label}</span>}
      <button
        ref={popoverRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${small ? 'w-6 h-6' : 'w-8 h-8'} rounded border border-gray-600 flex items-center justify-center relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM0NDQiLz48cGF0aCBkPSJNMCAwSDRWNEgwem00IDhIOFY0SDR6IiBmaWxsPSIjNTU1Ii8+PC9zdmc+')] hover:border-gray-400 transition-colors shadow-sm`}
      >
        <div className="w-full h-full" style={{ backgroundColor: value }} />
      </button>
      <Dropdown
        anchorRef={popoverRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        align="left"
      >
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl p-3 w-64 animate-fadeIn">
          {/* No Fill & Hex Input */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { onChange('transparent'); setHexInput('transparent'); }}
              className={`flex-1 h-9 rounded border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${value === 'transparent' ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
              title="No Fill"
            >
              <Icons.Slash className="w-3 h-3" />
              None
            </button>
            <div className="relative flex-[1.5]">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">#</span>
              <input
                type="text"
                value={hexInput === 'transparent' ? '' : hexInput.replace('#', '')}
                onChange={(e) => handleHexChange({ ...e, target: { ...e.target, value: '#' + e.target.value } })}
                placeholder="HEX"
                className="w-full bg-[#252627] border border-gray-600 rounded pl-5 pr-2 py-2 text-xs text-white uppercase focus:border-[#7d2ae8] outline-none font-mono"
              />
            </div>
            <div className="w-9 h-9 rounded border border-gray-600 relative overflow-hidden group">
              <input
                type="color"
                value={value === 'transparent' ? '#ffffff' : value}
                onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value); addToRecent(e.target.value); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM0NDQiLz48cGF0aCBkPSJNMCAwSDRWNEgwem00IDhIOFY0SDR6IiBmaWxsPSIjNTU1Ii8+PC9zdmc+')]">
                <div className="w-full h-full" style={{ backgroundColor: value === 'transparent' ? 'transparent' : value }} />
              </div>
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                Recent Colors
                <button
                  onClick={() => { setRecentColors([]); localStorage.removeItem('kreathief_recent_colors'); }}
                  className="text-[8px] hover:text-red-400"
                >
                  Clear
                </button>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {recentColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onChange(color); setHexInput(color); }}
                    className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Document Colors */}
          {uniqueDocColors.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Document Colors</h5>
              <div className="flex flex-wrap gap-1.5">
                {uniqueDocColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onChange(color); setHexInput(color); addToRecent(color); }}
                    className="w-5 h-5 rounded-full border border-white/10 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default Palette */}
          <div>
            <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Default Colors</h5>
            <div className="grid grid-cols-8 gap-1.5">
              {DEFAULT_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => { onChange(color); setHexInput(color); addToRecent(color); }}
                  className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};
