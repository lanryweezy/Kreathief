import React, { useRef } from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { ColorPicker } from '../ColorPicker';
import { MaskTools } from './MaskTools';
import { Dropdown } from '../Dropdown';
import { Layer } from '../../types';

interface ShapeToolsProps {
  layer: Layer;
  handleUpdateLayer: (changes: any) => void;
  documentColors?: string[];
  isPro?: boolean;
  onOpenPricing?: () => void;
  onConvertToPath?: (id: string) => void;
}

export const ShapeTools = React.memo(
  ({ layer, handleUpdateLayer, documentColors, isPro, onOpenPricing, onConvertToPath }: ShapeToolsProps) => {
    const [showEffects, setShowEffects] = React.useState(false);
    const effectsButtonRef = useRef<HTMLButtonElement>(null);

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
      <div className="flex items-center gap-3 flex-nowrap">
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
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]"
            title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>

        <Divider />

        <div className="relative">
          <button
            ref={effectsButtonRef}
            onClick={() => setShowEffects(!showEffects)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${showEffects ? 'bg-[#00c4cc] border-[#00c4cc] text-white shadow-lg shadow-[#00c4cc]/30' : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/20 hover:bg-black/30'}`}
          >
            <Icons.Sliders className="w-3.5 h-3.5" /> Effects
          </button>
          <Dropdown
            anchorRef={effectsButtonRef}
            isOpen={showEffects}
            onClose={() => setShowEffects(false)}
            align="left"
          >
            <div className="w-64 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 p-4 animate-fadeIn space-y-4 backdrop-blur-xl">
              {/* Shadow Section */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!layer.shadow}
                      onChange={(e) =>
                        handleUpdateLayer({
                          shadow: e.target.checked ? { color: '#000000', blur: 10, offsetX: 5, offsetY: 5 } : undefined,
                        })
                      }
                      className="accent-[#00c4cc] w-3 h-3"
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
                        onChange={(color) => handleUpdateLayer({ shadow: { ...layer.shadow!, color } })}
                        small
                        documentColors={documentColors}
                      />
                    </div>
                    {[
                      { label: 'Blur', key: 'blur', max: 50 },
                      { label: 'X', key: 'offsetX', min: -50, max: 50 },
                      { label: 'Y', key: 'offsetY', min: -50, max: 50 },
                    ].map((idx) => (
                      <div key={idx.key} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{idx.label}</span>
                          <span className="text-[9px] text-white font-mono">{(layer.shadow as any)[idx.key]}</span>
                        </div>
                        <input
                          type="range"
                          min={idx.min ?? 0}
                          max={idx.max}
                          value={(layer.shadow as any)[idx.key]}
                          onChange={(e) =>
                            handleUpdateLayer({ shadow: { ...layer.shadow!, [idx.key]: parseInt(e.target.value) } })
                          }
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Radius</span>
                  <input
                    type="number"
                    value={(layer as any).cornerRadius || 0}
                    onChange={(e: any) => handleUpdateLayer({ cornerRadius: parseInt(e.target.value) })}
                    className="w-12 bg-black/40 border border-white/10 rounded text-center text-xs text-white p-1"
                  />
                </div>
              </div>
                          {/* Stroke Section */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Stroke</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Width</span>
                    <input type="number" className="w-14 bg-black/40 border border-white/10 rounded text-center text-xs text-white p-1"
                      value={(layer as any).stroke?.width ?? 0}
                      onChange={(e:any)=> handleUpdateLayer({ stroke: { ...(layer as any).stroke, width: parseInt(e.target.value || '0'), color: (layer as any).stroke?.color || '#ffffff' }})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Color</span>
                    <ColorPicker small value={(layer as any).stroke?.color || '#ffffff'} onChange={(c)=> handleUpdateLayer({ stroke: { ...(layer as any).stroke, color: c, width: (layer as any).stroke?.width || 1 }})} documentColors={documentColors} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select className="bg-black/40 border border-white/10 rounded text-xs text-white p-1 flex-1" value={(layer as any).stroke?.cap || 'round'} onChange={(e)=> handleUpdateLayer({ stroke: { ...(layer as any).stroke, cap: e.target.value as any }})}>
                      <option value="butt">Cap: Butt</option>
                      <option value="round">Cap: Round</option>
                      <option value="square">Cap: Square</option>
                    </select>
                    <select className="bg-black/40 border border-white/10 rounded text-xs text-white p-1 flex-1" value={(layer as any).stroke?.join || 'miter'} onChange={(e)=> handleUpdateLayer({ stroke: { ...(layer as any).stroke, join: e.target.value as any }})}>
                      <option value="miter">Join: Miter</option>
                      <option value="round">Join: Round</option>
                      <option value="bevel">Join: Bevel</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Profile</span>
                    <select className="bg-black/40 border border-white/10 rounded text-xs text-white p-1" value={(layer as any).strokeProfile || 'uniform'} onChange={(e)=> handleUpdateLayer({ strokeProfile: e.target.value })}>
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Path Effects</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Roughen</label>
                    <input type="range" min="0" max="20" value={(layer as any).pathEffects?.roughen?.amount || 0}
                      onChange={(e)=> handleUpdateLayer({ pathEffects: { ...(layer as any).pathEffects, roughen: { amount: parseInt(e.target.value) }}})}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Zig-Zag Amp</label>
                    <input type="range" min="0" max="20" value={(layer as any).pathEffects?.zigzag?.amplitude || 0}
                      onChange={(e)=> handleUpdateLayer({ pathEffects: { ...(layer as any).pathEffects, zigzag: { amplitude: parseInt(e.target.value), frequency: ((layer as any).pathEffects?.zigzag?.frequency || 6) }}})}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Zig-Zag Freq</label>
                    <input type="range" min="0" max="20" value={(layer as any).pathEffects?.zigzag?.frequency || 0}
                      onChange={(e)=> handleUpdateLayer({ pathEffects: { ...(layer as any).pathEffects, zigzag: { amplitude: ((layer as any).pathEffects?.zigzag?.amplitude || 6), frequency: parseInt(e.target.value) }}})}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Offset</label>
                    <input type="range" min="0" max="30" value={(layer as any).pathEffects?.offset?.distance || 0}
                      onChange={(e)=> handleUpdateLayer({ pathEffects: { ...(layer as any).pathEffects, offset: { distance: parseInt(e.target.value) }}})}
                      className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00c4cc]" />
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
      </div>
    );
  }
);

ShapeTools.displayName = 'ShapeTools';


