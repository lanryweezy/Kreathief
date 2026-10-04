import React, { useState } from 'react';
import { PanelHeader } from './PanelHeader';
import { useStore } from '../../store/useStore';
import {
  ALL_TEXTURE_DEFINITIONS,
  TextureDefinition,
  createTextureOverlayConfig,
} from '../../services/textureOverlayEngine';
import { TextLayer } from '../../types';

export const TexturesPanel: React.FC = () => {
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const updateArtboard = useStore((state) => state.updateArtboard);
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const updateLayer = useStore((state) => state.updateLayer);

  const activeArtboard = artboards.find((a) => a.id === activeArtboardId) || artboards[0];
  const selectedLayer = activeArtboard?.layers.find((l) => selectedLayerIds.includes(l.id));

  const [target, setTarget] = useState<'artboard' | 'layer'>('artboard');
  const [selectedTextureId, setSelectedTextureId] = useState<string | null>(
    activeArtboard?.textureOverlay?.id || null
  );
  const [opacity, setOpacity] = useState<number>(activeArtboard?.textureOverlay?.opacity ?? 0.35);
  const [blendMode, setBlendMode] = useState<'overlay' | 'multiply' | 'screen' | 'soft-light' | 'hard-light' | 'normal'>(
    activeArtboard?.textureOverlay?.blendMode ?? 'multiply'
  );
  const [scale, setScale] = useState<number>(activeArtboard?.textureOverlay?.scale ?? 1);
  const [invert, setInvert] = useState<boolean>(activeArtboard?.textureOverlay?.invert ?? false);

  const handleApplyTexture = (def: TextureDefinition) => {
    setSelectedTextureId(def.id);
    const newOpacity = def.defaultOpacity;
    const newBlend = def.defaultBlendMode;
    setOpacity(newOpacity);
    setBlendMode(newBlend);

    const config = createTextureOverlayConfig(def.id, {
      opacity: newOpacity,
      blendMode: newBlend,
      scale,
      invert,
    });

    if (!config) return;

    if (target === 'artboard' && activeArtboard) {
      updateArtboard(activeArtboard.id, {
        textureOverlay: config,
      });
    } else if (target === 'layer' && selectedLayer) {
      if (selectedLayer.type === 'text') {
        updateLayer(selectedLayer.id, {
          textTextureUrl: config.svgDataUri,
        } as Partial<TextLayer>);
      } else {
        updateLayer(selectedLayer.id, {
          color: `url(${config.svgDataUri})`,
        });
      }
    }
  };

  const handleUpdateControls = (updates: {
    opacity?: number;
    blendMode?: 'overlay' | 'multiply' | 'screen' | 'soft-light' | 'hard-light' | 'normal';
    scale?: number;
    invert?: boolean;
  }) => {
    if (updates.opacity !== undefined) setOpacity(updates.opacity);
    if (updates.blendMode !== undefined) setBlendMode(updates.blendMode);
    if (updates.scale !== undefined) setScale(updates.scale);
    if (updates.invert !== undefined) setInvert(updates.invert);

    if (selectedTextureId && activeArtboard && target === 'artboard') {
      const config = createTextureOverlayConfig(selectedTextureId, {
        opacity: updates.opacity ?? opacity,
        blendMode: updates.blendMode ?? blendMode,
        scale: updates.scale ?? scale,
        invert: updates.invert ?? invert,
      });
      if (config) {
        updateArtboard(activeArtboard.id, { textureOverlay: config });
      }
    }
  };

  const handleRemoveTexture = () => {
    setSelectedTextureId(null);
    if (target === 'artboard' && activeArtboard) {
      updateArtboard(activeArtboard.id, { textureOverlay: undefined });
    } else if (target === 'layer' && selectedLayer) {
      if (selectedLayer.type === 'text') {
        updateLayer(selectedLayer.id, {
          textTextureUrl: undefined,
        } as Partial<TextLayer>);
      }
    }
  };

  const isAppliedToArtboard = !!activeArtboard?.textureOverlay;

  return (
    <div className="flex flex-col h-full bg-surface-dark-2 overflow-hidden">
      <PanelHeader
        title="Vector Textures"
        action={
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-400 uppercase tracking-widest">
            SVG
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5">
        {/* Target Switcher */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Apply Texture To</label>
          <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              data-testid="texture-target-artboard"
              onClick={() => setTarget('artboard')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                target === 'artboard'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🖼️ Canvas Artboard
            </button>
            <button
              type="button"
              data-testid="texture-target-layer"
              onClick={() => setTarget('layer')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                target === 'layer'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔤 Selected Layer
            </button>
          </div>
          {target === 'layer' && !selectedLayer && (
            <p className="text-[9px] text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              Select a text or shape layer on the canvas to clip texture into it.
            </p>
          )}
        </div>

        {/* Adjustments (Visible when texture is active or selected) */}
        {(selectedTextureId || isAppliedToArtboard) && target === 'artboard' && (
          <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                Overlay Adjustments
              </span>
              <button
                type="button"
                onClick={handleRemoveTexture}
                className="text-[9px] font-bold text-red-400 hover:text-red-300 underline"
              >
                Clear Texture
              </button>
            </div>

            {/* Blend Mode */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Blend Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {(['multiply', 'overlay', 'screen', 'soft-light', 'hard-light', 'normal'] as const).map((bm) => (
                  <button
                    key={bm}
                    type="button"
                    data-testid={`blendmode-${bm}`}
                    onClick={() => handleUpdateControls({ blendMode: bm })}
                    className={`py-1 px-1.5 text-[8px] font-bold uppercase rounded border transition-all truncate ${
                      blendMode === bm
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {bm}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-gray-400 uppercase">Opacity</span>
                <span className="text-white font-mono">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => handleUpdateControls({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Invert Polarity */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Invert Color (Dark/Light)</span>
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => handleUpdateControls({ invert: e.target.checked })}
                className="rounded accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* Textures Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
              10 Vector Textures
            </label>
            <span className="text-[9px] font-mono text-purple-400">100% SVG Vector</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ALL_TEXTURE_DEFINITIONS.map((texture) => {
              const isSelected = selectedTextureId === texture.id;
              const dataUri = texture.generateSvgUri();

              return (
                <button
                  key={texture.id}
                  data-testid={`texture-card-${texture.id}`}
                  onClick={() => handleApplyTexture(texture)}
                  className={`group relative flex flex-col p-2 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/30'
                      : 'bg-black/30 border-white/10 hover:border-purple-500/40 hover:bg-white/5'
                  }`}
                >
                  {/* Visual SVG Pattern Swatch */}
                  <div
                    className="w-full h-12 rounded-lg mb-1.5 overflow-hidden border border-white/10 shadow-inner bg-slate-900 transition-transform group-hover:scale-[1.02]"
                    style={{
                      backgroundImage: `url("${dataUri}")`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: '40px',
                    }}
                  />

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black text-white flex items-center gap-1 truncate">
                      <span>{texture.icon}</span>
                      <span className="truncate">{texture.name}</span>
                    </span>
                  </div>

                  <p className="text-[8px] text-gray-400 mt-0.5 line-clamp-1 leading-tight">
                    {texture.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
