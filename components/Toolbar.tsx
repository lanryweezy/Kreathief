
import React, { useState, useRef, useEffect } from 'react';
import { Layer, TextLayer, ShapeLayer, ImageLayer, CanvasFilters, LayerFilters, CanvasSize, User } from '../types';
import { Icons, FONT_FAMILIES } from '../constants';
import { ColorPicker } from './ColorPicker';
import * as geminiService from '../services/geminiService';

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
  
  onMagicWrite: (id: string) => void;
  onInteractionStart: () => void;
  onRemix?: (layerId: string) => void;
  documentColors?: string[];
  
  onToggleEraser?: () => void;
  isEraserActive?: boolean;
  canvasSize?: CanvasSize;
  user: User;
  onOpenPricing: () => void;
}

const FILTER_PRESETS: { name: string, filters: Partial<LayerFilters> }[] = [
  { name: 'Normal', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0, vignette: 0 } },
  { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, grayscale: 100, blur: 0, sepia: 0, hueRotate: 0, vignette: 20 } },
  { name: 'Sepia', filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0, sepia: 100, hueRotate: 0, vignette: 30 } },
  { name: 'Vintage', filters: { brightness: 110, contrast: 80, saturation: 70, grayscale: 0, blur: 0, sepia: 40, hueRotate: 0, vignette: 40 } },
  { name: 'Cyber', filters: { brightness: 110, contrast: 120, saturation: 150, grayscale: 0, blur: 0, sepia: 0, hueRotate: 180, vignette: 0 } },
  { name: 'Fade', filters: { brightness: 120, contrast: 90, saturation: 80, grayscale: 0, blur: 1, sepia: 10, hueRotate: 0, vignette: 10 } },
];

