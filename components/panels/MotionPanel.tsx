import React from 'react';
import { AnimationSettings } from '../../types';
import { Icons } from '../../constants';
import { PanelHeader } from './PanelHeader';

const ANIMATION_TYPES = [
  { type: 'none', label: 'None', icon: Icons.Slash || Icons.X },
  { type: 'fade', label: 'Fade', icon: Icons.Eye },
  { type: 'slide', label: 'Slide', icon: Icons.ArrowRight },
  { type: 'zoom', label: 'Zoom', icon: Icons.Maximize },
  { type: 'rotate', label: 'Rotate', icon: Icons.RotateCw },
  { type: 'bounce', label: 'Bounce', icon: Icons.Activity },
  { type: 'pulse', label: 'Pulse', icon: Icons.Zap },
  { type: 'shake', label: 'Shake', icon: Icons.AlertTriangle },
  { type: 'flip', label: 'Flip', icon: Icons.RefreshCw },
  { type: 'float', label: 'Float', icon: Icons.Cloud },
  { type: 'path', label: 'Motion Path', icon: Icons.Compass || Icons.Play },
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
import { generateBeatSyncedDelays, analyzeAudioBeatSync } from '../../utils/motion/beatSync';
import { extractPathFromLayer } from '../../utils/motion/motionPath';
import { pageAnimationStrategies } from '../../utils/motion/pageAnimationStrategies';

import { PanelErrorBoundary } from './PanelErrorBoundary';

interface MotionPanelProps {
  onPreviewMotion?: (settings: AnimationSettings) => void;
}

export const MotionPanel = React.memo(({ onPreviewMotion }: MotionPanelProps) => {
  const { artboards, activeArtboardId, selectedLayerIds, updateLayer } = useStore(
    useShallow((state) => ({
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectedLayerIds: state.selectedLayerIds,
      updateLayer: state.updateLayer,
    }))
  );

  const [bpm, setBpm] = React.useState<number>(128);
  const [subdivision, setSubdivision] = React.useState<'whole' | 'half' | 'quarter' | 'eighth'>('quarter');
  const [isAnalyzingAudio, setIsAnalyzingAudio] = React.useState(false);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;
  // ⚡ Bolt Optimization: Use an imperative loop instead of `artboards.flatMap(a => a.layers).find(...)`
  // to avoid O(N) array allocation and allow for early termination when finding the selected layer.
  let selectedLayer = null;
  if (selectedLayerId) {
    for (let i = 0; i < artboards.length; i++) {
      const layers = artboards[i].layers;
      for (let j = 0; j < layers.length; j++) {
        if (layers[j].id === selectedLayerId) {
          selectedLayer = layers[j];
          break;
        }
      }
      if (selectedLayer) {break;}
    }
  }
  const onUpdateLayer = updateLayer;

  const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
  const availablePathLayers = (activeArtboard?.layers || []).filter(
    (l) => l.type === 'path' || (l as any).shapeType === 'path' || !!(l as any).pathData
  );

  const applyBeatSyncToArtboard = () => {
    if (!activeArtboard) {
      return;
    }
    const layers = activeArtboard.layers;
    const delays = generateBeatSyncedDelays(layers.length, bpm, subdivision);

    layers.forEach((layer, idx) => {
      const existing = layer.animation || {
        type: 'zoom',
        duration: 0.5,
        delay: 0,
        easing: 'ease-out',
        iterationCount: 1,
      };
      const newType = existing.type === 'none' ? 'zoom' : existing.type;
      onUpdateLayer(layer.id, {
        animation: {
          ...existing,
          type: newType,
          delay: delays[idx] || 0,
        },
      });
    });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsAnalyzingAudio(true);
      const buffer = await file.arrayBuffer();
      const result = await analyzeAudioBeatSync(buffer);
      setBpm(result.bpm);
    } catch {
      // Audio analysis error fallback
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  if (!selectedLayer) {
    const applyPageAnimation = (type: string) => {
      if (!activeArtboard) {
        return;
      }

      const layers = activeArtboard.layers;
      layers.forEach((layer, idx) => {
        let animSettings: AnimationSettings = {
          type: 'none',
          duration: 0,
          delay: 0,
          easing: 'linear',
          iterationCount: 1,
        };
        const staggerDelay = idx * 0.15;

        const strategy = pageAnimationStrategies.get(type);
        if (strategy) {
          animSettings = strategy.getSettings(staggerDelay);
        } else {
          animSettings = { type: 'none', duration: 0, delay: 0, easing: 'linear', iterationCount: 1 };
        }

        onUpdateLayer(layer.id, { animation: animSettings });
      });
    };

    return (
      <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
        <PanelHeader title="Motion" icon={<Icons.Play className="w-5 h-5" />} />

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div className="text-center space-y-2 mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Page Animations</h3>
            <p className="text-[10px] text-gray-400">
              1-click preset choreography for all layers on the current artboard.
            </p>
          </div>

          <div className="space-y-2.5">
            {Array.from(pageAnimationStrategies.values()).map((pa) => (
              <button
                key={pa.id}
                onClick={() => applyPageAnimation(pa.id)}
                className="w-full flex items-center gap-3.5 p-3 bg-surface-dark-3 hover:bg-surface-dark-4 border border-white/5 hover:border-brand-500/50 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400">
                  <pa.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-bold text-white">{pa.label}</div>
                  <div className="text-[10px] text-gray-400">{pa.desc}</div>
                </div>
              </button>
            ))}

            <button
              onClick={() => applyPageAnimation('none')}
              className="w-full p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-xs font-bold mt-2"
            >
              Remove All Animations
            </button>
          </div>

          <div className="h-px bg-white/10 w-full my-4" />

          {/* Beat Sync Section */}
          <div className="space-y-3 p-4 bg-surface-dark-3/60 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Activity className="w-3.5 h-3.5 text-brand-400" /> Beat Sync
              </span>
              <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                {bpm} BPM
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              Quantize all layer animation entry delays to musical rhythm and beats.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Tempo</span>
                <span className="text-white font-mono">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                step="1"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 block">Subdivision</label>
              <div className="grid grid-cols-4 gap-1">
                {(['whole', 'half', 'quarter', 'eighth'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubdivision(sub)}
                    className={`text-[9px] py-1 rounded font-bold capitalize transition-all ${
                      subdivision === sub
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-dark-4 text-gray-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              <button
                onClick={() => audioInputRef.current?.click()}
                disabled={isAnalyzingAudio}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 transition-all flex items-center justify-center gap-1.5"
              >
                <Icons.Upload className="w-3 h-3" />
                {isAnalyzingAudio ? 'Detecting BPM...' : 'Auto-Detect Track'}
              </button>
              <button
                onClick={applyBeatSyncToArtboard}
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-[10px] font-bold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Icons.Zap className="w-3 h-3" />
                Apply Sync
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full my-4" />

          <div className="flex flex-col items-center justify-center p-5 text-center opacity-60 bg-black/20 rounded-2xl border border-white/5">
            <Icons.Layers className="w-6 h-6 mb-2 text-gray-500" />
            <p className="text-[11px] font-bold text-white mb-0.5 uppercase tracking-widest">Custom Layer Animation</p>
            <p className="text-[10px] text-gray-400">
              Select any individual layer to apply specific motion effects or trajectories.
            </p>
          </div>
        </div>
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
      direction: 'in',
      autoRotate: true,
    } as AnimationSettings);

  const updateAnim = (changes: Partial<AnimationSettings>) => {
    const newAnim = { ...anim, ...changes };
    onUpdateLayer(selectedLayer.id, { animation: newAnim });
    onPreviewMotion?.(newAnim);
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader title="Motion" icon={<Icons.Play className="w-5 h-5" />} />
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 flex flex-col">
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
              <t.icon className="w-5 h-5 mb-1.5" />
              <span className="text-[10px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        {anim.type === 'path' && (
          <div className="space-y-4 animate-fadeIn p-3.5 bg-surface-dark-3 rounded-xl border border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Motion Path Trajectory</span>
            <p className="text-[10px] text-gray-400">
              Attach this layer to glide along any vector pen stroke or drawn path.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 block">Select Vector Path</label>
              {availablePathLayers.length > 0 ? (
                <select
                  value={anim.motionPathId || ''}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    const chosenLayer = availablePathLayers.find((pl) => pl.id === chosenId);
                    if (chosenLayer) {
                      const extracted = extractPathFromLayer(chosenLayer);
                      updateAnim({
                        motionPathId: chosenId,
                        pathData: extracted || undefined,
                      });
                    }
                  }}
                  className="w-full bg-surface-dark-4 border border-white/10 text-white text-xs rounded p-2 outline-none focus:border-brand-600"
                >
                  <option value="">-- Choose a path layer --</option>
                  {availablePathLayers.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name || `Path (${pl.type})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-[10px] text-amber-400/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  Draw a path on the canvas using the Draw/Pen tool first to bind as a motion trajectory.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-300">Orient Along Tangent (Auto-Rotate)</span>
              <input
                type="checkbox"
                checked={anim.autoRotate !== false}
                onChange={(e) => updateAnim({ autoRotate: e.target.checked })}
                className="rounded text-brand-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        )}

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
                  max="10"
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

              {anim.type !== 'path' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Direction</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['in', 'out', 'left', 'right', 'up', 'down'].map((dir) => (
                      <button
                        key={dir}
                        onClick={() => updateAnim({ direction: dir as any })}
                        className={`text-[10px] py-1.5 rounded capitalize transition-all ${
                          anim.direction === dir
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-dark-3 text-gray-400 hover:bg-surface-dark-5'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => onPreviewMotion?.(anim)}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
              >
                <Icons.Play className="w-3.5 h-3.5 fill-current" /> Preview Motion
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
