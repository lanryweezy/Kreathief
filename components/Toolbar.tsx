import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import * as geminiService from '../services/geminiService';
import { TextLayer, User } from '../types';

// Modular Sub-components
import { Divider, IconButton } from './toolbar/ToolbarShared';
import { CanvasTools } from './toolbar/CanvasTools';
import { TransformTools } from './toolbar/TransformTools';
import { TextTools } from './toolbar/TextTools';
import { VectorTools } from './toolbar/VectorTools';
import { ShapeTools } from './toolbar/ShapeTools';
import { ImageTools } from './toolbar/ImageTools';
import { CommonActions } from './toolbar/CommonActions';

interface ToolbarProps {
   uploadedImage: string | null;
   documentColors?: string[];
   onToggleEraser?: () => void; // Deprecated, use store
   isEraserActive?: boolean; // Deprecated, use store
   user: User;
   onOpenPricing: () => void;
   onToggleDesignSuggestions?: () => void;
   onToggleSmartContent?: () => void;
   onToggleQualityScore?: () => void;
   onCompletePath?: () => void;
   onBooleanOperation?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
   onCrop?: (id: string) => void;
}

export const Toolbar = React.memo(({
   documentColors = [],
   user,
   onOpenPricing,
   onToggleDesignSuggestions,
   onToggleSmartContent,
   onToggleQualityScore,
   onCompletePath,
   onBooleanOperation,
}: ToolbarProps) => {
   // UI State
   const [showFilters, setShowFilters] = useState(false);
   const [showResize, setShowResize] = useState(false);
   const [showEffects, setShowEffects] = useState(false);
   const [showFontPicker, setShowFontPicker] = useState(false);
   const [showRewriteTones, setShowRewriteTones] = useState(false);
   const [showTextEffects, setShowTextEffects] = useState(false);
   const [showGlyphs, setShowGlyphs] = useState(false);
   const [fontSearch, setFontSearch] = useState('');

   // Refs
   const fontPickerRef = useRef<HTMLDivElement>(null);
   const effectsRef = useRef<HTMLDivElement>(null);
   const textEffectsRef = useRef<HTMLDivElement>(null);
   const rewriteRef = useRef<HTMLDivElement>(null);

   // Store Actions
   const {
      layers,
      selectedLayerIds,
      updateLayer,
      deleteLayer: onDeleteLayer,
      duplicateLayer: onDuplicateLayer,
      moveLayer: onMoveLayer,
      alignLayers: onAlignLayers,
      groupSelected: onGroup,
      ungroupSelected: onUngroup,
      onRmBg,
      vectorizeLayer,
      onCrop: onCropAction,
      onEnhance,
      onUpscale,
      onRetouch,
      onRemix,
      onMagicExpand,
      toggleEraser,
      setIsProcessing
   } = useStore();

   // Store State
   const isRemovingBgStore = useStore(state => state.isRemovingBg);
   const isExpandingStore = useStore(state => state.isExpanding);
   const isEraserActiveStore = useStore(state => state.isEraserActive);

   const selectedLayer = layers.find(l => selectedLayerIds.includes(l.id)) || null;
   const isPro = user.plan !== 'free';
   const isMultiSelect = selectedLayerIds && selectedLayerIds.length > 1;

   // Global Click Handler for dropdowns
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) setShowFontPicker(false);
         if (effectsRef.current && !effectsRef.current.contains(event.target as Node)) setShowEffects(false);
         if (rewriteRef.current && !rewriteRef.current.contains(event.target as Node)) setShowRewriteTones(false);
         if (textEffectsRef.current && !textEffectsRef.current.contains(event.target as Node)) setShowTextEffects(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleUpdateLayer = useCallback((changes: any) => {
      if (!selectedLayer) return;
      updateLayer(selectedLayer.id, changes);
   }, [selectedLayer, updateLayer]);

   const handleToneRewrite = async (id: string, instruction: string) => {
      setShowRewriteTones(false);
      setIsProcessing(true);
      try {
         const newText = await geminiService.generateText((selectedLayer as TextLayer).text, instruction);
         updateLayer(id, { text: newText });
      } catch (error) {
         console.error(error);
      } finally {
         setIsProcessing(false);
      }
   };

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
               documentColors={documentColors}
            />
         ) : (
            <>
               <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
                  {((selectedLayer as any).type === 'path' || (selectedLayer as any).vectorPath) && (
                     <VectorTools
                        layer={selectedLayer}
                        handleUpdateLayer={handleUpdateLayer}
                        onCompletePath={onCompletePath}
                        onBooleanOperation={onBooleanOperation}
                        isPro={isPro}
                        onOpenPricing={onOpenPricing}
                        documentColors={documentColors}
                     />
                  )}
                  {selectedLayer.type === 'text' && (
                     <TextTools
                        layer={selectedLayer as TextLayer}
                        onUpdateTextLayer={(id, changes) => updateLayer(id, changes)}
                        documentColors={documentColors}
                        onMagicWrite={() => { /* logic handled in component or store */ }}
                        showFontPicker={showFontPicker}
                        setShowFontPicker={setShowFontPicker}
                        fontSearch={fontSearch}
                        setFontSearch={setFontSearch}
                        fontPickerRef={fontPickerRef}
                        showRewriteTones={showRewriteTones}
                        setShowRewriteTones={setShowRewriteTones}
                        rewriteRef={rewriteRef}
                        handleToneRewrite={handleToneRewrite}
                        showTextEffects={showTextEffects}
                        setShowTextEffects={setShowTextEffects}
                        textEffectsRef={textEffectsRef}
                        showGlyphs={showGlyphs}
                        setShowGlyphs={setShowGlyphs}
                     />
                  )}
                  {(selectedLayer.type !== 'text' && selectedLayer.type !== 'image') && (
                     <ShapeTools
                        layer={selectedLayer as any}
                        handleUpdateLayer={handleUpdateLayer}
                        documentColors={documentColors}
                        isPro={isPro}
                        onOpenPricing={onOpenPricing}
                     />
                  )}
                  {selectedLayer.type === 'image' && (
                     <ImageTools
                        layer={selectedLayer as any}
                        isRemovingBg={isRemovingBgStore}
                        isExpanding={isExpandingStore}
                        isEraserActive={isEraserActiveStore}
                        isPro={isPro}
                        handleRemoveBackground={() => onRmBg(selectedLayer.id)}
                        handleEraserClick={toggleEraser}
                        handleMagicExpand={() => onMagicExpand(selectedLayer.id)}
                        onRemix={onRemix}
                        handleUpdateLayer={handleUpdateLayer}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        onUpscale={() => onUpscale(selectedLayer.id)}
                        onEnhance={() => onEnhance(selectedLayer.id)}
                        onRetouch={() => onRetouch(selectedLayer.id)}
                        onCrop={() => onCropAction(selectedLayer.id)}
                        showResize={showResize}
                        setShowResize={setShowResize}
                        onVectorize={() => vectorizeLayer(selectedLayer.id, {})}
                     />
                  )}
               </div>

               <div className="h-8 w-px bg-gray-700 mx-1 sm:mx-2 shrink-0 hidden md:block"></div>

               <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
                  <TransformTools
                     selectedLayer={selectedLayer}
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
