import React, { useState, useCallback } from 'react';

interface TextEffectsPanelProps {
  effects?: {
    styleType?: 'normal' | 'hollow' | 'lift' | 'echo';
    warpStyle?: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish';
    curve?: number;
    depth?: number;
    neonGlow?: {
      enabled: boolean;
      color: string;
      intensity: number;
      spread: number;
      flicker: boolean;
    };
  };
  onChange: (effects: object) => void;
}

export const TextEffectsPanel: React.FC<TextEffectsPanelProps> = ({ effects = {}, onChange }) => {
  const [styleType, setStyleType] = useState<'normal' | 'hollow' | 'lift' | 'echo'>(effects.styleType || 'normal');
  const [warpStyle, setWarpStyle] = useState<'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish'>(
    effects.warpStyle || 'none'
  );
  const [curve, setCurve] = useState(effects.curve || 0);
  const [depth, setDepth] = useState(effects.depth || 0);
  const [neonEnabled, setNeonEnabled] = useState(effects.neonGlow?.enabled || false);
  const [neonColor, setNeonColor] = useState(effects.neonGlow?.color || '#7d2ae8');
  const [neonIntensity, setNeonIntensity] = useState(effects.neonGlow?.intensity || 50);
  const [neonSpread, setNeonSpread] = useState(effects.neonGlow?.spread || 30);
  const [neonFlicker, setNeonFlicker] = useState(effects.neonGlow?.flicker || false);

  const handleStyleTypeChange = useCallback(
    (type: 'normal' | 'hollow' | 'lift' | 'echo') => {
      setStyleType(type);
      onChange({ ...effects, styleType: type });
    },
    [effects, onChange]
  );

  const handleWarpStyleChange = useCallback(
    (style: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish') => {
      setWarpStyle(style);
      onChange({ ...effects, warpStyle: style });
    },
    [effects, onChange]
  );

  const handleCurveChange = useCallback(
    (value: number) => {
      setCurve(value);
      onChange({ ...effects, curve: value });
    },
    [effects, onChange]
  );

  const handleDepthChange = useCallback(
    (value: number) => {
      setDepth(value);
      onChange({ ...effects, depth: value });
    },
    [effects, onChange]
  );

  const handleNeonChange = useCallback(() => {
    onChange({
      ...effects,
      neonGlow: {
        enabled: neonEnabled,
        color: neonColor,
        intensity: neonIntensity,
        spread: neonSpread,
        flicker: neonFlicker,
      },
    });
  }, [effects, neonEnabled, neonColor, neonIntensity, neonSpread, neonFlicker]);

  return (
    <div className="bg-surface-dark-1 rounded-2xl border border-white/5 p-5 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Text Effects</h3>
        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-400 uppercase tracking-widest">
          PRO
        </span>
      </div>

      {/* Style Type */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Core Style</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'normal', label: 'Normal', icon: 'A' },
            { id: 'hollow', label: 'Hollow', icon: '◐' },
            { id: 'lift', label: 'Lift', icon: '▲' },
            { id: 'echo', label: 'Echo', icon: '≋' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => handleStyleTypeChange(type.id as any)}
              className={`h-10 rounded-xl text-sm font-black transition-all flex items-center justify-center border ${
                styleType === type.id
                  ? 'bg-brand-600 text-white border-purple-400/50 shadow-glow-brand'
                  : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'
              }`}
            >
              {type.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Warp Effects */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Transformation</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'None' },
            { id: 'arc', label: 'Arc' },
            { id: 'flag', label: 'Flag' },
            { id: 'rise', label: 'Rise' },
            { id: 'wave', label: 'Wave' },
            { id: 'fish', label: 'Fish' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => handleWarpStyleChange(type.id as any)}
              className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                warpStyle === type.id
                  ? 'bg-accent text-white border-cyan-400/50 shadow-[0_0_15px_rgba(0,196,204,0.3)]'
                  : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curve Control */}
      {(warpStyle === 'arc' || warpStyle === 'wave') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Curve Intensity</label>
            <span className="text-[9px] font-black text-white font-mono">{curve}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={curve}
            onChange={(e) => handleCurveChange(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      )}

      {/* Depth Control (for Lift/Echo) */}
      {(styleType === 'lift' || styleType === 'echo') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Effect Depth</label>
            <span className="text-[9px] font-black text-white font-mono">{depth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={depth}
            onChange={(e) => handleDepthChange(parseInt(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      )}

      {/* Neon Glow */}
      <div className="border-t border-white/5 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neon Aura</label>
          <button
            onClick={() => {
              setNeonEnabled(!neonEnabled);
              handleNeonChange();
            }}
            className={`w-10 h-5 rounded-full relative transition-colors ${neonEnabled ? 'bg-brand-600' : 'bg-white/10'}`}
          >
            <div
              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${neonEnabled ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>

        {neonEnabled && (
          <div className="space-y-5 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Glow Color</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-white font-mono uppercase">{neonColor}</span>
                <input
                  type="color"
                  value={neonColor}
                  onChange={(e) => {
                    setNeonColor(e.target.value);
                    handleNeonChange();
                  }}
                  className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Glow Intensity</label>
                <span className="text-[9px] font-black text-white font-mono">{neonIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={neonIntensity}
                onChange={(e) => {
                  setNeonIntensity(parseInt(e.target.value));
                  handleNeonChange();
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Aura Spread</label>
                <span className="text-[9px] font-black text-white font-mono">{neonSpread}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={neonSpread}
                onChange={(e) => {
                  setNeonSpread(parseInt(e.target.value));
                  handleNeonChange();
                }}
                className="w-full accent-brand-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Dynamic Flicker</label>
              <button
                onClick={() => {
                  setNeonFlicker(!neonFlicker);
                  handleNeonChange();
                }}
                className={`w-8 h-4 rounded-full relative transition-colors ${neonFlicker ? 'bg-accent' : 'bg-white/10'}`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${neonFlicker ? 'left-4.5' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="border-t border-white/5 pt-6">
        <div className="bg-surface-dark-2 rounded-xl p-6 border border-white/5 flex items-center justify-center min-h-[100px] overflow-hidden">
          <div
            className="text-3xl font-black text-center transition-all duration-500 uppercase tracking-tighter"
            style={{
              color: neonEnabled ? '#fff' : 'inherit',
              textShadow: neonEnabled
                ? `0 0 ${neonSpread}px ${neonColor}, 0 0 ${neonSpread * 2}px ${neonColor}, 0 0 ${neonSpread * 3}px ${neonColor}`
                : 'none',
              transform: warpStyle === 'arc' ? `rotateX(${curve}deg)` : 'none',
              WebkitTextStroke: styleType === 'hollow' ? '1px #7d2ae8' : 'none',
              opacity: styleType === 'hollow' ? 0.8 : 1,
            }}
          >
            {styleType === 'hollow' ? 'HOLLOW' : 'NEON TEXT'}
          </div>
        </div>
      </div>
    </div>
  );
};
