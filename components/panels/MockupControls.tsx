import React from 'react';
import { Icons } from '../../constants';
import { MockupPlacement, getMockupById } from '../../services/enhancedMockupsLibrary';
import { CornerPoints, getDefaultCornerPoints } from '../../services/perspectiveTransform';

export interface MockupControlsProps {
  variant: 'default' | 'full';
  activeTab: 'placement' | 'effects' | 'presets';
  setActiveTab: (tab: 'placement' | 'effects' | 'presets') => void;
  placement: MockupPlacement;
  updatePlacement: (key: keyof MockupPlacement, val: any) => void;
  setPlacement: React.Dispatch<React.SetStateAction<MockupPlacement>>;
  shadowIntensity: number;
  setShadowIntensity: (v: number) => void;
  reflectionIntensity: number;
  setReflectionIntensity: (v: number) => void;
  lightingBrightness: number;
  setLightingBrightness: (v: number) => void;
  lightingContrast: number;
  setLightingContrast: (v: number) => void;
  useCornerPinning: boolean;
  setUseCornerPinning: (v: boolean) => void;
  setCornerPoints: (cp: CornerPoints | null) => void;
  curve: number;
  setCurve: (v: number) => void;
  perspectivePreset: 'flat' | 'angled' | 'curved';
  setPerspectivePreset: (p: 'flat' | 'angled' | 'curved') => void;
  previewContainerSize: { width: number; height: number };
  activeMockupId: string;
  handleDownload: () => void;
  handleProRender: () => void;
  isProGenerating: boolean;
  handleAddToCanvas: () => void;
}

