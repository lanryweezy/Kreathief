import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { ColorPicker } from '../ColorPicker';
import { MaskTools } from './MaskTools';
import { Dropdown } from '../Dropdown';
import { Layer, ShapeLayer } from '../../types';
import { pathOperationsService } from '../../services/pathOperationsService';
import { VectorUtils } from '../../utils/vectorUtils';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

interface ShapeToolsProps {
  layer: Layer;
  selectedLayers: Layer[];
  handleUpdateLayer: (changes: any) => void;
  documentColors?: string[];
  isPro?: boolean;
  onOpenPricing?: () => void;
  onConvertToPath?: (id: string) => void;
}

const ShadowControls = ({
  layer,
  documentColors,
  onUpdate,
}: {
  layer: Layer;
  documentColors?: string[];
  onUpdate: (changes: any) => void;
}) => {
  const sliders = [
    { label: 'Blur', key: 'blur', max: 100 },
    { label: 'X', key: 'offsetX', min: -50, max: 50 },
    { label: 'Y', key: 'offsetY', min: -50, max: 50 },
  ];

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!layer.shadow}
            onChange={(e) =>
              onUpdate({
                shadow: e.target.checked ? { color: '#000000', blur: 10, offsetX: 5, offsetY: 5 } : undefined,
              })
            }
            className="accent-accent w-3 h-3"
          />
          Drop Shadow
        </span>
      </div>
      {layer.shadow && (
        <div className="space-y-3 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
            <ColorPicker
              value={layer.shadow.color}
              onChange={(color) => onUpdate({ shadow: { ...layer.shadow!, color } })}
              small
              documentColors={documentColors}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-500 font-bold uppercase">Opacity</span>
              <span className="text-[9px] text-white font-mono">{Math.round((layer.shadow.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layer.shadow.opacity ?? 1}
              onChange={(e) => onUpdate({ shadow: { ...layer.shadow!, opacity: parseFloat(e.target.value) } })}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[9px] text-gray-500 font-bold uppercase">Inner Shadow</label>
            <input
              type="checkbox"
              checked={!!layer.shadow.inset}
              onChange={(e) => onUpdate({ shadow: { ...layer.shadow!, inset: e.target.checked } })}
              className="accent-accent w-3 h-3"
            />
          </div>
          {sliders.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500 font-bold uppercase">{s.label}</span>
                <span className="text-[9px] text-white font-mono">{(layer.shadow as any)[s.key]}</span>
              </div>
              <input
                type="range"
                min={s.min ?? 0}
                max={s.max}
                value={(layer.shadow as any)[s.key]}
                onChange={(e) => onUpdate({ shadow: { ...layer.shadow!, [s.key]: parseInt(e.target.value) } })}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ShapeTools = React.memo(
  ({
    layer,
    selectedLayers,
    handleUpdateLayer,
    documentColors,
    isPro,
    onOpenPricing,
    onConvertToPath,
  }: ShapeToolsProps) => {
    const [showEffects, setShowEffects] = React.useState(false);
    const [showBooleanOps, setShowBooleanOps] = React.useState(false);
    const effectsButtonRef = useRef<HTMLButtonElement>(null);
    const booleanOpsRef = useRef<HTMLButtonElement>(null);

    const { updateLayer, deleteLayer, saveToHistory } = useStore(
      useShallow((state) => ({
        updateLayer: state.updateLayer,
        deleteLayer: state.deleteLayer,
        saveToHistory: state.saveToHistory,
      }))
    );

    const handleBooleanOp = (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => {
      if (selectedLayers.length < 2) return;

      const baseLayer = selectedLayers[0] as ShapeLayer;
      const operandLayer = selectedLayers[1] as ShapeLayer;

      if (!baseLayer || !operandLayer) return;

      const basePathData = (baseLayer as any).pathData;
      const operandPathData = (operandLayer as any).pathData;

      if (!basePathData || !operandPathData) return;

      const basePath = VectorUtils.parsePath(basePathData);
      const operandPath = VectorUtils.parsePath(operandPathData);

      if (!basePath || !operandPath) return;

      saveToHistory();

      let resultPath;
      switch (operation) {
        case 'union':
          resultPath = pathOperationsService.union(basePath, operandPath);
          break;
        case 'subtract':
          resultPath = pathOperationsService.subtract(basePath, operandPath);
          break;
        case 'intersect':
          resultPath = pathOperationsService.intersect(basePath, operandPath);
          break;
        case 'exclude':
          resultPath = pathOperationsService.exclude(basePath, operandPath);
          break;
      }

      const newPathData = VectorUtils.serializePath(resultPath);
      const bounds = VectorUtils.getBounds(resultPath);

      updateLayer(baseLayer.id, {
        pathData: newPathData,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      } as any);

      deleteLayer(operandLayer.id);
      setShowBooleanOps(false);
    };

    const updateFilter = (key: string, value: number) => {
      const currentFilters = (layer as any).filters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      };
      handleUpdateLayer({ filters: { ...currentFilters, [key]: value } });
    };

    return (
      <div className="flex items-center gap-2 flex-nowrap">
        <ColorPicker
          value={(layer as any).color}
          onChange={(color) => handleUpdateLayer({ color, backgroundImage: undefined })}
          documentColors={documentColors}
        />
        <MaskTools
          layer={layer}
          onUpdateLayer={handleUpdateLayer}
          isPro={isPro}
          onOpenPricing={onOpenPricing}
          documentColors={documentColors}
        />
        <Divider />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={layer.opacity}
            onChange={(e) => handleUpdateLayer({ opacity: parseFloat(e.target.value) })}
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>

        <Divider />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">R</span>
          <input
            type="number"
            min="0"
            max="500"
            value={(layer as any).cornerRadius || 0}
            onChange={(e) => handleUpdateLayer({ cornerRadius: Math.max(0, parseInt(e.target.value || '0')) })}
            className="w-12 bg-black/40 border border-white/10 rounded text-center text-[10px] text-white p-1"
            title="Corner Radius"
          />
        </div>

        <Divider />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fill</span>
          <ColorPicker
            small
            value={(layer as any).color}
            onChange={(color) => handleUpdateLayer({ color, backgroundImage: undefined })}
            documentColors={documentColors}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stroke</span>
          <ColorPicker
            small
            value={(layer as any).stroke?.color || '#ffffff'}
            onChange={(c) =>
              handleUpdateLayer({
                stroke: { ...(layer as any).stroke, color: c, width: (layer as any).stroke?.width || 1 },
              })
            }
            documentColors={documentColors}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={(layer as any).stroke?.width ?? 0}
            onChange={(e) =>
              handleUpdateLayer({
                stroke: {
                  ...(layer as any).stroke,
                  width: Math.min(100, Math.max(0, parseInt(e.target.value || '0'))),
                  color: (layer as any).stroke?.color || '#ffffff',
                },
              })
            }
            className="w-12 bg-black/40 border border-white/10 rounded text-center text-[10px] text-white p-1"
            title="Stroke Width (0-100)"
          />
        </div>

        <Divider />

        <div className="flex items-center gap-0.5">
          <IconButton
            onClick={() => handleUpdateLayer({ flipX: !(layer as ShapeLayer).flipX })}
            active={!!(layer as ShapeLayer).flipX}
            title="Flip Horizontal"
          >
            <Icons.FlipHorizontal
              className={`w-4 h-4 ${(layer as ShapeLayer).flipX ? 'text-cyan-400' : 'text-gray-400'}`}
            />
          </IconButton>
          <IconButton
            onClick={() => handleUpdateLayer({ flipY: !(layer as ShapeLayer).flipY })}
            active={!!(layer as ShapeLayer).flipY}
            title="Flip Vertical"
          >
            <Icons.FlipVertical
              className={`w-4 h-4 ${(layer as ShapeLayer).flipY ? 'text-cyan-400' : 'text-gray-400'}`}
            />
          </IconButton>
        </div>

        <Divider />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Skew</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-gray-500">X</span>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={(layer as any).skewX ?? 0}
              onChange={(e) => handleUpdateLayer({ skewX: parseInt(e.target.value) })}
              className="w-14 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              title={`Skew X: ${(layer as any).skewX ?? 0}°`}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-gray-500">Y</span>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={(layer as any).skewY ?? 0}
              onChange={(e) => handleUpdateLayer({ skewY: parseInt(e.target.value) })}
              className="w-14 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              title={`Skew Y: ${(layer as any).skewY ?? 0}°`}
            />
          </div>
        </div>

        <Divider />

        <div className="relative">
          <button
            ref={effectsButtonRef}
            onClick={() => setShowEffects(!showEffects)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showEffects ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
          >
            <Icons.Sliders className="w-3.5 h-3.5" /> Effects
          </button>
          <Dropdown
            anchorRef={effectsButtonRef}
            isOpen={showEffects}
            onClose={() => setShowEffects(false)}
            align="left"
          >
            <div className="w-64 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-4 animate-fadeIn space-y-4 backdrop-blur-xl">
              <ShadowControls layer={layer} documentColors={documentColors} onUpdate={handleUpdateLayer} />

              {/* Filters Section */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                  Filters
                </span>
                <div className="space-y-3">
                  {[
                    { label: 'Blur', key: 'blur', min: 0, max: 20 },
                    { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
                    { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                    { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">{f.label}</span>
                        <span className="text-[9px] text-white font-mono">
                          {(layer as any).filters?.[f.key] ?? (f.key === 'blur' ? 0 : 100)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        value={(layer as any).filters?.[f.key] ?? (f.key === 'blur' ? 0 : 100)}
                        onChange={(e) => updateFilter(f.key, parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Radius</span>
                  <input
                    type="number"
                    value={(layer as any).cornerRadius || 0}
                    onChange={(e) => handleUpdateLayer({ cornerRadius: parseInt(e.target.value) })}
                    className="w-12 bg-black/40 border border-white/10 rounded text-center text-xs text-white p-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {[
                    { label: 'TL', key: 'tl' },
                    { label: 'TR', key: 'tr' },
                    { label: 'BR', key: 'br' },
                    { label: 'BL', key: 'bl' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className="text-[8px] text-gray-500 w-4">{label}</span>
                      <input
                        type="number"
                        value={(layer as any).cornerRadiusPerCorner?.[key] ?? (layer as any).cornerRadius ?? 0}
                        onChange={(e) => {
                          const current = (layer as any).cornerRadiusPerCorner || { tl: 0, tr: 0, br: 0, bl: 0 };
                          handleUpdateLayer({ cornerRadiusPerCorner: { ...current, [key]: parseInt(e.target.value) } });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded text-[10px] text-white p-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Stroke Section */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Stroke</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Width</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-14 bg-black/40 border border-white/10 rounded text-center text-xs text-white p-1"
                      value={(layer as any).stroke?.width ?? 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          stroke: {
                            ...(layer as any).stroke,
                            width: Math.min(100, Math.max(0, parseInt(e.target.value || '0'))),
                            color: (layer as any).stroke?.color || '#ffffff',
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
                    <ColorPicker
                      small
                      value={(layer as any).stroke?.color || '#ffffff'}
                      onChange={(c) =>
                        handleUpdateLayer({
                          stroke: { ...(layer as any).stroke, color: c, width: (layer as any).stroke?.width || 1 },
                        })
                      }
                      documentColors={documentColors}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Pattern</span>
                    <select
                      className="bg-black/40 border border-white/10 rounded text-xs text-white p-1"
                      value={(layer as any).strokeDasharray || ''}
                      onChange={(e) => handleUpdateLayer({ strokeDasharray: e.target.value || undefined })}
                    >
                      <option value="">Solid</option>
                      <option value="8 4">Dashed</option>
                      <option value="2 4">Dotted</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Alignment</span>
                    <select
                      className="bg-black/40 border border-white/10 rounded text-xs text-white p-1"
                      value={(layer as any).stroke?.alignment || 'center'}
                      onChange={(e) =>
                        handleUpdateLayer({ stroke: { ...(layer as any).stroke, alignment: e.target.value as any } })
                      }
                    >
                      <option value="inside">Inside</option>
                      <option value="center">Center</option>
                      <option value="outside">Outside</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      className="bg-black/40 border border-white/10 rounded text-xs text-white p-1 flex-1"
                      value={(layer as any).stroke?.cap || 'round'}
                      onChange={(e) =>
                        handleUpdateLayer({ stroke: { ...(layer as any).stroke, cap: e.target.value as any } })
                      }
                    >
                      <option value="butt">Cap: Butt</option>
                      <option value="round">Cap: Round</option>
                      <option value="square">Cap: Square</option>
                    </select>
                    <select
                      className="bg-black/40 border border-white/10 rounded text-xs text-white p-1 flex-1"
                      value={(layer as any).stroke?.join || 'miter'}
                      onChange={(e) =>
                        handleUpdateLayer({ stroke: { ...(layer as any).stroke, join: e.target.value as any } })
                      }
                    >
                      <option value="miter">Join: Miter</option>
                      <option value="round">Join: Round</option>
                      <option value="bevel">Join: Bevel</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Profile</span>
                    <select
                      className="bg-black/40 border border-white/10 rounded text-xs text-white p-1"
                      value={(layer as any).strokeProfile || 'uniform'}
                      onChange={(e) => handleUpdateLayer({ strokeProfile: e.target.value })}
                    >
                      <option value="uniform">Uniform</option>
                      <option value="taper-start">Taper Start</option>
                      <option value="taper-end">Taper End</option>
                      <option value="taper-both">Taper Both</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Path Effects */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                  Path Effects
                </span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Roughen</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={(layer as any).pathEffects?.roughen?.amount || 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          pathEffects: { ...(layer as any).pathEffects, roughen: { amount: parseInt(e.target.value) } },
                        })
                      }
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Zig-Zag Amp</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={(layer as any).pathEffects?.zigzag?.amplitude || 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          pathEffects: {
                            ...(layer as any).pathEffects,
                            zigzag: {
                              amplitude: parseInt(e.target.value),
                              frequency: (layer as any).pathEffects?.zigzag?.frequency || 6,
                            },
                          },
                        })
                      }
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Zig-Zag Freq</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={(layer as any).pathEffects?.zigzag?.frequency || 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          pathEffects: {
                            ...(layer as any).pathEffects,
                            zigzag: {
                              amplitude: (layer as any).pathEffects?.zigzag?.amplitude || 6,
                              frequency: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Offset</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={(layer as any).pathEffects?.offset?.distance || 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          pathEffects: {
                            ...(layer as any).pathEffects,
                            offset: { distance: parseInt(e.target.value) },
                          },
                        })
                      }
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Dropdown>
        </div>

        {onConvertToPath && layer.type !== 'path' && (
          <IconButton onClick={() => onConvertToPath(layer.id)} title="Convert to Path">
            <Icons.ExternalLink className="w-4 h-4" />
          </IconButton>
        )}

        {/* Boolean Operations - Show when 2+ layers selected */}
        {selectedLayers.length >= 2 && (
          <div className="relative">
            <button
              ref={booleanOpsRef}
              onClick={() => setShowBooleanOps(!showBooleanOps)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showBooleanOps ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-purple-900/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
            >
              <Icons.Scissors className="w-3.5 h-3.5" /> Boolean
            </button>
            <Dropdown
              anchorRef={booleanOpsRef}
              isOpen={showBooleanOps}
              onClose={() => setShowBooleanOps(false)}
              align="left"
            >
              <div className="w-48 bg-surface-dark-3 rounded-xl shadow-2xl border border-white/10 p-2 animate-fadeIn">
                <div className="space-y-1">
                  <button
                    onClick={() => handleBooleanOp('union')}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-brand-500">∪</span> Union
                  </button>
                  <button
                    onClick={() => handleBooleanOp('subtract')}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-red-500">−</span> Subtract
                  </button>
                  <button
                    onClick={() => handleBooleanOp('intersect')}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-green-500">∩</span> Intersect
                  </button>
                  <button
                    onClick={() => handleBooleanOp('exclude')}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-yellow-500">⊕</span> Exclude
                  </button>
                </div>
                <div className="mt-2 px-3 py-1 text-[9px] text-gray-500">
                  First selected layer = base, second = operand
                </div>
              </div>
            </Dropdown>
          </div>
        )}
      </div>
    );
  }
);

ShapeTools.displayName = 'ShapeTools';
