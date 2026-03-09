import React, { useState } from 'react';
import { Icons } from '../../constants';
import { TextLayer, AdvancedShadow, Stroke } from '../../types';

interface TextEffectsPanelProps {
  selectedLayer: TextLayer;
  onUpdateLayer: (id: string, changes: Partial<TextLayer>) => void;
}

const TRANSFORM_TYPES = [
  { id: 'none', label: 'Normal', icon: Icons.Text },
  { id: 'arch', label: 'Arch', icon: Icons.ChevronUp },
  { id: 'wave', label: 'Wave', icon: Icons.Activity },
  { id: 'rise', label: 'Rise', icon: Icons.TrendingUp },
  { id: 'flag', label: 'Flag', icon: Icons.Flag },
  { id: 'circle', label: 'Circle', icon: Icons.Circle },
  { id: 'distort', label: 'Distort', icon: Icons.Layers },
  { id: 'angle', label: 'Angle', icon: Icons.Italic },
  { id: 'mesh', label: 'Mesh', icon: Icons.Grid },
];

const TEXTURE_PRESETS = [
  {
    name: 'Noise',
    url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E",
  },
  {
    name: 'Paper',
    url: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeDiffuseLighting lighting-color='%23f2ebd4' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.3'/%3E%3C/svg%3E",
  },
  {
    name: 'Grunge',
    url: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grunge'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='2' result='turbulence'/%3E%3CfeDisplacementMap in2='turbulence' in='SourceGraphic' scale='50' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23000' opacity='0.3' filter='url(%23grunge)'/%3E%3C/svg%3E",
  },
  {
    name: 'Halftone',
    url: "data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='halftone' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='5' cy='5' r='2' fill='%23000' opacity='0.4'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23halftone)'/%3E%3C/svg%3E",
  },
];

const SHADOW_TYPES = [
  { id: 'drop', label: 'Drop Shadow' },
  { id: 'block', label: 'Block Shadow' },
  { id: 'line', label: 'Line Shadow' },
  { id: '3d', label: '3D Extrude' },
];

const NEON_PRESETS = [
  { name: 'Electric Purple', color: '#a855f7', intensity: 70, spread: 20 },
  { name: 'Cyber Blue', color: '#3b82f6', intensity: 80, spread: 25 },
  { name: 'Hot Pink', color: '#ec4899', intensity: 75, spread: 22 },
  { name: 'Lime Green', color: '#22c55e', intensity: 65, spread: 18 },
  { name: 'Neon Orange', color: '#f97316', intensity: 70, spread: 20 },
  { name: 'Crimson Red', color: '#ef4444', intensity: 75, spread: 24 },
];