export const MockupControls: React.FC<MockupControlsProps> = ({
  variant,
  activeTab,
  setActiveTab,
  placement,
  updatePlacement,
  setPlacement,
  shadowIntensity,
  setShadowIntensity,
  reflectionIntensity,
  setReflectionIntensity,
  lightingBrightness,
  setLightingBrightness,
  lightingContrast,
  setLightingContrast,
  useCornerPinning,
  setUseCornerPinning,
  setCornerPoints,
  curve,
  setCurve,
  perspectivePreset,
  setPerspectivePreset,
  previewContainerSize,
  activeMockupId,
  handleDownload,
  handleProRender,
  isProGenerating,
  handleAddToCanvas,
}) => {
  if (variant === 'full') {
    return (
      <div className="w-[320px] flex flex-col border-l border-gray-800 bg-surface-dark-2 shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600">Settings</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-all"
              title="Download Mockup"
            >
              <Icons.Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddToCanvas}
              className="p-1.5 bg-brand-600/20 hover:bg-brand-600/30 rounded-md text-brand-600 transition-all"
              title="Add to Canvas"
            >
              <Icons.Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-8">
          <div className="p-4 bg-gradient-to-br from-brand-600/10 to-transparent border border-brand-600/20 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                Corner Pinning (4-Point Perspective)
              </span>
              <button
                onClick={() => {
                  setUseCornerPinning(!useCornerPinning);
                  if (!useCornerPinning) {
                    const defaultCorners = getDefaultCornerPoints(
                      previewContainerSize.width,
                      previewContainerSize.height,
                      placement
                    );
                    setCornerPoints(defaultCorners);
                  }
                }}
                className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${
                  useCornerPinning ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/5 text-gray-500'
                }`}
              >
                {useCornerPinning ? 'ON' : 'OFF'}
              </button>
            </div>

            {useCornerPinning && (
              <div className="space-y-4">
                <div className="flex gap-1.5">
                  {(['flat', 'angled', 'curved'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setPerspectivePreset(preset);
                        if (preset === 'flat') {
                          setCurve(0);
                          updatePlacement('skewX', 0);
                          updatePlacement('skewY', 0);
                        } else if (preset === 'angled') {
                          updatePlacement('skewX', 10);
                          updatePlacement('skewY', 5);
                        } else if (preset === 'curved') {
                          setCurve(15);
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${
                        perspectivePreset === preset
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                    <span>Curve Intensity</span>
                    <span className="text-brand-600">{curve}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    aria-label="Curve Intensity"
                    value={curve}
                    onChange={(e) => setCurve(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Position (X / Y)</span>
                <span className="text-[10px] font-mono text-brand-600">
                  {Math.round(placement.left)}%, {Math.round(placement.top)}%
                </span>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label="Position X"
                  value={placement.left}
                  onChange={(e) => updatePlacement('left', Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label="Position Y"
                  value={placement.top}
                  onChange={(e) => updatePlacement('top', Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                Scale / Rotate
              </span>
              <div className="space-y-4">
                <input
                  type="range"
                  min="10"
                  max="150"
                  aria-label="Scale"
                  value={placement.width}
                  onChange={(e) => updatePlacement('width', Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                />
                <input
                  type="range"
                  min="-180"
                  max="180"
                  aria-label="Rotate"
                  value={placement.rotate}
                  onChange={(e) => updatePlacement('rotate', Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>

            {!useCornerPinning && (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                  Perspective (Skew X / Y)
                </span>
                <div className="space-y-4">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    aria-label="Perspective Skew X"
                    value={placement.skewX || 0}
                    onChange={(e) => updatePlacement('skewX', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-accent"
                  />
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    aria-label="Perspective Skew Y"
                    value={placement.skewY || 0}
                    onChange={(e) => updatePlacement('skewY', Number(e.target.value))}
                    className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-accent"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800 space-y-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">
                3D Lighting & Shadows
              </span>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                  <span>Shadow Intensity</span>
                  <span className="text-white">{shadowIntensity}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  aria-label="Shadow Intensity"
                  value={shadowIntensity}
                  onChange={(e) => setShadowIntensity(Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                  <span
                    className="cursor-pointer hover:text-white transition-colors"
                    title="Double-click to reset to 0.5"
                    onDoubleClick={() => setReflectionIntensity(0.5)}
                  >
                    Reflection Gloss
                  </span>
                  <span className="text-white">{Math.round(reflectionIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  aria-label="Reflection Gloss"
                  value={reflectionIntensity}
                  onChange={(e) => setReflectionIntensity(Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                  <span
                    className="cursor-pointer hover:text-white transition-colors"
                    title="Double-click to reset to 100%"
                    onDoubleClick={() => setLightingBrightness(100)}
                  >
                    Brightness
                  </span>
                  <span className="text-white">{lightingBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  aria-label="Brightness"
                  value={lightingBrightness}
                  onChange={(e) => setLightingBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                  <span
                    className="cursor-pointer hover:text-white transition-colors"
                    title="Double-click to reset to 100%"
                    onDoubleClick={() => setLightingContrast(100)}
                  >
                    Contrast
                  </span>
                  <span className="text-white">{lightingContrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  aria-label="Contrast"
                  value={lightingContrast}
                  onChange={(e) => setLightingContrast(Number(e.target.value))}
                  className="w-full h-1 bg-surface-dark-3 rounded-full appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Blend Mode</span>
              <select
                value={placement.blendMode}
                onChange={(e) => updatePlacement('blendMode', e.target.value)}
                className="w-full bg-surface-dark-3 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-600 appearance-none"
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply (Realistic)</option>
                <option value="screen">Screen (Light)</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleProRender}
            disabled={isProGenerating}
            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              isProGenerating
                ? 'bg-white/5 text-gray-600'
                : 'bg-gradient-to-r from-brand-600 to-accent text-white shadow-lg shadow-purple-500/10'
            }`}
          >
            {isProGenerating ? (
              'Creating...'
            ) : (
              <>
                <Icons.Zap className="w-3.5 h-3.5 text-yellow-300" /> Create Mockup
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d21]">
      <div className="flex border-b border-gray-800 bg-surface-dark-2">
        {(['placement', 'effects', 'presets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-600/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'placement' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Position (X / Y)</span>
                <span className="text-gray-500 font-mono">
                  {Math.round(placement.left)}%, {Math.round(placement.top)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label="Position X"
                  value={placement.left}
                  onChange={(e) => updatePlacement('left', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  aria-label="Position Y"
                  value={placement.top}
                  onChange={(e) => updatePlacement('top', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Scale / Rotate</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min="10"
                  max="150"
                  aria-label="Scale"
                  value={placement.width}
                  onChange={(e) => updatePlacement('width', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <input
                  type="range"
                  min="-180"
                  max="180"
                  aria-label="Rotate"
                  value={placement.rotate}
                  onChange={(e) => updatePlacement('rotate', Number(e.target.value))}
                  className="h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider">
                  4-Point Perspective
                </span>
                <button
                  onClick={() => {
                    setUseCornerPinning(!useCornerPinning);
                    if (!useCornerPinning) {
                      const defaultCorners = getDefaultCornerPoints(
                        previewContainerSize.width - 32,
                        previewContainerSize.height - 32,
                        placement
                      );
                      setCornerPoints(defaultCorners);
                    }
                  }}
                  className={`px-3 py-1 rounded text-[9px] font-bold border transition-all ${
                    useCornerPinning
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300'
                  }`}
                >
                  {useCornerPinning ? 'ON' : 'OFF'}
                </button>
              </div>
              {useCornerPinning && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[8px] text-gray-500 uppercase">Cylindrical Curve</span>
                    <span className="text-[8px] text-white">{curve}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    aria-label="Cylindrical Curve"
                    aria-label="Curve Intensity"
                    value={curve}
                    onChange={(e) => setCurve(Number(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Blend Mode</label>
              <div className="grid grid-cols-1 gap-2">
                {['source-over', 'multiply', 'screen', 'overlay', 'soft-light'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePlacement('blendMode', mode)}
                    className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all text-left flex justify-between items-center ${
                      placement.blendMode === mode
                        ? 'bg-brand-600/20 border-brand-600 text-white'
                        : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    <span className="capitalize">{mode.replace('-', ' ')}</span>
                    {placement.blendMode === mode && <Icons.Check className="w-3 h-3 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Design Opacity</span>
                <span className="text-white font-mono">{Math.round((placement.opacity || 0.9) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                aria-label="Design Opacity"
                value={placement.opacity || 0.9}
                onChange={(e) => updatePlacement('opacity', Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg space-y-3">
              <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Smart Alignment</h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    const current = getMockupById(activeMockupId);
                    if (current) {
                      setPlacement(current.defaultPlacement);
                    }
                  }}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <Icons.Magic className="w-3 h-3" />
                  Reset to Mockup Default
                </button>
                <button
                  onClick={() => {
                    const current = getMockupById(activeMockupId);
                    if (current) {
                      const isApparel = current.category === 'Apparel';
                      updatePlacement('blendMode', isApparel ? 'multiply' : 'source-over');
                      updatePlacement('opacity', isApparel ? 0.85 : 1);
                    }
                  }}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <Icons.Zap className="w-3 h-3" />
                  Apply Smart Realistic Blend
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-800/20 border border-gray-700 rounded-lg space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transform Reset</h4>
              <button
                onClick={() => setPlacement({ ...placement, skewX: 0, skewY: 0, rotate: 0 })}
                className="w-full py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
              >
                <Icons.RefreshCw className="w-3 h-3" />
                Clear Rotation & Skew
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-surface-dark-2 border-t border-gray-800 flex flex-col gap-2">
        <button
          onClick={handleDownload}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Download className="w-4 h-4" />
          Quick Download
        </button>
        <button
          onClick={handleProRender}
          disabled={isProGenerating}
          className={`w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isProGenerating
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 to-accent hover:from-brand-700 hover:to-accent-dark text-white shadow-lg'
          }`}
        >
          {isProGenerating ? (
            <>
              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
              Rendering...
            </>
          ) : (
            <>
              <Icons.Zap className="w-4 h-4 text-yellow-300" />
              Pro Render (Dynamic)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
