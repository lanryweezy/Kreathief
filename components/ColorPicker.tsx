
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { Dropdown } from './Dropdown';
import { ColorHarmonyGenerator } from './panels/ColorHarmonyGenerator';
import { PaletteGenerator } from './panels/PaletteGenerator';
import { GradientEditor } from './panels/GradientEditor';
import { ContrastChecker } from './panels/ContrastChecker';
import { rgbToHex } from '../utils/colorUtils';

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

export const ColorPicker: React.FC<ColorPickerProps> = React.memo(({
  value,
  onChange,
  documentColors = [],
  label,
  small
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showEyedropper, setShowEyedropper] = useState(false);
  const [activeTab, setActiveTab] = useState<'picker' | 'harmony' | 'palette' | 'gradient' | 'contrast'>('picker');
  const addToast = useStore((state) => state.addToast);
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
    let val = e.target.value;
    // Auto-fix missing # for #14 on change
    if (val.length > 0 && !val.startsWith('#')) {
      val = '#' + val;
    }
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      onChange(val);
      addToRecent(val);
    }
  };

  const copyToClipboard = () => {
    // Click-to-copy hex for #15
    navigator.clipboard.writeText(value).then(() => {
      addToast('Color copied to clipboard', 'success');
    });
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
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl p-3 w-80 animate-fadeIn">
          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-[#0e1318] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('picker')}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === 'picker'
                  ? 'bg-[#7d2ae8] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Picker
            </button>
            <button
              onClick={() => setActiveTab('harmony')}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === 'harmony'
                  ? 'bg-[#7d2ae8] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Harmony
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === 'palette'
                  ? 'bg-[#7d2ae8] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Palette
            </button>
            <button
              onClick={() => setActiveTab('gradient')}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === 'gradient'
                  ? 'bg-[#7d2ae8] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Gradient
            </button>
            <button
              onClick={() => setActiveTab('contrast')}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === 'contrast'
                  ? 'bg-[#7d2ae8] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Contrast
            </button>
          </div>

          {activeTab === 'picker' && (
            <>
          {/* Eyedropper Button */}
          <div className="mb-3">
            <button
              onClick={() => { setShowEyedropper(true); setIsOpen(false); }}
              className="w-full px-3 py-2 bg-[#252627] hover:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <Icons.EyeDropper className="w-4 h-4" />
              Pick Color from Screen
            </button>
          </div>

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
              <button 
                onClick={copyToClipboard}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs hover:text-[#7d2ae8] transition-colors"
                title="Copy Hex"
              >
                #
              </button>
              <input
                type="text"
                value={hexInput === 'transparent' ? '' : hexInput.replace('#', '')}
                onChange={handleHexChange}
                onBlur={(e) => {
                  let val = e.target.value;
                  if (val && !val.startsWith('#')) {val = '#' + val;}
                  if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                    setHexInput(val);
                    onChange(val);
                  }
                }}
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
            </>
          )}

          {activeTab === 'harmony' && (
            <ColorHarmonyGenerator
              baseColor={value === 'transparent' ? '#7d2ae8' : value}
              onColorSelect={(color) => {
                onChange(color);
                setHexInput(color);
                addToRecent(color);
                setActiveTab('picker');
              }}
            />
          )}

          {activeTab === 'palette' && (
            <PaletteGenerator
              onPaletteSelect={(colors) => {
                colors.forEach(color => addToRecent(color));
                setActiveTab('picker');
              }}
            />
          )}

          {activeTab === 'gradient' && (
            <GradientEditor
              onChange={(gradient) => {
                const gradientStr = gradient.type === 'linear'
                  ? `linear-gradient(${gradient.angle}deg, ${gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                  : `radial-gradient(circle, ${gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`;
                // Store gradient as special value (full gradient support would be in layer properties)
                addToast(`Gradient created: ${gradient.stops.length} stops`, 'success');
              }}
            />
          )}

          {activeTab === 'contrast' && (
            <ContrastChecker
              backgroundColor={value === 'transparent' ? '#7d2ae8' : value}
              onBackgroundChange={(color) => {
                onChange(color);
                setHexInput(color);
                addToRecent(color);
              }}
            />
          )}
        </div>
      </Dropdown>

      {/* Eyedropper Overlay */}
      {showEyedropper && (
        <div
          className="fixed inset-0 z-[9999] cursor-crosshair"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const style = window.getComputedStyle(target);
            const bgColor = style.backgroundColor;
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              // Try to extract RGB from rgba
              const rgbMatch = bgColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
              if (rgbMatch) {
                const hex = rgbToHex(
                  parseInt(rgbMatch[1]),
                  parseInt(rgbMatch[2]),
                  parseInt(rgbMatch[3])
                );
                onChange(hex);
                setHexInput(hex);
                addToRecent(hex);
              }
            }
            setShowEyedropper(false);
          }}
        >
          {/* Instructions */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6 pointer-events-none">
            <div className="flex items-center gap-2 text-white">
              <Icons.EyeDropper className="w-5 h-5 text-[#7d2ae8]" />
              <span className="font-bold text-sm">Click to pick color</span>
            </div>
            <div className="w-px h-6 bg-gray-700" />
            <div className="flex items-center gap-2 text-gray-400">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">ESC</kbd>
              <span className="text-sm">Cancel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';
