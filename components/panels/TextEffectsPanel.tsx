import React, { useState, useCallback } from 'react';
import { PanelHeader } from './PanelHeader';

interface TextEffectsPanelProps {
  effects?: {
    styleType?: 'normal' | 'hollow' | 'lift' | 'echo' | 'emboss' | 'deboss';
    warpStyle?: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish' | 'bulge' | 'squeeze' | 'perspective';
    curve?: number;
    depth?: number;
    neonGlow?: {
      enabled: boolean;
      color: string;
      intensity: number;
      spread: number;
      flicker: boolean;
    };
    textShadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
    };
    textStroke?: {
      width: number;
      color: string;
    };
    warpParams?: {
      rotateX: number;
      rotateY: number;
      perspective: number;
    };
  };
  onChange: (effects: object) => void;
}

export const TextEffectsPanel: React.FC<TextEffectsPanelProps> = ({ effects = {}, onChange }) => {
  const [styleType, setStyleType] = useState<'normal' | 'hollow' | 'lift' | 'echo' | 'emboss' | 'deboss'>(
    effects.styleType || 'normal'
  );
  const [warpStyle, setWarpStyle] = useState<
    'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish' | 'bulge' | 'squeeze' | 'perspective'
  >(effects.warpStyle || 'none');
  const [curve, setCurve] = useState(effects.curve || 0);
  const [depth, setDepth] = useState(effects.depth || 0);
  const [neonEnabled, setNeonEnabled] = useState(effects.neonGlow?.enabled || false);
  const [neonColor, setNeonColor] = useState(effects.neonGlow?.color || '#7d2ae8');
  const [neonIntensity, setNeonIntensity] = useState(effects.neonGlow?.intensity || 50);
  const [neonSpread, setNeonSpread] = useState(effects.neonGlow?.spread || 30);
  const [neonFlicker, setNeonFlicker] = useState(effects.neonGlow?.flicker || false);

  const [shadowEnabled, setShadowEnabled] = useState(!!effects.textShadow);
  const [shadowX, setShadowX] = useState(effects.textShadow?.offsetX || 2);
  const [shadowY, setShadowY] = useState(effects.textShadow?.offsetY || 2);
  const [shadowBlur, setShadowBlur] = useState(effects.textShadow?.blur || 4);
  const [shadowColor, setShadowColor] = useState(effects.textShadow?.color || '#000000');

  const [strokeEnabled, setStrokeEnabled] = useState(!!effects.textStroke);
  const [strokeWidth, setStrokeWidth] = useState(effects.textStroke?.width || 1);
  const [strokeColor, setStrokeColor] = useState(effects.textStroke?.color || '#000000');

  const [warpRotateX, setWarpRotateX] = useState(effects.warpParams?.rotateX || 0);
  const [warpRotateY, setWarpRotateY] = useState(effects.warpParams?.rotateY || 0);
  const [warpPerspective, setWarpPerspective] = useState(effects.warpParams?.perspective || 800);

  const handleStyleTypeChange = useCallback(
    (type: 'normal' | 'hollow' | 'lift' | 'echo' | 'emboss' | 'deboss') => {
      setStyleType(type);
      onChange({ ...effects, styleType: type });
    },
    [effects, onChange]
  );

  const handleWarpStyleChange = useCallback(
    (style: 'none' | 'arc' | 'flag' | 'rise' | 'wave' | 'fish' | 'bulge' | 'squeeze' | 'perspective') => {
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

  const handleNeonChange = useCallback(
    (enabledOverride?: boolean) => {
      onChange({
        ...effects,
        neonGlow: {
          enabled: enabledOverride !== undefined ? enabledOverride : neonEnabled,
          color: neonColor,
          intensity: neonIntensity,
          spread: neonSpread,
          flicker: neonFlicker,
        },
      });
    },
    [effects, neonEnabled, neonColor, neonIntensity, neonSpread, neonFlicker]
  );

  const handleShadowChange = useCallback(
    (enabledOverride?: boolean) => {
      const enabled = enabledOverride !== undefined ? enabledOverride : shadowEnabled;
      if (enabled) {
        onChange({
          ...effects,
          textShadow: { offsetX: shadowX, offsetY: shadowY, blur: shadowBlur, color: shadowColor },
        });
      } else {
        const { textShadow, ...rest } = effects as any;
        onChange(rest);
      }
    },
    [effects, shadowEnabled, shadowX, shadowY, shadowBlur, shadowColor]
  );

  const handleStrokeChange = useCallback(
    (enabledOverride?: boolean) => {
      const enabled = enabledOverride !== undefined ? enabledOverride : strokeEnabled;
      if (enabled) {
        onChange({
          ...effects,
          textStroke: { width: strokeWidth, color: strokeColor },
        });
      } else {
        const { textStroke, ...rest } = effects as any;
        onChange(rest);
      }
    },
    [effects, strokeEnabled, strokeWidth, strokeColor]
  );

  const handleWarpParamsChange = useCallback(
    (updates: Partial<{ rotateX: number; rotateY: number; perspective: number }>) => {
      const newParams = { rotateX: warpRotateX, rotateY: warpRotateY, perspective: warpPerspective, ...updates };
      if (updates.rotateX !== undefined) {
        setWarpRotateX(updates.rotateX);
      }
      if (updates.rotateY !== undefined) {
        setWarpRotateY(updates.rotateY);
      }
      if (updates.perspective !== undefined) {
        setWarpPerspective(updates.perspective);
      }
      onChange({ ...effects, warpParams: newParams });
    },
    [effects, warpRotateX, warpRotateY, warpPerspective]
  );

  const needsWarpParams = warpStyle === 'bulge' || warpStyle === 'squeeze' || warpStyle === 'perspective';

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader
        title="Text Effects"
        action={
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-400 uppercase tracking-widest">
            PRO
          </span>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 flex flex-col">
        {/* Style Type */}
        <div className="space-y-3">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Core Style</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Normal', icon: 'A' },
              { id: 'hollow', label: 'Hollow', icon: '◐' },
              { id: 'lift', label: 'Lift', icon: '▲' },
              { id: 'echo', label: 'Echo', icon: '≋' },
              { id: 'emboss', label: 'Emboss', icon: '⬍' },
              { id: 'deboss', label: 'Deboss', icon: '⬌' },
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

        {/* Emboss/Deboss Depth */}
        {(styleType === 'emboss' || styleType === 'deboss') && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Emboss Depth</label>
              <span className="text-[9px] font-black text-white font-mono">{depth}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={depth || 3}
              onChange={(e) => handleDepthChange(parseInt(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        )}

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
              { id: 'bulge', label: 'Bulge' },
              { id: 'squeeze', label: 'Squeeze' },
              { id: 'perspective', label: 'Persp.' },
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

        {/* Warp Params (Bulge/Squeeze/Perspective) */}
        {needsWarpParams && (
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
              Warp Parameters
            </label>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rotate X</label>
                <span className="text-[9px] font-black text-white font-mono">{warpRotateX}deg</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={warpRotateX}
                onChange={(e) => handleWarpParamsChange({ rotateX: parseInt(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Rotate Y</label>
                <span className="text-[9px] font-black text-white font-mono">{warpRotateY}deg</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={warpRotateY}
                onChange={(e) => handleWarpParamsChange({ rotateY: parseInt(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Perspective</label>
                <span className="text-[9px] font-black text-white font-mono">{warpPerspective}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                value={warpPerspective}
                onChange={(e) => handleWarpParamsChange({ perspective: parseInt(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
          </div>
        )}

        {/* Text Shadow */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Text Shadow</label>
            <button
              onClick={() => {
                setShadowEnabled((prev) => {
                  const next = !prev;
                  handleShadowChange(next);
                  return next;
                });
              }}
              className={`w-10 h-5 rounded-full relative transition-colors ${shadowEnabled ? 'bg-brand-600' : 'bg-white/10'}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${shadowEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          {shadowEnabled && (
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Shadow Color</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-white font-mono uppercase">{shadowColor}</span>
                  <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => {
                      setShadowColor(e.target.value);
                      handleShadowChange();
                    }}
                    className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">X Offset</label>
                  <span className="text-[9px] font-black text-white font-mono">{shadowX}px</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={shadowX}
                  onChange={(e) => {
                    setShadowX(parseInt(e.target.value));
                    handleShadowChange();
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Y Offset</label>
                  <span className="text-[9px] font-black text-white font-mono">{shadowY}px</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={shadowY}
                  onChange={(e) => {
                    setShadowY(parseInt(e.target.value));
                    handleShadowChange();
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Blur</label>
                  <span className="text-[9px] font-black text-white font-mono">{shadowBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={shadowBlur}
                  onChange={(e) => {
                    setShadowBlur(parseInt(e.target.value));
                    handleShadowChange();
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Stroke */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Text Stroke</label>
            <button
              onClick={() => {
                setStrokeEnabled((prev) => {
                  const next = !prev;
                  handleStrokeChange(next);
                  return next;
                });
              }}
              className={`w-10 h-5 rounded-full relative transition-colors ${strokeEnabled ? 'bg-brand-600' : 'bg-white/10'}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${strokeEnabled ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>

          {strokeEnabled && (
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stroke Color</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-white font-mono uppercase">{strokeColor}</span>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                      handleStrokeChange();
                    }}
                    className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stroke Width</label>
                  <span className="text-[9px] font-black text-white font-mono">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => {
                    setStrokeWidth(parseFloat(e.target.value));
                    handleStrokeChange();
                  }}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Neon Glow */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neon Aura</label>
            <button
              onClick={() => {
                setNeonEnabled((prev) => {
                  const next = !prev;
                  handleNeonChange(next);
                  return next;
                });
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
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    Glow Intensity
                  </label>
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
                  : shadowEnabled
                    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
                    : styleType === 'emboss'
                      ? '-1px -1px 1px rgba(255,255,255,0.8), 1px 1px 2px rgba(0,0,0,0.6)'
                      : styleType === 'deboss'
                        ? '1px 1px 1px rgba(255,255,255,0.8), -1px -1px 2px rgba(0,0,0,0.6)'
                        : 'none',
                WebkitTextStroke: strokeEnabled
                  ? `${strokeWidth}px ${strokeColor}`
                  : styleType === 'hollow'
                    ? '1px #7d2ae8'
                    : 'none',
                opacity: styleType === 'hollow' ? 0.8 : 1,
                transform:
                  warpStyle === 'arc'
                    ? `rotateX(${curve}deg)`
                    : warpStyle === 'bulge' || warpStyle === 'squeeze' || warpStyle === 'perspective'
                      ? `perspective(${warpPerspective}px) rotateX(${warpRotateX}deg) rotateY(${warpRotateY}deg)`
                      : 'none',
              }}
            >
              {styleType === 'hollow' ? 'HOLLOW' : 'NEON TEXT'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
