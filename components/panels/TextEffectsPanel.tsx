import React, { useState, useCallback } from 'react';
import { Icons } from '../../constants';

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
  const [warpStyle, setWarpStyle] = useState<'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish'>(effects.warpStyle || 'none');
  const [curve, setCurve] = useState(effects.curve || 0);
  const [depth, setDepth] = useState(effects.depth || 0);
  const [neonEnabled, setNeonEnabled] = useState(effects.neonGlow?.enabled || false);
  const [neonColor, setNeonColor] = useState(effects.neonGlow?.color || '#7d2ae8');
  const [neonIntensity, setNeonIntensity] = useState(effects.neonGlow?.intensity || 50);
  const [neonSpread, setNeonSpread] = useState(effects.neonGlow?.spread || 30);
  const [neonFlicker, setNeonFlicker] = useState(effects.neonGlow?.flicker || false);

  const handleStyleTypeChange = useCallback((type: 'normal' | 'hollow' | 'lift' | 'echo') => {
    setStyleType(type);
    onChange({ ...effects, styleType: type });
  }, [effects, onChange]);

  const handleWarpStyleChange = useCallback((style: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish') => {
    setWarpStyle(style);
    onChange({ ...effects, warpStyle: style });
  }, [effects, onChange]);

  const handleCurveChange = useCallback((value: number) => {
    setCurve(value);
    onChange({ ...effects, curve: value });
  }, [effects, onChange]);

  const handleDepthChange = useCallback((value: number) => {
    setDepth(value);
    onChange({ ...effects, depth: value });
  }, [effects, onChange]);

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
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Text Effects</h3>

      {/* Style Type */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Style Type</label>
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
              className={`py-2 rounded text-xs font-bold transition-all ${
                styleType === type.id
                  ? 'bg-[#7d2ae8] text-white'
                  : 'bg-[#252627] text-gray-400 hover:text-white'
              }`}
            >
              {type.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Warp Effects */}
      <div>
        <label className="text-[10px] text-gray-500 block mb-2">Warp / Transform</label>
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
              className={`py-1.5 rounded text-[9px] font-medium transition-all ${
                warpStyle === type.id
                  ? 'bg-[#7d2ae8] text-white'
                  : 'bg-[#252627] text-gray-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curve Control */}
      {(warpStyle === 'arc' || warpStyle === 'wave') && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-2">Curve Intensity: {curve}</label>
          <input
            type="range"
            min="-100"
            max="100"
            value={curve}
            onChange={(e) => handleCurveChange(parseInt(e.target.value))}
            className="w-full accent-[#7d2ae8]"
          />
        </div>
      )}

      {/* Depth Control (for Lift/Echo) */}
      {(styleType === 'lift' || styleType === 'echo') && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-2">Depth: {depth}</label>
          <input
            type="range"
            min="0"
            max="20"
            value={depth}
            onChange={(e) => handleDepthChange(parseInt(e.target.value))}
            className="w-full accent-[#7d2ae8]"
          />
        </div>
      )}

      {/* Neon Glow */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] text-gray-400 font-bold">Neon Glow</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={neonEnabled}
              onChange={(e) => {
                setNeonEnabled(e.target.checked);
                handleNeonChange();
              }}
              className="accent-[#7d2ae8]"
            />
            <span className="text-[10px] text-gray-500">On</span>
          </label>
        </div>

        {neonEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={neonColor}
                onChange={(e) => {
                  setNeonColor(e.target.value);
                  handleNeonChange();
                }}
                className="w-8 h-8 rounded border border-gray-600"
              />
              <span className="text-[10px] text-gray-400">Glow Color</span>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-2">Intensity: {neonIntensity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={neonIntensity}
                onChange={(e) => {
                  setNeonIntensity(parseInt(e.target.value));
                  handleNeonChange();
                }}
                className="w-full accent-[#7d2ae8]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-2">Spread: {neonSpread}px</label>
              <input
                type="range"
                min="0"
                max="50"
                value={neonSpread}
                onChange={(e) => {
                  setNeonSpread(parseInt(e.target.value));
                  handleNeonChange();
                }}
                className="w-full accent-[#7d2ae8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={neonFlicker}
                onChange={(e) => {
                  setNeonFlicker(e.target.checked);
                  handleNeonChange();
                }}
                className="accent-[#7d2ae8]"
              />
              <label className="text-[10px] text-gray-400">Flicker Animation</label>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="border-t border-gray-700 pt-4">
        <div
          className="text-2xl font-black text-center py-4"
          style={{
            textShadow: neonEnabled
              ? `0 0 ${neonSpread}px ${neonColor}, 0 0 ${neonSpread * 2}px ${neonColor}, 0 0 ${neonSpread * 3}px ${neonColor}`
              : 'none',
            transform: warpStyle === 'arc' ? `rotateX(${curve}deg)` : 'none',
          }}
        >
          Neon Text
        </div>
      </div>
    </div>
  );
};
