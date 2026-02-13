
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, CanvasFilters, LayerFilters, CanvasSize, User, BrushType } from '../types';
import { Icons, FONT_FAMILIES } from '../constants';
import { loadFont } from '../services/FontLoader';
import { ColorPicker } from './ColorPicker';
import { CanvasSizePicker } from './CanvasSizePicker';
import { FontPicker } from './FontPicker';
import * as geminiService from '../services/geminiService';
import * as imageProcessor from '../utils/imageProcessor';

interface ToolbarProps {
   selectedLayer: Layer | null;
   uploadedImage: string | null;
   canvasBackgroundColor: string;
   onSetCanvasBackgroundColor: (color: string) => void;
   canvasFilters: CanvasFilters;
   onUpdateCanvasFilters: (filters: Partial<CanvasFilters>) => void;

   onUpdateTextLayer: (id: string, changes: Partial<TextLayer>) => void;
   onUpdateShapeLayer: (id: string, changes: Partial<ShapeLayer>) => void;
   onUpdateImageLayer?: (id: string, changes: Partial<ImageLayer>) => void;

   onDeleteLayer: (id: string) => void;
   onDuplicateLayer: (id: string) => void;
   onMoveLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
   onAlignLayers?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
   onDistributeLayers?: (direction: 'horizontal' | 'vertical') => void;
   selectedLayerIds?: string[];

   onMagicWrite: (id: string) => void;
   onInteractionStart: () => void;
   onRemix?: (layerId: string) => void;
   documentColors?: string[];

   onToggleEraser?: () => void;
   isEraserActive?: boolean;
   canvasSize: CanvasSize;
   onUpdateCanvasSize: (size: CanvasSize) => void;
   user: User;
   onOpenPricing: () => void;
   onGroup?: () => void;
   onUngroup?: () => void;
   onToggleDesignSuggestions?: () => void;
   onToggleSmartContent?: () => void;
   onToggleQualityScore?: () => void;
}

const FILTER_PRESETS: { name: string, filters: Partial<LayerFilters> }[] = [
   { name: 'Normal', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0 } },
   { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, grayscale: 100, blur: 0, sepia: 0, hueRotate: 0, vignette: 20 } },
   { name: 'Sepia', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 100, hueRotate: 0, vignette: 30 } },
   { name: 'Vintage', filters: { brightness: 110, contrast: 80, saturation: 70, grayscale: 0, blur: 0, sepia: 40, hueRotate: 0, vignette: 40 } },
   { name: 'Cyber', filters: { brightness: 110, contrast: 120, saturation: 150, grayscale: 0, blur: 0, sepia: 0, hueRotate: 180, vignette: 0 } },
   { name: 'Fade', filters: { brightness: 120, contrast: 90, saturation: 80, grayscale: 0, blur: 1, sepia: 10, hueRotate: 0, vignette: 10 } },
];

const CANVAS_EFFECT_PRESETS: { name: string; description: string; filters: Partial<CanvasFilters> }[] = [
   {
      name: 'Clean',
      description: 'Subtle contrast boost',
      filters: { brightness: 105, contrast: 110, saturation: 105, sepia: 0, grayscale: 0, blur: 0, vignette: 0, opacity: 1 }
   },
   {
      name: 'Bold',
      description: 'High contrast & punch',
      filters: { brightness: 105, contrast: 130, saturation: 120, sepia: 0, grayscale: 0, blur: 0, vignette: 10, opacity: 1 }
   },
   {
      name: 'Vintage',
      description: 'Soft, slightly faded',
      filters: { brightness: 110, contrast: 90, saturation: 85, sepia: 30, grayscale: 0, blur: 0.5, vignette: 20, opacity: 1 }
   },
   {
      name: 'Noir',
      description: 'Classic B&W film',
      filters: { brightness: 100, contrast: 130, saturation: 0, sepia: 0, grayscale: 100, blur: 0, vignette: 40, opacity: 1 }
   },
   {
      name: 'Retro',
      description: '70s warm vibe',
      filters: { brightness: 100, contrast: 90, saturation: 120, sepia: 20, grayscale: 0, blur: 0, vignette: 20, opacity: 1 }
   }
];

// -- Shared UI Components --

const Divider = React.memo(() => <div className="h-6 w-px bg-gray-700/50 mx-1 sm:mx-2 shrink-0 hidden sm:block"></div>);

