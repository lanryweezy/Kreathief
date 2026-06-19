import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { Dropdown } from '../Dropdown';
import { TextLayer } from '../../types';

interface QuickTextEffectsProps {
  layer: TextLayer;
  onUpdateLayer: (id: string, changes: Partial<TextLayer>) => void;
}

export const QuickTextEffects: React.FC<QuickTextEffectsProps> = ({ layer, onUpdateLayer }) => {
  const [showEffects, setShowEffects] = React.useState(false);
  const effectsButtonRef = useRef<HTMLButtonElement>(null);

  const hasShadow = !!layer.shadow || (layer.advancedShadows && layer.advancedShadows.length > 0);
  const has3D = !!layer.depth && layer.depth > 0;
  const hasTransform = !!layer.transformType && layer.transformType !== 'none';
  const hasCurve = !!layer.curve && layer.curve !== 0;

  const toggleShadow = () => {
    if (hasShadow) {
      onUpdateLayer(layer.id, { shadow: undefined, advancedShadows: [] });
    } else {
      onUpdateLayer(layer.id, {
        shadow: { color: '#000000', blur: 5, offsetX: 3, offsetY: 3 },
      });
    }
    setShowEffects(false);
  };

  const toggle3D = () => {
    if (has3D) {
      onUpdateLayer(layer.id, { depth: 0 });
    } else {
      onUpdateLayer(layer.id, { depth: 5, depthColor: '#333333' });
    }
    setShowEffects(false);
  };

  const setTransform = (type: string) => {
    if (layer.transformType === type) {
      onUpdateLayer(layer.id, { transformType: 'none', transformIntensity: 50 });
    } else {
      onUpdateLayer(layer.id, { transformType: type, transformIntensity: 50 });
    }
    setShowEffects(false);
  };

  const setCurve = (value: number) => {
    onUpdateLayer(layer.id, { curve: value });
    setShowEffects(false);
  };

  return (
    <>
      <button
        ref={effectsButtonRef}
        onClick={() => setShowEffects(!showEffects)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
          hasShadow || has3D || hasTransform || hasCurve
            ? 'bg-[#7d2ae8] border-[#7d2ae8] text-white shadow-lg shadow-[#7d2ae8]/30'
            : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'
        }`}
        title="Text Effects"
      >
        <Icons.Zap className="w-3.5 h-3.5" /> Effects
      </button>

      <Dropdown anchorRef={effectsButtonRef} isOpen={showEffects} onClose={() => setShowEffects(false)} align="left">
        <div className="w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-3 animate-fadeIn backdrop-blur-xl">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Effects</h4>

          {/* Toggle Effects */}
          <div className="space-y-2 mb-4">
            <button
              onClick={toggleShadow}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                hasShadow
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icons.Layers className="w-3.5 h-3.5" /> Shadow
              </span>
              {hasShadow && <Icons.Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggle3D}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                has3D
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icons.Box className="w-3.5 h-3.5" /> 3D Depth
              </span>
              {has3D && <Icons.Check className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Transform Types */}
          <div className="border-t border-white/10 pt-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transform</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'arch', label: 'Arch', icon: Icons.ChevronUp },
                { id: 'wave', label: 'Wave', icon: Icons.Activity },
                { id: 'rise', label: 'Rise', icon: Icons.TrendingUp },
                { id: 'flag', label: 'Flag', icon: Icons.Flag },
                { id: 'fish', label: 'Fish', icon: Icons.Circle },
                { id: 'circle', label: 'Circle', icon: Icons.RotateCw },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTransform(t.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    layer.transformType === t.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                  title={t.label}
                >
                  <t.icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[7px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Curve Slider */}
          <div className="border-t border-white/10 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400">Curve</span>
              <span className="text-[10px] text-purple-400 font-mono">{layer.curve || 0}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={layer.curve || 0}
              onChange={(e) => setCurve(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
            />
          </div>

          {/* More Effects Link */}
          <div className="border-t border-white/10 pt-3 mt-3">
            <button
              onClick={() => {
                setShowEffects(false);
                // Dispatch event to open Effects panel in sidebar
                window.dispatchEvent(new CustomEvent('open-effects-panel'));
              }}
              className="w-full text-center text-[10px] text-purple-400 hover:text-purple-300 font-bold"
            >
              More Effects →
            </button>
          </div>
        </div>
      </Dropdown>
    </>
  );
};
