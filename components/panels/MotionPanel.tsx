import React from 'react';
import { AnimationSettings } from '../../types';
import { Icons } from '../../constants';
// import { CompactInput } from '../Toolbar'; // Assuming CompactInput is exported or I'll implement a simple one

const ANIMATION_TYPES = [
  { type: 'none', label: 'None', icon: Icons.Slash || Icons.X },
  { type: 'fade', label: 'Fade', icon: Icons.Eye },
  { type: 'slide', label: 'Slide', icon: Icons.ArrowRight },
  { type: 'zoom', label: 'Zoom', icon: Icons.Maximize },
  { type: 'rotate', label: 'Rotate', icon: Icons.RotateCw },
  { type: 'bounce', label: 'Bounce', icon: Icons.Activity }, // Placeholder icon
  { type: 'pulse', label: 'Pulse', icon: Icons.Zap },
  { type: 'shake', label: 'Shake', icon: Icons.AlertTriangle }, // Placeholder
  { type: 'flip', label: 'Flip', icon: Icons.RefreshCw },
  { type: 'float', label: 'Float', icon: Icons.Cloud },
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'bounce', label: 'Bounce' },
];

import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface MotionPanelProps {
  onPreviewMotion?: (settings: AnimationSettings) => void;
}

export const MotionPanel = React.memo(({ onPreviewMotion }: MotionPanelProps) => {
  const { artboards, selectedLayerIds, updateLayer } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      selectedLayerIds: state.selectedLayerIds,
      updateLayer: state.updateLayer,
    }))
  );

  const allLayers = artboards.flatMap((a) => a.layers);
  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;
  const selectedLayer = allLayers.find((l) => l.id === selectedLayerId) || null;
  const onUpdateLayer = updateLayer;
  if (!selectedLayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
        <Icons.Play className="w-12 h-12 mb-4 text-gray-500" />
        <p className="text-sm font-bold text-white mb-2">No Layer Selected</p>
        <p className="text-[10px] text-gray-400">Select a layer to apply motion effects.</p>
      </div>
    );
  }

  const anim =
    selectedLayer.animation ||
    ({
      type: 'none',
      duration: 1,
      delay: 0,
      easing: 'ease-out',
      iterationCount: 1,
      direction: 'in', // Default
    } as AnimationSettings);

  const updateAnim = (changes: Partial<AnimationSettings>) => {
    const newAnim = { ...anim, ...changes };
    onUpdateLayer(selectedLayer.id, { animation: newAnim });
    onPreviewMotion?.(newAnim);
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      <div className="p-4 border-b border-[#1f1f1f]">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Play className="w-4 h-4 text-brand-600" /> Motion
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Animation Types Grid */}
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => updateAnim({ type: t.type as any })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all aspect-square ${
                anim.type === t.type
                  ? 'bg-brand-600/20 border-brand-600 text-white'
                  : 'bg-surface-dark-3 border-transparent text-gray-400 hover:bg-surface-dark-5 hover:text-white'
              }`}
            >
              <t.icon className="w-6 h-6 mb-2" />
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        {anim.type !== 'none' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="h-px bg-white/10 w-full" />

            {/* Settings */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Timing</span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-mono">{anim.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={anim.duration}
                  onChange={(e) => updateAnim({ duration: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">Delay</span>
                  <span className="text-white font-mono">{anim.delay}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={anim.delay}
                  onChange={(e) => updateAnim({ delay: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Style</span>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block mb-1">Easing</label>
                <select
                  value={anim.easing}
                  onChange={(e) => updateAnim({ easing: e.target.value as any })}
                  className="w-full bg-surface-dark-3 border border-white/10 text-white text-xs rounded p-2 outline-none focus:border-brand-600"
                >
                  {EASING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 block mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {['in', 'out', 'left', 'right', 'up', 'down'].map((dir) => (
                    <button
                      key={dir}
                      onClick={() => updateAnim({ direction: dir as any })}
                      className={`text-[10px] py-1.5 rounded capitalize transition-all ${anim.direction === dir ? 'bg-brand-600 text-white' : 'bg-surface-dark-3 text-gray-400 hover:bg-surface-dark-5'}`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onPreviewMotion?.(anim)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                <Icons.Play className="w-3.5 h-3.5" /> Preview Motion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  MotionPanel.displayName = 'MotionPanel';
});
export default function MotionPanelWrapped(props: React.ComponentProps<typeof MotionPanel>) {
  return (
    <PanelErrorBoundary panelName="Motion">
      <MotionPanel {...props} />
    </PanelErrorBoundary>
  );
}