export const Toolbar: React.FC<ToolbarProps> = ({
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
  documentColors = [],
  onToggleEraser,
  isEraserActive,
  canvasSize,
  user,
  onOpenPricing
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const fontPickerRef = useRef<HTMLDivElement>(null);
  const effectsRef = useRef<HTMLDivElement>(null);

  const isPro = user.plan !== 'free';

  // Close popups on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
        setShowFontPicker(false);
      }
      if (effectsRef.current && !effectsRef.current.contains(event.target as Node)) {
        setShowEffects(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -- Helpers --

  const handleUpdateLayer = (changes: any) => {
    if (!selectedLayer) return;
    onInteractionStart();
    if (selectedLayer.type === 'text') {
      onUpdateTextLayer(selectedLayer.id, changes);
    } else if (selectedLayer.type === 'image') {
      if (onUpdateImageLayer) onUpdateImageLayer(selectedLayer.id, changes);
    } else {
      // Shape layer
      onUpdateShapeLayer(selectedLayer.id, changes);
    }
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!selectedLayer || !canvasSize) return;
      onInteractionStart();
      
      const { width: cW, height: cH } = canvasSize;
      const { width: lW } = selectedLayer;
      const lH = (selectedLayer as any).height || 0; // Rough height for text if needed

      let update = {};
      switch(type) {
          case 'left': update = { x: 0 }; break;
          case 'center': update = { x: (cW - lW) / 2 }; break;
          case 'right': update = { x: cW - lW }; break;
          case 'top': update = { y: 0 }; break;
          case 'middle': update = { y: (cH - lH) / 2 }; break;
          case 'bottom': update = { y: cH - lH }; break;
      }
      handleUpdateLayer(update);
  };

  const toggleTextDecoration = (current: string | undefined, value: string): string => {
    const parts = (current || 'none').split(' ').filter(p => p !== 'none');
    if (parts.includes(value)) {
      const newParts = parts.filter(p => p !== value);
      return newParts.length > 0 ? newParts.join(' ') : 'none';
    } else {
      parts.push(value);
      return parts.join(' ');
    }
  };

  const handleRemoveBackground = async () => {
    if (!isPro) { onOpenPricing(); return; }
    if (!selectedLayer || selectedLayer.type !== 'image' || !onUpdateImageLayer) return;
    setIsRemovingBg(true);
    onInteractionStart();
    try {
      const newSrc = await geminiService.removeBackground((selectedLayer as ImageLayer).src);
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

  const filteredFonts = FONT_FAMILIES.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  // -- UI Components --

  const Divider = () => <div className="h-6 w-px bg-gray-700/50 mx-2 shrink-0"></div>;

  const IconButton = ({ onClick, active, title, children, disabled, className = '' }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded transition-all duration-150 ${
        active 
          ? 'bg-[#7d2ae8] text-white shadow-md shadow-[#7d2ae8]/20' 
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
      title={title}
    >
      {children}
    </button>
  );

  const CompactInput = ({ value, onChange, min, max, label, width = "w-12", step = 1 }: any) => (
    <div className="flex items-center gap-1.5 bg-[#252627] border border-gray-700 rounded px-1.5 py-1 focus-within:border-[#7d2ae8] transition-colors group">
      {label && <span className="text-[9px] font-bold text-gray-500 group-focus-within:text-[#7d2ae8] select-none cursor-default">{label}</span>}
      <input 
        type="number" 
        min={min} max={max} step={step}
        className={`bg-transparent text-[11px] text-white outline-none font-mono text-center no-spinner ${width}`}
        value={Math.round(value)}
        onFocus={() => onInteractionStart()}
        onChange={onChange}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </div>
  );

  // -- Toolbar Sections --

  const CanvasTools = () => (
    <div className="flex items-center gap-3">
       <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-800/30 border border-gray-700/50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Canvas</span>
       </div>
       <Divider />
       <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold">BG</span>
          <ColorPicker 
            value={canvasBackgroundColor}
            onChange={(color) => { onInteractionStart(); onSetCanvasBackgroundColor(color); }}
            documentColors={documentColors}
          />
       </div>
       <Divider />
       {/* Compact Filter Sliders */}
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
    </div>
  );

  const TransformTools = () => (
    <div className="flex items-center gap-2">
       {/* Position Group */}
       <div className="flex items-center gap-1">
          <CompactInput 
              label="X" 
              value={selectedLayer!.x} 
              onChange={(e: any) => handleUpdateLayer({ x: parseInt(e.target.value) })} 
          />
          <CompactInput 
              label="Y" 
              value={selectedLayer!.y} 
              onChange={(e: any) => handleUpdateLayer({ y: parseInt(e.target.value) })} 
          />
       </div>
       
       <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

       {/* Size Group */}
       <div className="flex items-center gap-1">
          <CompactInput 
              label="W" 
              value={selectedLayer!.width} 
              onChange={(e: any) => handleUpdateLayer({ width: parseInt(e.target.value) })} 
              min={10}
          />
          <CompactInput 
              label="H" 
              value={(selectedLayer as any).height || 0} 
              onChange={(e: any) => handleUpdateLayer({ height: parseInt(e.target.value) })} 
              min={10}
          />
       </div>

       <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

       {/* Rotation & Alignment */}
       <CompactInput 
          label="R" 
          value={selectedLayer!.rotation} 
          onChange={(e: any) => handleUpdateLayer({ rotation: parseInt(e.target.value) })} 
          min={-360} max={360}
          width="w-8"
       />
       
       <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 ml-1">
          <IconButton onClick={() => handleAlign('left')} title="Align Left"><Icons.PositionLeft className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => handleAlign('center')} title="Align Center"><Icons.PositionCenter className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => handleAlign('right')} title="Align Right"><Icons.PositionRight className="w-3.5 h-3.5" /></IconButton>
          <div className="w-px bg-gray-600 mx-0.5"></div>
          <IconButton onClick={() => handleAlign('top')} title="Align Top"><Icons.PositionTop className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => handleAlign('middle')} title="Align Middle"><Icons.PositionMiddle className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => handleAlign('bottom')} title="Align Bottom"><Icons.PositionBottom className="w-3.5 h-3.5" /></IconButton>
       </div>
    </div>
  );

  const TextTools = () => {
    const layer = selectedLayer as TextLayer;
    return (
      <div className="flex items-center gap-2">
         {/* Font Family */}
         <div className="relative" ref={fontPickerRef}>
            <button 
               onClick={() => setShowFontPicker(!showFontPicker)}
               className="w-36 bg-[#252627] border border-gray-700 rounded px-2 py-1 text-xs text-white text-left flex justify-between items-center hover:border-gray-500 transition-colors"
               title="Font Family"
            >
               <span className="truncate mr-2 font-medium">{layer.fontFamily}</span>
               <Icons.ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            {showFontPicker && (
               <div className="absolute top-full left-0 mt-1 w-56 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 p-1 animate-fadeIn custom-scrollbar">
                  <div className="sticky top-0 bg-[#1e1e1e] p-1 mb-1 border-b border-gray-700 z-10">
                     <input 
                       type="text" 
                       placeholder="Search fonts..." 
                       className="w-full bg-[#13161a] border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-[#7d2ae8] outline-none"
                       value={fontSearch}
                       onChange={(e) => setFontSearch(e.target.value)}
                       autoFocus
                     />
                  </div>
                  {filteredFonts.map(font => (
                     <button
                        key={font}
                        onClick={() => { handleUpdateLayer({ fontFamily: font }); setShowFontPicker(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#7d2ae8] hover:text-white rounded flex items-center justify-between group ${layer.fontFamily === font ? 'bg-indigo-900/30 text-[#7d2ae8]' : 'text-gray-300'}`}
                        style={{ fontFamily: font }}
                     >
                        {font}
                        {layer.fontFamily === font && <div className="w-1.5 h-1.5 rounded-full bg-[#7d2ae8] group-hover:bg-white" />}
                     </button>
                  ))}
               </div>
            )}
         </div>

         <CompactInput 
            value={layer.fontSize} 
            onChange={(e: any) => handleUpdateLayer({ fontSize: parseInt(e.target.value) })}
            min={8} max={500} 
            width="w-10"
         />

         <ColorPicker 
            value={layer.color} 
            onChange={(color) => handleUpdateLayer({ color, gradient: undefined })}
            documentColors={documentColors}
         />

         <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

         {/* Formatting Group */}
         <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
            <IconButton onClick={() => handleUpdateLayer({ fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })} active={layer.fontWeight === 'bold'} title="Bold"><Icons.Bold className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })} active={layer.fontStyle === 'italic'} title="Italic"><Icons.Italic className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ textDecoration: toggleTextDecoration(layer.textDecoration, 'underline') })} active={layer.textDecoration?.includes('underline')} title="Underline"><Icons.Underline className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ textTransform: layer.textTransform === 'uppercase' ? 'none' : 'uppercase' })} active={layer.textTransform === 'uppercase'} title="Uppercase"><Icons.Uppercase className="w-3.5 h-3.5" /></IconButton>
         </div>

         {/* Alignment Group */}
         <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
            <IconButton onClick={() => handleUpdateLayer({ textAlign: 'left' })} active={layer.textAlign === 'left'} title="Left"><Icons.AlignLeft className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ textAlign: 'center' })} active={layer.textAlign === 'center'} title="Center"><Icons.AlignCenter className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ textAlign: 'right' })} active={layer.textAlign === 'right'} title="Right"><Icons.AlignRight className="w-3.5 h-3.5" /></IconButton>
         </div>

         <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

         {/* Warp Tools */}
         <div className="flex items-center gap-2">
             <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
                <IconButton onClick={() => handleUpdateLayer({ warpStyle: 'none', curve: 0 })} active={!layer.warpStyle || layer.warpStyle === 'none'} title="No Warp"><Icons.X className="w-3.5 h-3.5" /></IconButton>
                <IconButton onClick={() => handleUpdateLayer({ warpStyle: 'arc', curve: 50 })} active={layer.warpStyle === 'arc'} title="Arc"><Icons.Curve className="w-3.5 h-3.5" /></IconButton>
                <IconButton onClick={() => handleUpdateLayer({ warpStyle: 'flag', curve: 30 })} active={layer.warpStyle === 'flag'} title="Flag"><Icons.Wave className="w-3.5 h-3.5" /></IconButton>
             </div>
             {(layer.warpStyle && layer.warpStyle !== 'none') && (
                 <input 
                    type="range" min="-100" max="100" value={layer.curve || 0} 
                    onChange={(e) => handleUpdateLayer({ curve: parseInt(e.target.value) })}
                    className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                    title="Warp Intensity"
                 />
             )}
         </div>

         <button onClick={() => onMagicWrite(layer.id)} className="ml-2 flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/40 hover:to-purple-500/40 border border-purple-500/30 text-purple-300 rounded text-[10px] font-bold transition-all" title="AI Magic Write">
             <Icons.Magic className="w-3 h-3" /> Rewrite
         </button>
      </div>
    );
  };

  const ShapeTools = () => {
    const layer = selectedLayer as ShapeLayer;
    return (
      <div className="flex items-center gap-3">
         <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-400 font-bold">FILL</span>
             <ColorPicker value={layer.color} onChange={(color) => handleUpdateLayer({ color, backgroundImage: undefined })} documentColors={documentColors} />
         </div>
         <Divider />
         <CompactInput 
             label="R" 
             value={layer.cornerRadius || 0} 
             onChange={(e: any) => handleUpdateLayer({ cornerRadius: parseInt(e.target.value) })}
             min={0} max={100}
         />
      </div>
    );
  };

  const ImageTools = () => {
    const layer = selectedLayer as ImageLayer;
    return (
      <div className="flex items-center gap-3">
         {/* AI Tools Group */}
         <div className="flex gap-1 items-center">
            <button onClick={handleRemoveBackground} className={`relative p-1.5 rounded transition-colors group ${isRemovingBg ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} disabled={isRemovingBg} title="Remove Background (AI)">
               {isRemovingBg ? <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"/> : <Icons.Magic className="w-4 h-4 text-indigo-400" />}
               {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
            </button>
            <button onClick={handleEraserClick} className={`relative p-1.5 rounded transition-colors group ${isEraserActive ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Magic Eraser (AI)">
               <Icons.Eraser className="w-4 h-4" />
               {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
            </button>
            <button onClick={handleMagicExpand} className={`relative p-1.5 rounded transition-colors group ${isExpanding ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} disabled={isExpanding} title="Expand Image (AI)">
               {isExpanding ? <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin"/> : <Icons.Maximize className="w-4 h-4" />}
               {!isPro && <div className="absolute -top-1 -right-1"><Icons.Lock className="w-2.5 h-2.5 text-amber-500" /></div>}
            </button>
            <button onClick={() => onRemix && onRemix(layer.id)} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" title="Remix Image">
               <Icons.RefreshCw className="w-4 h-4" />
            </button>
         </div>

         <Divider />

         {/* Flip Controls */}
         <div className="flex bg-[#252627] rounded border border-gray-700 p-0.5 gap-0.5">
            <IconButton onClick={() => handleUpdateLayer({ flipX: !layer.flipX })} active={layer.flipX} title="Flip Horizontal"><Icons.FlipHorizontal className="w-3.5 h-3.5" /></IconButton>
            <IconButton onClick={() => handleUpdateLayer({ flipY: !layer.flipY })} active={layer.flipY} title="Flip Vertical"><Icons.FlipVertical className="w-3.5 h-3.5" /></IconButton>
         </div>

         <Divider />

         {/* Filters Popover Trigger */}
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
    );
  };

  const CommonActions = () => (
    <div className="flex items-center gap-2">
       {/* Effects Popover */}
       <div className="relative" ref={effectsRef}>
          <button 
             onClick={() => setShowEffects(!showEffects)}
             className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${showEffects ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-[#252627] border-gray-700 text-gray-300 hover:border-gray-500'}`}
          >
             <Icons.Blend className="w-3 h-3" /> Effects
          </button>
          
          {showEffects && (
             <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-700 p-4 z-50 animate-fadeIn space-y-4">
                {/* Opacity */}
                <div>
                   <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Opacity</span>
                      <span className="text-[10px] text-gray-500">{Math.round(selectedLayer!.opacity * 100)}%</span>
                   </div>
                   <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={selectedLayer!.opacity} 
                      onChange={(e) => handleUpdateLayer({ opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                   />
                </div>

                {/* Stroke */}
                <div className="border-t border-gray-700 pt-3">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Stroke</span>
                      <input 
                         type="checkbox" 
                         checked={!!selectedLayer!.stroke && selectedLayer!.stroke.width > 0} 
                         onChange={(e) => handleUpdateLayer({ stroke: e.target.checked ? { color: '#000000', width: 2 } : undefined })}
                         className="accent-[#7d2ae8]"
                      />
                   </div>
                   {selectedLayer!.stroke && (
                      <div className="flex items-center gap-2">
                         <ColorPicker 
                            value={selectedLayer!.stroke.color} 
                            onChange={(color) => handleUpdateLayer({ stroke: { ...selectedLayer!.stroke, color } })} 
                            documentColors={documentColors}
                         />
                         <input 
                            type="range" min="1" max="20" 
                            value={selectedLayer!.stroke.width} 
                            onChange={(e) => handleUpdateLayer({ stroke: { ...selectedLayer!.stroke, width: parseInt(e.target.value) } })}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                         />
                      </div>
                   )}
                </div>

                {/* Shadow */}
                <div className="border-t border-gray-700 pt-3">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Shadow</span>
                      <input 
                         type="checkbox" 
                         checked={!!selectedLayer!.shadow} 
                         onChange={(e) => handleUpdateLayer({ shadow: e.target.checked ? { color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 } : undefined })}
                         className="accent-[#7d2ae8]"
                      />
                   </div>
                   {selectedLayer!.shadow && (
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <ColorPicker 
                               value={selectedLayer!.shadow.color} 
                               onChange={(color) => handleUpdateLayer({ shadow: { ...selectedLayer!.shadow, color } })} 
                               documentColors={documentColors}
                            />
                            <div className="flex gap-1 flex-1">
                               <input title="X Offset" type="number" value={selectedLayer!.shadow.offsetX} onChange={(e) => handleUpdateLayer({ shadow: { ...selectedLayer!.shadow, offsetX: parseInt(e.target.value) } })} className="w-full bg-[#252627] text-xs px-1 py-0.5 rounded border border-gray-600" />
                               <input title="Y Offset" type="number" value={selectedLayer!.shadow.offsetY} onChange={(e) => handleUpdateLayer({ shadow: { ...selectedLayer!.shadow, offsetY: parseInt(e.target.value) } })} className="w-full bg-[#252627] text-xs px-1 py-0.5 rounded border border-gray-600" />
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 w-6">Blur</span>
                            <input 
                               type="range" min="0" max="50" 
                               value={selectedLayer!.shadow.blur} 
                               onChange={(e) => handleUpdateLayer({ shadow: { ...selectedLayer!.shadow, blur: parseInt(e.target.value) } })}
                               className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7d2ae8]"
                            />
                         </div>
                      </div>
                   )}
                </div>

                {/* Blend Mode (Mainly for Image/Text) */}
                <div className="border-t border-gray-700 pt-3">
                   <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Blend Mode</span>
                   <select 
                      value={selectedLayer!.blendMode || 'normal'}
                      onChange={(e) => handleUpdateLayer({ blendMode: e.target.value })}
                      className="w-full bg-[#252627] border border-gray-600 rounded text-xs text-white p-1"
                   >
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply</option>
                      <option value="screen">Screen</option>
                      <option value="overlay">Overlay</option>
                      <option value="darken">Darken</option>
                      <option value="lighten">Lighten</option>
                      <option value="color-dodge">Color Dodge</option>
                      <option value="color-burn">Color Burn</option>
                      <option value="difference">Difference</option>
                      <option value="exclusion">Exclusion</option>
                   </select>
                </div>
             </div>
          )}
       </div>
       
       <Divider />

       <div className="flex items-center gap-1">
          <IconButton onClick={() => onMoveLayer(selectedLayer!.id, 'forward')} title="Bring Forward"><Icons.ArrowUp className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => onMoveLayer(selectedLayer!.id, 'backward')} title="Send Backward"><Icons.ArrowDown className="w-3.5 h-3.5" /></IconButton>
       </div>

       <div className="w-px h-6 bg-gray-700/50 mx-1"></div>

       <div className="flex items-center gap-1">
          <IconButton onClick={() => onDuplicateLayer(selectedLayer!.id)} title="Duplicate (Ctrl+D)"><Icons.Copy className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => handleUpdateLayer({ locked: !selectedLayer!.locked })} active={selectedLayer!.locked} title="Lock/Unlock">
             {selectedLayer!.locked ? <Icons.Lock className="w-3.5 h-3.5" /> : <Icons.Unlock className="w-3.5 h-3.5" />}
          </IconButton>
          <IconButton onClick={() => onDeleteLayer(selectedLayer!.id)} className="hover:bg-red-500/20 hover:text-red-400" title="Delete"><Icons.Trash className="w-3.5 h-3.5" /></IconButton>
       </div>
    </div>
  );

  // -- Main Render --

  return (
    <div className="flex items-center h-14 bg-[#1e1e1e] border-b border-gray-700 px-4 gap-4 overflow-x-auto custom-scrollbar w-full shadow-sm z-20">
       {!selectedLayer ? (
          <CanvasTools />
       ) : (
          <>
             {/* Contextual Tools */}
             <div className="flex items-center gap-4 shrink-0">
                {selectedLayer.type === 'text' && <TextTools />}
                {selectedLayer.type !== 'text' && selectedLayer.type !== 'image' && <ShapeTools />}
                {selectedLayer.type === 'image' && <ImageTools />}
             </div>

             {/* Vertical Separator between specific and common */}
             <div className="h-8 w-px bg-gray-700 mx-2 shrink-0"></div>

             {/* Common Transform & Actions */}
             <div className="flex items-center gap-4 shrink-0">
                <TransformTools />
                <CommonActions />
             </div>
          </>
       )}
    </div>
  );
};