export const TextEffectsPanel: React.FC<TextEffectsPanelProps> = ({ selectedLayer, onUpdateLayer }) => {
  const {
    transformType = 'none',
    transformIntensity = 50,
    transformDirection = 0,
    advancedShadows = [],
    decorations = {},
    stroke,
    neonGlow,
    curve = 0,
  } = selectedLayer;

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleUpdateTransform = (changes: Partial<TextLayer>) => {
    onUpdateLayer(selectedLayer.id, changes);
  };

  const handleAddShadow = (type: AdvancedShadow['type']) => {
    const newShadow: AdvancedShadow = {
      type,
      color: '#000000',
      blur: type === 'drop' ? 5 : 0,
      offsetX: 5,
      offsetY: 5,
      opacity: 0.5,
      distance: 5,
    };
    handleUpdateTransform({ advancedShadows: [...advancedShadows, newShadow] });
  };

  const handleUpdateShadow = (index: number, changes: Partial<AdvancedShadow>) => {
    const updated = [...advancedShadows];
    updated[index] = { ...updated[index], ...changes };
    handleUpdateTransform({ advancedShadows: updated });
  };

  const handleRemoveShadow = (index: number) => {
    handleUpdateTransform({ advancedShadows: advancedShadows.filter((_, i) => i !== index) });
  };

  const toggleCut = () => {
    const newCuts = decorations.cuts && decorations.cuts.length > 0 ? [] : [{ type: 'angle', value: 40 }];
    handleUpdateTransform({ decorations: { ...decorations, cuts: newCuts } });
  };

  const handleApplyTexture = (url: string) => {
    const isSelected = decorations.textures?.includes(url);
    const newTextures = isSelected ? [] : [url];
    handleUpdateTransform({ decorations: { ...decorations, textures: newTextures } });
  };

  const toggleLine = (type: 'top' | 'middle' | 'bottom') => {
    const lines = decorations.lines || [];
    const exists = lines.find((l) => l.type === type);
    const newLines = exists ? lines.filter((l) => l.type !== type) : [...lines, { type, value: 2 }];
    handleUpdateTransform({ decorations: { ...decorations, lines: newLines } });
  };

  // Stroke handlers
  const handleUpdateStroke = (changes: Partial<Stroke>) => {
    const currentStroke = stroke || { color: '#ffffff', width: 0 };
    handleUpdateTransform({ stroke: { ...currentStroke, ...changes } });
  };

  // Neon handlers
  const handleToggleNeon = () => {
    if (neonGlow?.enabled) {
      handleUpdateTransform({ neonGlow: { ...neonGlow, enabled: false } });
    } else {
      handleUpdateTransform({
        neonGlow: {
          enabled: true,
          color: neonGlow?.color || '#a855f7',
          intensity: neonGlow?.intensity || 70,
          spread: neonGlow?.spread || 20,
          flicker: neonGlow?.flicker || false,
        },
      });
    }
  };

  const handleApplyNeonPreset = (preset: (typeof NEON_PRESETS)[0]) => {
    handleUpdateTransform({
      neonGlow: {
        enabled: true,
        color: preset.color,
        intensity: preset.intensity,
        spread: preset.spread,
        flicker: false,
      },
    });
  };

  // Live text preview
  const previewStyle: React.CSSProperties = {
    fontFamily: selectedLayer.fontFamily || 'Inter',
    fontSize: '24px',
    fontWeight: selectedLayer.fontWeight || '700',
    color: selectedLayer.color || '#fff',
    textAlign: 'center',
    padding: '16px 8px',
    lineHeight: 1.3,
    letterSpacing: `${selectedLayer.letterSpacing || 0}px`,
    textTransform: selectedLayer.textTransform || 'none',
    ...(stroke && stroke.width > 0
      ? {
        WebkitTextStroke: `${stroke.width}px ${stroke.color}`,
      }
      : {}),
    ...(neonGlow?.enabled
      ? {
        textShadow: [
          `0 0 ${neonGlow.spread * 0.5}px ${neonGlow.color}`,
          `0 0 ${neonGlow.spread}px ${neonGlow.color}`,
          `0 0 ${neonGlow.spread * 2}px ${neonGlow.color}`,
          `0 0 ${neonGlow.spread * 3}px ${neonGlow.color}40`,
        ].join(', '),
        ...(neonGlow.flicker
          ? { animation: 'neonFlicker 2s ease-in-out infinite alternate' }
          : {}),
      }
      : {}),
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] overflow-y-auto custom-scrollbar">
      {/* Live Preview */}
      <div
        className="mx-4 mt-4 mb-2 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1025 50%, #0a0a2e 100%)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <div className="text-center px-2">
          <div style={previewStyle}>{selectedLayer.text?.slice(0, 30) || 'Preview'}</div>
        </div>
        <div className="text-[9px] text-gray-600 text-center pb-2">Live Preview</div>
      </div>

      <div className="p-4 space-y-6">
        {/* == HEADER == */}
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Zap className="w-5 h-5 text-yellow-500" />
          Text Effects
        </h3>

        {/* ===========================
            SECTION: TEXT STROKE
        ============================= */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'stroke' ? null : 'stroke')}
            className="w-full flex items-center justify-between py-2"
          >
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  background:
                    stroke && stroke.width > 0 ? stroke.color : 'transparent',
                  border: '1.5px solid #555',
                }}
              />
              Text Stroke
            </label>
            <Icons.ChevronDown
              className={`w-3 h-3 text-gray-500 transition-transform ${activeSection === 'stroke' ? 'rotate-180' : ''
                }`}
            />
          </button>

          {activeSection === 'stroke' && (
            <div className="space-y-3 bg-[#1e1e1e] p-3 rounded-xl border border-gray-800 animate-in slide-in-from-top-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-6 h-6 rounded-lg border border-gray-700 overflow-hidden relative shrink-0">
                    <input
                      type="color"
                      value={stroke?.color || '#ffffff'}
                      onChange={(e) => handleUpdateStroke({ color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: stroke?.color || '#ffffff' }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">
                    {stroke?.color || '#ffffff'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400">Width</label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {stroke?.width || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={stroke?.width || 0}
                  onChange={(e) => handleUpdateStroke({ width: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400">Opacity</label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {Math.round((stroke?.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={stroke?.opacity ?? 1}
                  onChange={(e) => handleUpdateStroke({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-1">
                {(['butt', 'round', 'square'] as const).map((cap) => (
                  <button
                    key={cap}
                    onClick={() => handleUpdateStroke({ cap })}
                    className={`py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${(stroke?.cap || 'round') === cap
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50'
                        : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ===========================
            SECTION: NEON GLOW ✨
        ============================= */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: neonGlow?.enabled ? neonGlow.color : '#333',
                  boxShadow: neonGlow?.enabled
                    ? `0 0 6px ${neonGlow.color}, 0 0 12px ${neonGlow.color}40`
                    : 'none',
                }}
              />
              Neon Glow
            </label>
            <button
              onClick={handleToggleNeon}
              className={`w-8 h-4 rounded-full transition-colors relative ${neonGlow?.enabled ? 'bg-purple-600' : 'bg-gray-700'
                }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${neonGlow?.enabled ? 'left-4.5' : 'left-0.5'
                  }`}
                style={{ left: neonGlow?.enabled ? '17px' : '2px' }}
              />
            </button>
          </div>

          {/* Neon Presets */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {NEON_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleApplyNeonPreset(preset)}
                title={preset.name}
                className={`w-full aspect-square rounded-lg transition-all ${neonGlow?.enabled && neonGlow?.color === preset.color
                    ? 'ring-2 ring-white/50 scale-110'
                    : 'hover:scale-105'
                  }`}
                style={{
                  background: preset.color,
                  boxShadow: `0 0 8px ${preset.color}60, 0 0 16px ${preset.color}30`,
                }}
              />
            ))}
          </div>

          {neonGlow?.enabled && (
            <div className="space-y-3 bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border-gray-700 overflow-hidden relative shrink-0">
                  <input
                    type="color"
                    value={neonGlow.color}
                    onChange={(e) =>
                      handleUpdateTransform({
                        neonGlow: { ...neonGlow, color: e.target.value },
                      })
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: neonGlow.color,
                      boxShadow: `inset 0 0 4px ${neonGlow.color}`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{neonGlow.color}</span>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400">Intensity</label>
                  <span className="text-[10px] font-mono" style={{ color: neonGlow.color }}>
                    {neonGlow.intensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={neonGlow.intensity}
                  onChange={(e) =>
                    handleUpdateTransform({
                      neonGlow: { ...neonGlow, intensity: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400">Spread</label>
                  <span className="text-[10px] font-mono" style={{ color: neonGlow.color }}>
                    {neonGlow.spread}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={neonGlow.spread}
                  onChange={(e) =>
                    handleUpdateTransform({
                      neonGlow: { ...neonGlow, spread: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <button
                onClick={() =>
                  handleUpdateTransform({
                    neonGlow: { ...neonGlow, flicker: !neonGlow.flicker },
                  })
                }
                className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all ${neonGlow.flicker
                    ? 'bg-yellow-600/20 border border-yellow-500/50 text-yellow-400'
                    : 'bg-gray-900 border border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
              >
                ⚡ Flicker Animation
              </button>
            </div>
          )}
        </section>

        {/* ===========================
            SECTION: CURVED TEXT
        ============================= */}
        <section>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
            Text Curve
          </label>
          <div className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
            <div className="flex justify-between mb-1.5">
              <label className="text-[10px] font-bold text-gray-400">Bend</label>
              <span className="text-[10px] text-purple-400 font-mono">{curve}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={curve}
              onChange={(e) => handleUpdateTransform({ curve: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-center gap-2 mt-3">
              {[-90, -45, 0, 45, 90].map((val) => (
                <button
                  key={val}
                  onClick={() => handleUpdateTransform({ curve: val })}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${curve === val
                      ? 'bg-purple-600/30 text-purple-400'
                      : 'bg-gray-900 text-gray-600 hover:text-gray-400'
                    }`}
                >
                  {val === 0 ? 'Flat' : `${val}°`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===========================
            SECTION: TRANSFORMATIONS
        ============================= */}
        <section>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
            Transformations
          </label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {TRANSFORM_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleUpdateTransform({ transformType: t.id as any })}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${transformType === t.id
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-[#1e1e1e] border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
              >
                <t.icon className="w-4 h-4 mb-1" />
                <span className="text-[8px] font-bold">{t.label}</span>
              </button>
            ))}
          </div>

          {transformType !== 'none' && (
            <div className="space-y-4 bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400">Intensity</label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {transformIntensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={transformIntensity}
                  onChange={(e) =>
                    handleUpdateTransform({ transformIntensity: parseInt(e.target.value) })
                  }
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              {transformType === 'circle' && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Direction</label>
                    <span className="text-[10px] text-purple-400 font-mono">
                      {transformDirection}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={transformDirection}
                    onChange={(e) =>
                      handleUpdateTransform({ transformDirection: parseInt(e.target.value) })
                    }
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===========================
            SECTION: LAYERED SHADOWS
        ============================= */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Shadow Effects
            </label>
            <div className="flex gap-1">
              {SHADOW_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAddShadow(s.id as any)}
                  className="w-5 h-5 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-white"
                  title={s.label}
                >
                  <Icons.Plus className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {advancedShadows.map((s, idx) => (
              <div key={idx} className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">
                    {s.type} Shadow
                  </span>
                  <button
                    onClick={() => handleRemoveShadow(idx)}
                    className="text-gray-600 hover:text-red-400"
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-gray-700 overflow-hidden relative">
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => handleUpdateShadow(idx, { color: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: s.color }} />
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">{s.color}</span>
                  </div>
                  {s.type === 'block' || s.type === '3d' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">Depth:</span>
                      <input
                        type="number"
                        value={s.distance}
                        onChange={(e) =>
                          handleUpdateShadow(idx, { distance: parseInt(e.target.value) })
                        }
                        className="w-full bg-gray-900 border border-gray-800 rounded px-1 py-0.5 text-[10px] text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">Offset:</span>
                      <input
                        type="number"
                        value={s.offsetX}
                        onChange={(e) =>
                          handleUpdateShadow(idx, {
                            offsetX: parseInt(e.target.value),
                            offsetY: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-gray-900 border border-gray-800 rounded px-1 py-0.5 text-[10px] text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {advancedShadows.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-600">
                <p className="text-[10px]">No advanced shadows added</p>
              </div>
            )}
          </div>
        </section>

        {/* ===========================
            SECTION: DECORATIONS
        ============================= */}
        <section>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
            Decorations
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleCut}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${decorations.cuts && decorations.cuts.length > 0
                  ? 'bg-orange-600/20 border-orange-500/50 text-orange-400'
                  : 'bg-[#1e1e1e] border-gray-800 text-gray-500 hover:border-gray-700'
                }`}
            >
              <Icons.Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold">Color Cuts</span>
            </button>
          </div>

          <div className="mt-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
              Textures
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TEXTURE_PRESETS.map((tex, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyTexture(tex.url)}
                  className={`aspect-square rounded-lg border-2 transition-all flex items-center justify-center overflow-hidden ${decorations.textures?.includes(tex.url)
                      ? 'border-purple-500 ring-2 ring-purple-500/20'
                      : 'border-gray-800 hover:border-gray-700'
                    }`}
                  title={tex.name}
                >
                  <img src={tex.url} className="w-full h-full object-cover opacity-50" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
              Dynamic Lines
            </label>
            <div className="flex gap-2">
              {['top', 'middle', 'bottom'].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleLine(type as any)}
                  className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${decorations.lines?.find((l) => l.type === type)
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-[#1e1e1e] border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Neon flicker keyframe animation */}
      <style>{`
        @keyframes neonFlicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            opacity: 1;
          }
          20%, 24%, 55% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default TextEffectsPanel;