const IconButton = React.memo(({ onClick, active, title, children, disabled, className = '' }: any) => (
   <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-all duration-150 ${active
         ? 'bg-[#7d2ae8] text-white shadow-md shadow-[#7d2ae8]/20'
         : 'text-gray-400 hover:bg-gray-700 hover:text-white'
         } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
      title={title}
   >
      {children}
   </button>
));

const CompactInput = React.memo(({ value, onChange, min, max, label, width = "w-12", step = 1, onFocus }: any) => (
   <div className="flex items-center gap-1.5 bg-[#252627] border border-gray-700 rounded px-1.5 py-1 focus-within:border-[#7d2ae8] transition-colors group">
      {label && <span className="text-[9px] font-bold text-gray-500 group-focus-within:text-[#7d2ae8] select-none cursor-default">{label}</span>}
      <input
         type="number"
         min={min} max={max} step={step}
         className={`bg-transparent text-[11px] text-white outline-none font-mono text-center no-spinner ${width}`}
         value={Math.round(value)}
         onFocus={onFocus}
         onChange={onChange}
         onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
   </div>
));

// -- Contextual Tool Sections --

const CanvasTools = React.memo(({
   onToggleDesignSuggestions, onToggleSmartContent, onToggleQualityScore,
   canvasBackgroundColor, onSetCanvasBackgroundColor, onInteractionStart,
   documentColors, canvasFilters, onUpdateCanvasFilters,
   canvasSize, onUpdateCanvasSize
}: any) => (
   <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-800/30 border border-gray-700/50 shrink-0">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden sm:inline">Canvas</span>
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide sm:hidden">BG</span>
      </div>

      <CanvasSizePicker
         currentSize={canvasSize}
         onSizeChange={onUpdateCanvasSize}
      />

      <Divider />
      {/* AI Tools Section */}
      <div className="flex items-center gap-1.5 p-0.5 bg-[#252627] rounded border border-gray-700">
         <button
            onClick={onToggleDesignSuggestions}
            className="px-2 py-1 hover:bg-[#7d2ae8]/20 text-[#00c4cc] text-[10px] font-bold transition-all flex items-center gap-1.5"
            title="AI Design Suggestions (#81)"
         >
            <Icons.Magic className="w-3.5 h-3.5" /> Suggestions
         </button>
         <div className="w-px h-4 bg-gray-700"></div>
         <button
            onClick={onToggleSmartContent}
            className="px-2 py-1 hover:bg-[#7d2ae8]/20 text-[#a855f7] text-[10px] font-bold transition-all flex items-center gap-1.5"
            title="AI Content Generator (#82)"
         >
            <Icons.Bot className="w-3.5 h-3.5" /> Smart Text
         </button>
         <div className="w-px h-4 bg-gray-700"></div>
         <button
            onClick={onToggleQualityScore}
            className="px-2 py-1 hover:bg-[#7d2ae8]/20 text-emerald-400 text-[10px] font-bold transition-all flex items-center gap-1.5"
            title="Design Quality & Accessibility Score"
         >
            <Icons.Check className="w-3.5 h-3.5" /> Check Quality
         </button>
      </div>
      <Divider />
      <div className="flex items-center gap-1.5 sm:gap-2">
         <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">BG</span>
         <ColorPicker
            value={canvasBackgroundColor}
            onChange={(color) => { onInteractionStart(); onSetCanvasBackgroundColor(color); }}
            documentColors={documentColors}
         />
      </div>
      <Divider />
      <div className="flex items-center gap-4">
         {[
            { icon: Icons.Sun, val: canvasFilters.brightness, key: 'brightness', max: 200, title: 'Brightness' },
            { icon: Icons.Contrast, val: canvasFilters.contrast, key: 'contrast', max: 200, title: 'Contrast' },
            { icon: Icons.Droplet, val: canvasFilters.saturation, key: 'saturation', max: 200, title: 'Saturation' },
         ].map((item) => (
            <div key={item.key} className="flex items-center gap-2 group" title={item.title}>
               <item.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
               <input
                  type="range" min="0" max={item.max}
                  value={item.val}
                  onChange={(e) => onUpdateCanvasFilters({ [item.key]: parseInt(e.target.value) })}
                  onMouseDown={onInteractionStart}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
               />
            </div>
         ))}
      </div>
      <Divider />
      <div className="flex flex-col gap-1.5">
         <div className="flex items-center gap-1.5 px-1">
            <Icons.Sparkles className="w-3 h-3 text-[#7d2ae8]" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Styles & Looks</span>
         </div>
         <div className="flex items-center gap-2">
            {CANVAS_EFFECT_PRESETS.map((preset) => (
               <button
                  key={preset.name}
                  title={preset.description}
                  onClick={() => { onInteractionStart(); onUpdateCanvasFilters({ ...preset.filters }); }}
                  className="group relative w-12 h-10 rounded-md overflow-hidden border border-gray-700 hover:border-[#7d2ae8] transition-all bg-[#0e1318]"
               >
                  {/* Visual Swatch Preview (Placeholder gradient based on filter types) */}
                  <div className={`absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity ${preset.name === 'Vintage' ? 'bg-amber-900/50' :
                     preset.name === 'Noir' ? 'bg-gray-900' :
                        preset.name === 'Vivid' ? 'bg-gradient-to-tr from-purple-500 to-blue-500' : 'bg-gray-800'
                     }`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[8px] font-black uppercase text-white tracking-tighter drop-shadow-md">
                        {preset.name}
                     </span>
                  </div>
               </button>
            ))}
         </div>
      </div>
   </div>
));

const TransformTools = React.memo(({ selectedLayer, handleUpdateLayer, isPro, onOpenPricing }: any) => {
   const [showAdvanced, setShowAdvanced] = useState(false);

   return (
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
         <div className="flex items-center gap-1">
            <CompactInput label="X" value={selectedLayer.x} onChange={(e: any) => handleUpdateLayer({ x: parseInt(e.target.value) })} width="w-10 sm:w-12" />
            <CompactInput label="Y" value={selectedLayer.y} onChange={(e: any) => handleUpdateLayer({ y: parseInt(e.target.value) })} width="w-10 sm:w-12" />
         </div>
         <Divider />
         <div className="flex items-center gap-1">
            <CompactInput label="W" value={selectedLayer.width} onChange={(e: any) => handleUpdateLayer({ width: parseInt(e.target.value) })} min={10} width="w-10 sm:w-12" />
            {selectedLayer.type !== 'text' && (
               <CompactInput label="H" value={(selectedLayer as any).height || 0} onChange={(e: any) => handleUpdateLayer({ height: parseInt(e.target.value) })} min={10} width="w-10 sm:w-12" />
            )}
         </div>

         <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showAdvanced ? 'bg-[#7d2ae8]/20 border-[#7d2ae8]/50 text-[#7d2ae8]' : 'bg-[#252627] border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white'}`}
         >
            <Icons.Settings className={`w-3 h-3 ${showAdvanced ? 'animate-spin-slow' : ''}`} />
            Advanced
         </button>

         {showAdvanced && (
            <div className="flex items-center gap-2 sm:gap-4 animate-fadeIn border-l border-gray-700 ml-2 pl-4">
               <div className="flex items-center gap-1.5">
                  <Icons.RotateCw className="w-3 h-3 text-gray-500" />
                  <CompactInput label="R" value={selectedLayer.rotation} onChange={(e: any) => handleUpdateLayer({ rotation: parseInt(e.target.value) })} min={0} max={360} width="w-9 sm:w-10" />
               </div>
               <Divider />
               <div className="flex items-center gap-1 p-0.5 bg-[#252627] rounded border border-gray-700">
                  <span className="text-[9px] font-bold text-gray-500 px-1 uppercase tracking-tighter hidden lg:inline">Distort</span>
                  <CompactInput label="RX" value={(selectedLayer as any).rotateX || 0} onChange={(e: any) => handleUpdateLayer({ rotateX: parseInt(e.target.value) })} min={-180} max={180} width="w-8 sm:w-9" />
                  <CompactInput label="RY" value={(selectedLayer as any).rotateY || 0} onChange={(e: any) => handleUpdateLayer({ rotateY: parseInt(e.target.value) })} min={-180} max={180} width="w-8 sm:w-9" />
                  <CompactInput label="P" value={(selectedLayer as any).perspective || 0} onChange={(e: any) => handleUpdateLayer({ perspective: parseInt(e.target.value) })} min={0} max={2000} width="w-10 sm:w-12" />
               </div>
            </div>
         )}
      </div>
   );
});

const TextTools = React.memo(({
   layer, onUpdateTextLayer, onInteractionStart, documentColors, onMagicWrite,
   showFontPicker, setShowFontPicker, fontSearch, setFontSearch, fontPickerRef,
   showRewriteTones, setShowRewriteTones, rewriteRef, filteredFonts,
   handleToneRewrite, showTextEffects, setShowTextEffects, textEffectsRef
}: any) => (
   <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      <div className="relative" ref={fontPickerRef}>
         <button
            onClick={() => setShowFontPicker(!showFontPicker)}
            className="w-32 sm:w-36 bg-[#252627] border border-gray-700 rounded px-2 py-1 text-xs text-white text-left flex justify-between items-center hover:border-gray-500 transition-colors"
            title="Font Family"
         >
            <span className="truncate mr-2 font-medium">{layer.fontFamily}</span>
            <Icons.ChevronDown className="w-3 h-3 text-gray-500" />
         </button>
         {showFontPicker && (
            <FontPicker
               currentFont={layer.fontFamily}
               onSelectFont={(font) => {
                  loadFont(font);
                  onUpdateTextLayer(layer.id, { fontFamily: font });
                  setShowFontPicker(false);
               }}
               onClose={() => setShowFontPicker(false)}
               search={fontSearch}
               setSearch={setFontSearch}
            />
         )}
      </div>

      <CompactInput value={layer.fontSize} onChange={(e: any) => onUpdateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })} min={8} max={500} width="w-10" />
      <ColorPicker value={layer.color} onChange={(color) => onUpdateTextLayer(layer.id, { color, gradient: undefined })} documentColors={documentColors} />

      <div className="w-px h-6 bg-gray-700/50 mx-1 hidden sm:block"></div>

      <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
         <IconButton onClick={() => onUpdateTextLayer(layer.id, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })} active={layer.fontWeight === 'bold'} title="Bold"><Icons.Bold className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onUpdateTextLayer(layer.id, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })} active={layer.fontStyle === 'italic'} title="Italic"><Icons.Italic className="w-3.5 h-3.5" /></IconButton>
      </div>

      <div className="flex items-center gap-1">
         <CompactInput label="AV" value={layer.letterSpacing || 0} onChange={(e: any) => onUpdateTextLayer(layer.id, { letterSpacing: parseFloat(e.target.value) })} step={0.1} width="w-8" title="Letter Spacing" />
         <CompactInput label="LH" value={layer.lineHeight || 1.2} onChange={(e: any) => onUpdateTextLayer(layer.id, { lineHeight: parseFloat(e.target.value) })} step={0.1} width="w-8" title="Line Height" />
      </div>

      <div className="w-px h-6 bg-gray-700/50 mx-1 hidden sm:block"></div>

      <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
         <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'left' })} active={layer.textAlign === 'left'} title="Align Left"><Icons.AlignLeft className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'center' })} active={layer.textAlign === 'center'} title="Align Center"><Icons.AlignCenter className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onUpdateTextLayer(layer.id, { textAlign: 'right' })} active={layer.textAlign === 'right'} title="Align Right"><Icons.AlignRight className="w-3.5 h-3.5" /></IconButton>
      </div>

      <div className="relative" ref={textEffectsRef}>
         <button
            onClick={() => setShowTextEffects(!showTextEffects)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showTextEffects ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-[#252627] border-gray-700 text-gray-300 hover:border-gray-500'}`}
         >
            <Icons.Magic className="w-3 h-3" /> Effects
         </button>

         {showTextEffects && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-700 p-4 z-50 animate-fadeIn space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

               {/* Shadow Section */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <input
                           type="checkbox"
                           checked={!!layer.shadow}
                           onChange={(e) => onUpdateTextLayer(layer.id, { shadow: e.target.checked ? { color: '#000000', blur: 4, offsetX: 2, offsetY: 2 } : undefined })}
                           className="accent-[#7d2ae8]"
                        />
                        Drop Shadow
                     </span>
                  </div>
                  {layer.shadow && (
                     <div className="space-y-2 pl-4 border-l-2 border-gray-700 ml-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] text-gray-500">Color</span>
                           <ColorPicker value={layer.shadow.color} onChange={(color) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, color } })} small />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-gray-500 w-8">Blur</span>
                           <input type="range" min="0" max="20" value={layer.shadow.blur} onChange={(e) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, blur: parseInt(e.target.value) } })} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-gray-500 w-8">X</span>
                           <input type="range" min="-20" max="20" value={layer.shadow.offsetX} onChange={(e) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, offsetX: parseInt(e.target.value) } })} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-gray-500 w-8">Y</span>
                           <input type="range" min="-20" max="20" value={layer.shadow.offsetY} onChange={(e) => onUpdateTextLayer(layer.id, { shadow: { ...layer.shadow!, offsetY: parseInt(e.target.value) } })} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                        </div>
                     </div>
                  )}
               </div>

               <Divider />

               {/* Outline / Stroke Section */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <input
                           type="checkbox"
                           checked={!!layer.stroke}
                           onChange={(e) => onUpdateTextLayer(layer.id, { stroke: e.target.checked ? { color: '#000000', width: 1 } : undefined })}
                           className="accent-[#7d2ae8]"
                        />
                        Outline
                     </span>
                  </div>
                  {layer.stroke && (
                     <div className="space-y-2 pl-4 border-l-2 border-gray-700 ml-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] text-gray-500">Color</span>
                           <ColorPicker value={layer.stroke.color} onChange={(color) => onUpdateTextLayer(layer.id, { stroke: { ...layer.stroke!, color } })} small />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-gray-500 w-8">Width</span>
                           <input type="range" min="1" max="10" value={layer.stroke.width} onChange={(e) => onUpdateTextLayer(layer.id, { stroke: { ...layer.stroke!, width: parseInt(e.target.value) } })} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                        </div>
                     </div>
                  )}
               </div>

               <Divider />

               {/* Warp / Curve Section */}
               <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Curved Text</span>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                     {['none', 'arc', 'flag', 'rise'].map((style) => (
                        <button
                           key={style}
                           onClick={() => onUpdateTextLayer(layer.id, { warpStyle: style as any, curve: layer.curve || 50 })}
                           className={`text-[9px] py-1 rounded border capitalize ${layer.warpStyle === style || (!layer.warpStyle && style === 'none') ? 'bg-[#7d2ae8] text-white border-[#7d2ae8]' : 'bg-[#252627] text-gray-400 border-gray-600 hover:border-gray-500'}`}
                        >
                           {style}
                        </button>
                     ))}
                  </div>
                  {layer.warpStyle && layer.warpStyle !== 'none' && (
                     <div className="flex items-center gap-2 pl-1">
                        <span className="text-[9px] text-gray-500 w-8">Bend</span>
                        <input type="range" min="-100" max="100" value={layer.curve || 0} onChange={(e) => onUpdateTextLayer(layer.id, { curve: parseInt(e.target.value) })} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>

      {/* AI Rewrite Tools */}
      <div className="relative" ref={rewriteRef}>
         <div className="flex items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-purple-500/30 rounded overflow-hidden">
            <button onClick={() => onMagicWrite(layer.id)} className="px-2 py-1 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold transition-all flex items-center gap-1">
               <Icons.Magic className="w-3 h-3" /> Rewrite
            </button>
            <button onClick={() => setShowRewriteTones(!showRewriteTones)} className="px-1 py-1 border-l border-purple-500/30 hover:bg-purple-500/20 text-purple-300 transition-all">
               <Icons.ChevronDown className="w-3 h-3" />
            </button>
         </div>
         {showRewriteTones && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-[#1e1e1e] border border-gray-700 rounded shadow-xl z-50 p-1 animate-fadeIn">
               {[
                  { label: 'Magic', icon: Icons.Magic, instruction: 'Rewrite this to be more creative and catchy.' },
                  { label: 'Shorten', icon: Icons.Minus, instruction: 'Rewrite this to be shorter and more concise.' },
                  { label: 'Expand', icon: Icons.Plus, instruction: 'Rewrite this to be longer and more descriptive.' },
                  { label: 'Pro', icon: Icons.Check, instruction: 'Rewrite this to be more professional and corporate.' },
                  { label: 'Funny', icon: Icons.Bot, instruction: 'Rewrite this to be funny and witty.' },
               ].map(tone => (
                  <button key={tone.label} onClick={() => handleToneRewrite(layer.id, tone.instruction)} className="w-full text-left px-2 py-1.5 text-[10px] text-gray-300 hover:bg-[#7d2ae8] hover:text-white rounded flex items-center gap-2 transition-colors">
                     <tone.icon className="w-3 h-3" /> {tone.label}
                  </button>
               ))}
            </div>
         )}
      </div>
   </div>
));

const ShapeTools = React.memo(({ layer, handleUpdateLayer, documentColors }: any) => (
   <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
         <span className="text-[10px] text-gray-400 font-bold">FILL</span>
         <ColorPicker value={layer.color} onChange={(color) => handleUpdateLayer({ color, backgroundImage: undefined })} documentColors={documentColors} />
      </div>
      <Divider />
      <CompactInput label="R" value={layer.cornerRadius || 0} onChange={(e: any) => handleUpdateLayer({ cornerRadius: parseInt(e.target.value) })} min={0} max={100} />
   </div>
));

const ImageTools = React.memo(({
   layer, isRemovingBg, isExpanding, isEraserActive, isPro,
   handleRemoveBackground, handleEraserClick, handleMagicExpand, onRemix,
   handleUpdateLayer, onInteractionStart, showFilters, setShowFilters
}: any) => (
   <div className="flex items-center gap-3">
      <div className="flex gap-1 items-center">
         <button onClick={handleRemoveBackground} className={`relative p-1.5 rounded transition-colors group ${isRemovingBg ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} disabled={isRemovingBg} title="Remove Background (AI)">
            {isRemovingBg ? <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /> : <Icons.Magic className="w-4 h-4 text-indigo-400" />}
            {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
         </button>
         <button onClick={handleEraserClick} className={`relative p-1.5 rounded transition-colors group ${isEraserActive ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Magic Eraser (AI)">
            <Icons.Eraser className="w-4 h-4" />
            {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
         </button>
         <button onClick={handleMagicExpand} className={`relative p-1.5 rounded transition-colors group ${isExpanding ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} disabled={isExpanding} title="Expand Image (AI)">
            {isExpanding ? <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" /> : <Icons.Maximize className="w-4 h-4" />}
            {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
         </button>
         <button onClick={() => onRemix && onRemix(layer.id)} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Remix Image"><Icons.RefreshCw className="w-4 h-4" /></button>
      </div>
      <Divider />
      <div className="relative">
         <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showFilters ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-[#252627] border-gray-700 text-gray-300 hover:border-gray-500'}`}>
            <Icons.Filter className="w-3 h-3" /> Filters
         </button>
         {showFilters && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-700 p-3 z-50 animate-fadeIn">
               <div className="grid grid-cols-3 gap-2">
                  {FILTER_PRESETS.map(preset => (
                     <button key={preset.name} onClick={() => { onInteractionStart(); handleUpdateLayer({ filters: { ...layer.filters, ...preset.filters } }); }} className="aspect-video rounded border border-gray-700 hover:border-indigo-500 bg-gray-800 flex items-center justify-center text-[10px] text-gray-400 hover:text-white transition-all">
                        {preset.name}
                     </button>
                  ))}
               </div>
            </div>
         )}
      </div>
   </div>
));

const CommonActions = React.memo(({
   selectedLayer, handleUpdateLayer, documentColors, showEffects, setShowEffects,
   effectsRef, onMoveLayer, onDuplicateLayer, onDeleteLayer
}: any) => (
   <div className="flex items-center gap-2">
      <div className="relative" ref={effectsRef}>
         <button onClick={() => setShowEffects(!showEffects)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showEffects ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-[#252627] border-gray-700 text-gray-300 hover:border-gray-500'}`}>
            <Icons.Blend className="w-3 h-3" /> Effects
         </button>
         {showEffects && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-700 p-4 z-50 animate-fadeIn space-y-4">
               <div>
                  <div className="flex justify-between mb-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase">Opacity</span>
                     <span className="text-[10px] text-gray-500">{Math.round(selectedLayer.opacity * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={selectedLayer.opacity} onChange={(e) => handleUpdateLayer({ opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]" />
               </div>
               {/* Blend Mode */}
               <div className="border-t border-gray-700 pt-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Blend Mode</span>
                  <select value={selectedLayer.blendMode || 'normal'} onChange={(e) => handleUpdateLayer({ blendMode: e.target.value })} className="w-full bg-[#252627] border border-gray-600 rounded text-xs text-white p-1">
                     <option value="normal">Normal</option>
                     <option value="multiply">Multiply</option>
                     <option value="screen">Screen</option>
                     <option value="overlay">Overlay</option>
                  </select>
               </div>
            </div>
         )}
      </div>
      <Divider />
      <div className="flex items-center gap-1">
         <IconButton onClick={() => onMoveLayer(selectedLayer.id, 'forward')} title="Bring Forward"><Icons.ArrowUp className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onMoveLayer(selectedLayer.id, 'backward')} title="Send Backward"><Icons.ArrowDown className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onDuplicateLayer(selectedLayer.id)} title="Duplicate"><Icons.Copy className="w-3.5 h-3.5" /></IconButton>
         <IconButton onClick={() => onDeleteLayer(selectedLayer.id)} className="hover:bg-red-500/20 hover:text-red-400" title="Delete"><Icons.Trash className="w-3.5 h-3.5" /></IconButton>
      </div>
   </div>
));

// -- Main Component --

export const Toolbar = React.memo(({
   selectedLayer,
   canvasBackgroundColor,
   onSetCanvasBackgroundColor,
   canvasFilters,
   onUpdateCanvasFilters,
   onUpdateTextLayer,
   onUpdateShapeLayer,
   onUpdateImageLayer,
   onDeleteLayer,
   onDuplicateLayer,
   onMoveLayer,
   onMagicWrite,
   onInteractionStart,
   onRemix,
   onAlignLayers,
   onDistributeLayers,
   selectedLayerIds,
   documentColors = [],
   onToggleEraser,
   isEraserActive,
   canvasSize,
   onUpdateCanvasSize,
   user,
   onOpenPricing,
   onGroup,
   onUngroup,
   onToggleDesignSuggestions,
   onToggleSmartContent,
   onToggleQualityScore
}: ToolbarProps) => {
   const [showFilters, setShowFilters] = useState(false);
   const [showEffects, setShowEffects] = useState(false);
   const [isRemovingBg, setIsRemovingBg] = useState(false);
   const [isExpanding, setIsExpanding] = useState(false);
   const [showFontPicker, setShowFontPicker] = useState(false);
   const [showRewriteTones, setShowRewriteTones] = useState(false);
   const [showTextEffects, setShowTextEffects] = useState(false);
   const [fontSearch, setFontSearch] = useState('');
   const fontPickerRef = useRef<HTMLDivElement>(null);
   const effectsRef = useRef<HTMLDivElement>(null);
   const textEffectsRef = useRef<HTMLDivElement>(null);
   const rewriteRef = useRef<HTMLDivElement>(null);

   const isPro = user.plan !== 'free';

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
            setShowFontPicker(false);
         }
         if (effectsRef.current && !effectsRef.current.contains(event.target as Node)) {
            setShowEffects(false);
         }
         if (rewriteRef.current && !rewriteRef.current.contains(event.target as Node)) {
            setShowRewriteTones(false);
         }
         if (textEffectsRef.current && !textEffectsRef.current.contains(event.target as Node)) {
            setShowTextEffects(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleUpdateLayer = useCallback((changes: any) => {
      if (!selectedLayer) return;
      onInteractionStart();
      if (selectedLayer.type === 'text') {
         onUpdateTextLayer(selectedLayer.id, changes);
      } else if (selectedLayer.type === 'image') {
         if (onUpdateImageLayer) onUpdateImageLayer(selectedLayer.id, changes);
      } else {
         onUpdateShapeLayer(selectedLayer.id, changes);
      }
   }, [selectedLayer, onInteractionStart, onUpdateTextLayer, onUpdateImageLayer, onUpdateShapeLayer]);

   const handleRemoveBackground = async () => {
      if (!isPro) { onOpenPricing(); return; }
      if (!selectedLayer || selectedLayer.type !== 'image' || !onUpdateImageLayer) return;
      setIsRemovingBg(true);
      onInteractionStart();
      try {
         // Use client-side AI (imgly) instead of Gemini for faster/free BG removal
         const newSrc = await imageProcessor.removeBackground((selectedLayer as ImageLayer).src);
         onUpdateImageLayer(selectedLayer.id, { src: newSrc });
      } catch (error) {
         console.error("Failed to remove background", error);
         alert("Could not remove background. Try again.");
      } finally {
         setIsRemovingBg(false);
      }
   };

   const handleMagicExpand = async () => {
      if (!isPro) { onOpenPricing(); return; }
      if (!selectedLayer || selectedLayer.type !== 'image' || !onUpdateImageLayer) return;
      setIsExpanding(true);
      onInteractionStart();
      try {
         const newSrc = await geminiService.expandImage((selectedLayer as ImageLayer).src);
         onUpdateImageLayer(selectedLayer.id, { src: newSrc });
      } catch (error) {
         console.error("Failed to expand image", error);
         alert("Could not expand image. Try again.");
      } finally {
         setIsExpanding(false);
      }
   };

   const handleEraserClick = () => {
      if (!isPro) { onOpenPricing(); return; }
      if (onToggleEraser) onToggleEraser();
   };

   const handleToneRewrite = async (id: string, instruction: string) => {
      setShowRewriteTones(false);
      onInteractionStart();
      try {
         const newText = await geminiService.generateText((selectedLayer as TextLayer).text, instruction);
         onUpdateTextLayer(id, { text: newText });
      } catch (error) {
         console.error(error);
      }
   };

   const filteredFonts = useMemo(() =>
      FONT_FAMILIES.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())),
      [fontSearch]);

   const isMultiSelect = selectedLayerIds && selectedLayerIds.length > 1;

   return (
      <div className="flex items-center min-h-14 bg-[#1e1e1e] border-b border-gray-700 px-2 sm:px-4 gap-2 sm:gap-4 overflow-x-auto custom-scrollbar w-full shadow-sm z-20 py-2">
         {isMultiSelect ? (
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Selection ({selectedLayerIds?.length})</span>
               <Divider />
               <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
                  <IconButton onClick={() => onAlignLayers?.('left')} title="Align Left"><Icons.AlignLeft className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => onAlignLayers?.('center')} title="Align Center"><Icons.AlignCenter className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => onAlignLayers?.('right')} title="Align Right"><Icons.AlignRight className="w-3.5 h-3.5" /></IconButton>
               </div>
               <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
                  <IconButton onClick={onGroup} title="Group (Ctrl+G)"><Icons.Group className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={onUngroup} title="Ungroup (Ctrl+Shift+G)"><Icons.Ungroup className="w-3.5 h-3.5" /></IconButton>
               </div>
               <Divider />
               <div className="flex items-center gap-1">
                  <IconButton onClick={() => selectedLayerIds.forEach(id => onDeleteLayer(id))} title="Delete All"><Icons.Trash className="w-3.5 h-3.5" /></IconButton>
               </div>
            </div>
         ) : !selectedLayer ? (
            <CanvasTools
               onToggleDesignSuggestions={onToggleDesignSuggestions}
               onToggleSmartContent={onToggleSmartContent}
               onToggleQualityScore={onToggleQualityScore}
               canvasBackgroundColor={canvasBackgroundColor}
               onSetCanvasBackgroundColor={onSetCanvasBackgroundColor}
               onInteractionStart={onInteractionStart}
               documentColors={documentColors}
               canvasFilters={canvasFilters}
               onUpdateCanvasFilters={onUpdateCanvasFilters}
               canvasSize={canvasSize}
               onUpdateCanvasSize={onUpdateCanvasSize}
            />
         ) : (
            <>
               <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
                  {selectedLayer.type === 'text' && (
                     <TextTools
                        layer={selectedLayer}
                        onUpdateTextLayer={onUpdateTextLayer}
                        onInteractionStart={onInteractionStart}
                        documentColors={documentColors}
                        onMagicWrite={onMagicWrite}
                        showFontPicker={showFontPicker}
                        setShowFontPicker={setShowFontPicker}
                        fontSearch={fontSearch}
                        setFontSearch={setFontSearch}
                        fontPickerRef={fontPickerRef}
                        showRewriteTones={showRewriteTones}
                        setShowRewriteTones={setShowRewriteTones}
                        rewriteRef={rewriteRef}
                        filteredFonts={filteredFonts}
                        handleToneRewrite={handleToneRewrite}
                        showTextEffects={showTextEffects}
                        setShowTextEffects={setShowTextEffects}
                        textEffectsRef={textEffectsRef}
                     />
                  )}
                  {selectedLayer.type !== 'text' && selectedLayer.type !== 'image' && (
                     <ShapeTools
                        layer={selectedLayer}
                        handleUpdateLayer={handleUpdateLayer}
                        documentColors={documentColors}
                     />
                  )}
                  {selectedLayer.type === 'image' && (
                     <ImageTools
                        layer={selectedLayer}
                        isRemovingBg={isRemovingBg}
                        isExpanding={isExpanding}
                        isEraserActive={isEraserActive}
                        isPro={isPro}
                        handleRemoveBackground={handleRemoveBackground}
                        handleEraserClick={handleEraserClick}
                        handleMagicExpand={handleMagicExpand}
                        onRemix={onRemix}
                        handleUpdateLayer={handleUpdateLayer}
                        onInteractionStart={onInteractionStart}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                     />
                  )}
               </div>

               <div className="h-8 w-px bg-gray-700 mx-1 sm:mx-2 shrink-0 hidden md:block"></div>

               <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
                  <TransformTools
                     selectedLayer={selectedLayer}
                     handleUpdateLayer={handleUpdateLayer}
                     isPro={isPro}
                     onOpenPricing={onOpenPricing}
                  />
                  <CommonActions
                     selectedLayer={selectedLayer}
                     handleUpdateLayer={handleUpdateLayer}
                     documentColors={documentColors}
                     showEffects={showEffects}
                     setShowEffects={setShowEffects}
                     effectsRef={effectsRef}
                     onMoveLayer={onMoveLayer}
                     onDuplicateLayer={onDuplicateLayer}
                     onDeleteLayer={onDeleteLayer}
                  />
               </div>
            </>
         )}
      </div>
   );
});
