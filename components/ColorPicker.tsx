import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { Dropdown } from './Dropdown';
import { ColorHarmonyGenerator } from './panels/ColorHarmonyGenerator';
import { PaletteGenerator } from './panels/PaletteGenerator';
import { GradientEditor } from './panels/GradientEditor';
import { ContrastChecker } from './panels/ContrastChecker';
import {
  rgbToHex,
  rgbToCMYK,
  parseColor,
  cmykToRgb,
  getCMYKGamutWarning,
  isWithinCMYKGamut,
  getClosestCMYKSafeColor,
} from '../utils/colorUtils';
import { haptics } from '../utils/haptics';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  documentColors?: string[];
  label?: string;
  small?: boolean;
}

const DEFAULT_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#00FFFF',
  '#FF00FF',
  '#C0C0C0',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#800080',
  '#008080',
  '#000080',
  '#e6194B',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#fabed4',
  '#469990',
  '#dcbeff',
  '#9A6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
];

export const ColorPicker: React.FC<ColorPickerProps> = React.memo(
  ({ value, onChange, documentColors = [], label, small }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [showEyedropper, setShowEyedropper] = useState(false);
    const [activeTab, setActiveTab] = useState<'picker' | 'harmony' | 'palette' | 'gradient' | 'contrast'>('picker');
    const [cmykMode, setCmykMode] = useState(false);
    const [cmykValues, setCmykValues] = useState({ c: 0, m: 0, y: 0, k: 0 });
    const [isCopied, setIsCopied] = useState(false);
    const addToast = useStore((state) => state.addToast);
    const popoverRef = useRef<HTMLButtonElement>(null);
    const dropdownContainerRef = useRef<HTMLDivElement>(null);

    const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

    // CMYK Readout and gamut warning
    const cmyk = useMemo(() => {
      if (value === 'transparent') {
        return null;
      }
      try {
        const rgb = parseColor(value);
        const cmykData = rgbToCMYK(rgb.r, rgb.g, rgb.b);
        const gamutWarning = getCMYKGamutWarning(value);
        const withinGamut = isWithinCMYKGamut(value);
        return { ...cmykData, gamutWarning, withinGamut };
      } catch {
        return null;
      }
    }, [value]);

    // Sync CMYK values when color changes
    useEffect(() => {
      if (cmyk) {
        setCmykValues({ c: cmyk.c, m: cmyk.m, y: cmyk.y, k: cmyk.k });
      }
    }, [cmyk]);

    // Load recent colors from localStorage
    useEffect(() => {
      try {
        const saved = localStorage.getItem('kreathief_recent_colors');
        if (saved) {
          setRecentColors(JSON.parse(saved));
        }
      } catch {
        // Silently ignore — cosmetic feature, not critical
      }
    }, []);

    const addToRecent = (color: string) => {
      const updated = [color, ...recentColors.filter((c) => c !== color)].slice(0, 10);
      setRecentColors(updated);
      localStorage.setItem('kreathief_recent_colors', JSON.stringify(updated));
    };

    useEffect(() => {
      setHexInput(value);
    }, [value]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
      if (val.length > 0) val = '#' + val;
      setHexInput(val);
      if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
        onChange(val);
        addToRecent(val);
      }
    };

    const handleNativeEyeDropper = async () => {
      if (!hasEyeDropper) {
        setShowEyedropper(true);
        setIsOpen(false);
        return;
      }

      try {
        // @ts-ignore - EyeDropper is a new API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const color = result.sRGBHex;
        onChange(color);
        setHexInput(color);
        addToRecent(color);
        haptics.success();
      } catch (e) {
        // User cancelled or error
      }
    };

    const copyToClipboard = () => {
      // Click-to-copy hex for #15
      navigator.clipboard.writeText(value).then(() => {
        setIsCopied(true);
        addToast('Color copied to clipboard', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      });
    };

    const uniqueDocColors = Array.from(new Set(documentColors)).slice(0, 14);

    return (
      <div className="relative group">
        {label && <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">{label}</span>}
        <button
          ref={popoverRef}
          data-testid="color-picker"
          aria-label={label ? `Choose ${label} color` : 'Choose color'}
          onClick={() => setIsOpen(!isOpen)}
          className={`${small ? 'w-6 h-6' : 'w-8 h-8'} rounded border border-gray-600 flex items-center justify-center relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM0NDQiLz48cGF0aCBkPSJNMCAwSDRWNEgwem00IDhIOFY0SDR6IiBmaWxsPSIjNTU1Ii8+PC9zdmc+')] hover:border-gray-400 transition-colors shadow-sm`}
        >
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </button>
        <Dropdown anchorRef={popoverRef} isOpen={isOpen} onClose={() => setIsOpen(false)} align="left">
          <div
            ref={dropdownContainerRef}
            className="bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl p-3 w-[360px] max-h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden animate-fade-in focus:outline-none"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                popoverRef.current?.focus();
              }
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                setIsOpen(false);
                popoverRef.current?.focus();
              }
            }}
          >
            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-[#0e1318] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('picker')}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'picker'
                    ? 'bg-[#7d2ae8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Picker
              </button>
              <button
                onClick={() => setActiveTab('harmony')}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'harmony'
                    ? 'bg-[#7d2ae8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Harmony
              </button>
              <button
                onClick={() => setActiveTab('palette')}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'palette'
                    ? 'bg-[#7d2ae8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Palette
              </button>
              <button
                onClick={() => setActiveTab('gradient')}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'gradient'
                    ? 'bg-[#7d2ae8] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Gradient
              </button>
              <button
                onClick={() => setActiveTab('contrast')}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
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
                    aria-label="Pick color from screen"
                    onClick={handleNativeEyeDropper}
                    className="w-full px-3 py-2 bg-[#252627] hover:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center justify-center gap-2 border border-white/5 hover:border-white/10"
                  >
                    <Icons.EyeDropper className="w-4 h-4 text-[#7d2ae8]" />
                    {hasEyeDropper ? 'Pick Color from Screen' : 'Simulate Eyedropper'}
                  </button>
                </div>

                {/* No Fill & Hex Input */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      onChange('transparent');
                      setHexInput('transparent');
                    }}
                    className={`flex-1 h-9 rounded border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${value === 'transparent' ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}
                    title="No Fill"
                  >
                    <Icons.Slash className="w-3 h-3" />
                    None
                  </button>
                  <div className="relative flex-[1.5]">
                    <button
                      aria-label="Copy hex code"
                      onClick={copyToClipboard}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs transition-colors ${isCopied ? 'text-green-400' : 'text-gray-500 hover:text-[#7d2ae8]'}`}
                      title="Copy Hex"
                    >
                      {isCopied ? <Icons.Check className="w-3 h-3" /> : '#'}
                    </button>
                    <input
                      type="text"
                      value={hexInput === 'transparent' ? '' : hexInput.replace('#', '')}
                      aria-label="Hex color value"
                      onChange={handleHexChange}
                      onBlur={(e) => {
                        let val = e.target.value;
                        if (val && !val.startsWith('#')) {
                          val = '#' + val;
                        }
                        if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
                          setHexInput(val);
                          onChange(val);
                        }
                      }}
                      maxLength={6}
                      placeholder="HEX"
                      className="w-full bg-[#252627] border border-gray-600 rounded pl-5 pr-2 py-2 text-xs text-white uppercase focus:border-[#7d2ae8] outline-none font-mono"
                    />
                  </div>
                  <div className="w-9 h-9 rounded border border-gray-600 relative overflow-hidden group">
                    <input
                      type="color"
                      value={value === 'transparent' ? '#ffffff' : value}
                      aria-label="Color picker"
                      onChange={(e) => {
                        onChange(e.target.value);
                        setHexInput(e.target.value);
                        addToRecent(e.target.value);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM0NDQiLz48cGF0aCBkPSJNMCAwSDRWNEgwem00IDhIOFY0SDR6IiBmaWxsPSIjNTU1Ii8+PC9zdmc+')]">
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: value === 'transparent' ? 'transparent' : value }}
                      />
                    </div>
                  </div>
                </div>

                {/* CMYK Mode Toggle & Gamut Warning */}
                {cmyk && (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center justify-between">
                        <button
                          aria-label="Toggle CMYK mode"
                          onClick={() => setCmykMode(!cmykMode)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                            cmykMode ? 'bg-[#7d2ae8]/20 text-[#7d2ae8]' : 'bg-black/40 text-gray-500 hover:text-white'
                          }`}
                        >
                          {cmykMode ? '✓ CMYK Mode' : 'CMYK Mode'}
                        </button>

                        {!cmyk.withinGamut && (
                          <div
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                              cmyk.gamutWarning === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}
                          >
                            <Icons.AlertTriangle className="w-3 h-3" />
                            {cmyk.gamutWarning === 'critical' ? 'Out of Gamut' : 'Gamut Warning'}
                          </div>
                        )}
                      </div>

                      {!cmyk.withinGamut && (
                        <div
                          className={`p-2 rounded-xl border flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 ${
                            cmyk.gamutWarning === 'critical'
                              ? 'bg-red-500/5 border-red-500/10'
                              : 'bg-yellow-500/5 border-yellow-500/10'
                          }`}
                        >
                          <span className="text-[8px] text-gray-400 font-medium leading-tight">
                            This color may look dull when printed.
                          </span>
                          <button
                            onClick={() => {
                              const safe = getClosestCMYKSafeColor(value);
                              onChange(safe);
                              setHexInput(safe);
                              haptics.success();
                              addToast('Snapped to closest printable color', 'info');
                            }}
                            className="whitespace-nowrap px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white transition-all border border-white/5"
                          >
                            Snap to Safe
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CMYK Input Fields or Readout */}
                    {cmykMode ? (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="space-y-1">
                          <label
                            htmlFor="cmyk-c"
                            className="text-[8px] text-cyan-400 font-black uppercase block text-center"
                          >
                            C
                          </label>
                          <input
                            id="cmyk-c"
                            type="number"
                            min="0"
                            max="100"
                            value={cmykValues.c}
                            aria-label="Cyan value"
                            onChange={(e) => {
                              const newCmyk = {
                                ...cmykValues,
                                c: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                              };
                              setCmykValues(newCmyk);
                              const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                              const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                              onChange(hex);
                              setHexInput(hex);
                            }}
                            className="w-full bg-[#252627] border border-cyan-500/30 rounded p-1.5 text-xs text-cyan-400 font-mono font-bold text-center focus:border-cyan-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="cmyk-m"
                            className="text-[8px] text-pink-400 font-black uppercase block text-center"
                          >
                            M
                          </label>
                          <input
                            id="cmyk-m"
                            type="number"
                            min="0"
                            max="100"
                            value={cmykValues.m}
                            aria-label="Magenta value"
                            onChange={(e) => {
                              const newCmyk = {
                                ...cmykValues,
                                m: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                              };
                              setCmykValues(newCmyk);
                              const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                              const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                              onChange(hex);
                              setHexInput(hex);
                            }}
                            className="w-full bg-[#252627] border border-pink-500/30 rounded p-1.5 text-xs text-pink-400 font-mono font-bold text-center focus:border-pink-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="cmyk-y"
                            className="text-[8px] text-yellow-400 font-black uppercase block text-center"
                          >
                            Y
                          </label>
                          <input
                            id="cmyk-y"
                            type="number"
                            min="0"
                            max="100"
                            value={cmykValues.y}
                            aria-label="Yellow value"
                            onChange={(e) => {
                              const newCmyk = {
                                ...cmykValues,
                                y: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                              };
                              setCmykValues(newCmyk);
                              const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                              const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                              onChange(hex);
                              setHexInput(hex);
                            }}
                            className="w-full bg-[#252627] border border-yellow-500/30 rounded p-1.5 text-xs text-yellow-400 font-mono font-bold text-center focus:border-yellow-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="cmyk-k"
                            className="text-[8px] text-white font-black uppercase block text-center"
                          >
                            K
                          </label>
                          <input
                            id="cmyk-k"
                            type="number"
                            min="0"
                            max="100"
                            value={cmykValues.k}
                            aria-label="Black value"
                            onChange={(e) => {
                              const newCmyk = {
                                ...cmykValues,
                                k: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                              };
                              setCmykValues(newCmyk);
                              const rgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                              const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
                              onChange(hex);
                              setHexInput(hex);
                            }}
                            className="w-full bg-[#252627] border border-white/30 rounded p-1.5 text-xs text-white font-mono font-bold text-center focus:border-white outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1 mb-4">
                        <div className="bg-black/40 rounded p-1.5 border border-white/5 flex flex-col items-center">
                          <span className="text-[8px] text-gray-500 font-black uppercase">C</span>
                          <span className="text-[10px] text-cyan-400 font-mono font-bold">{cmyk.c}%</span>
                        </div>
                        <div className="bg-black/40 rounded p-1.5 border border-white/5 flex flex-col items-center">
                          <span className="text-[8px] text-gray-500 font-black uppercase">M</span>
                          <span className="text-[10px] text-pink-400 font-mono font-bold">{cmyk.m}%</span>
                        </div>
                        <div className="bg-black/40 rounded p-1.5 border border-white/5 flex flex-col items-center">
                          <span className="text-[8px] text-gray-500 font-black uppercase">Y</span>
                          <span className="text-[10px] text-yellow-400 font-mono font-bold">{cmyk.y}%</span>
                        </div>
                        <div className="bg-black/40 rounded p-1.5 border border-white/5 flex flex-col items-center">
                          <span className="text-[8px] text-gray-500 font-black uppercase">K</span>
                          <span className="text-[10px] text-white font-mono font-bold">{cmyk.k}%</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                      Recent Colors
                      <button
                        onClick={() => {
                          setRecentColors([]);
                          localStorage.removeItem('kreathief_recent_colors');
                        }}
                        className="text-[8px] hover:text-red-400"
                      >
                        Clear
                      </button>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {recentColors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onChange(color);
                            setHexInput(color);
                          }}
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
                          onClick={() => {
                            onChange(color);
                            setHexInput(color);
                            addToRecent(color);
                          }}
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
                        onClick={() => {
                          onChange(color);
                          setHexInput(color);
                          addToRecent(color);
                        }}
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
                  colors.forEach((color) => addToRecent(color));
                  setActiveTab('picker');
                }}
              />
            )}

            {activeTab === 'gradient' && (
              <GradientEditor
                onChange={(gradient) => {
                  // Build a CSS gradient string and apply it as a special color value
                  const css = `linear-gradient(${gradient.angle ?? 90}deg, ${gradient.stops.map((s: any) => `${s.color} ${s.position}%`).join(', ')})`;
                  onChange(css);
                  setHexInput(css);
                  addToast(`Gradient applied (${gradient.stops.length} stops)`, 'success');
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
                  const hex = rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
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
  }
);

ColorPicker.displayName = 'ColorPicker';
