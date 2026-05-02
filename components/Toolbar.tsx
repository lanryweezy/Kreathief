import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { selectedLayerSelector } from '../store/selectors';
import { NavTab, TextLayer } from '../types';
import { Icons } from '../constants';
import * as geminiService from '../services/geminiService';
import { log } from '../utils/log';

// Modular Sub-components
import { Divider, IconButton } from './toolbar/ToolbarShared';
import { CanvasTools } from './toolbar/CanvasTools';
import { TransformTools } from './toolbar/TransformTools';
import { TextTools } from './toolbar/TextTools';
import { VectorTools } from './toolbar/VectorTools';
import { ShapeTools } from './toolbar/ShapeTools';
import { ImageTools } from './toolbar/ImageTools';
import { CommonActions } from './toolbar/CommonActions';
import { AutoLayoutTools } from './toolbar/AutoLayoutTools';

interface ToolbarProps {
  uploadedImage: string | null;
  documentColors?: string[];
  onToggleEraser?: () => void;
  isEraserActive?: boolean;
  onCompletePath?: () => void;
  onJoinPaths?: () => void;
  onBooleanOperation?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  onBooleanHover?: (operation: 'union' | 'subtract' | 'intersect' | 'exclude' | null) => void;
  onCrop?: (id: string) => void;
}

export const Toolbar = React.memo(({ documentColors = [], onCompletePath, onBooleanOperation, onBooleanHover }: ToolbarProps) => {
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showResize, setShowResize] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showRewriteTones, setShowRewriteTones] = useState(false);
  const [showGlyphs, setShowGlyphs] = useState(false);
  const [fontSearch, setFontSearch] = useState('');

  // Refs
  const rewriteRef = useRef<HTMLButtonElement>(null);

  // Store Actions
  const {
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
    setIsProcessing,
    setActiveTab,
    setIsLassoMode,
    setRefineBrushMode,
    setRefineBrushSize,
  } = useStore();

  const isRemovingBgStore = useStore((state) => state.isRemovingBg);
  const isExpandingStore = useStore((state) => state.isExpanding);
  const isEraserActiveStore = useStore((state) => state.isEraserActive);
  const isLassoModeStore = useStore((state) => state.isLassoMode);
  const refineBrushModeStore = useStore((state) => state.refineBrushMode);
  const refineBrushSizeStore = useStore((state) => state.refineBrushSize);

  const doneLasso = () => setIsLassoMode(false);
  const cancelLasso = () => setIsLassoMode(false);

  const selectedLayer = useStore(selectedLayerSelector);
  const isMultiSelect = (selectedLayerIds || []).length > 1;

  // Listen for "open effects panel" event
  useEffect(() => {
    const handleOpenEffects = () => setActiveTab(NavTab.TEXT_EFFECTS);
    window.addEventListener('open-effects-panel', handleOpenEffects);
    return () => window.removeEventListener('open-effects-panel', handleOpenEffects);
  }, [setActiveTab]);

  const handleUpdateLayer = useCallback(
    (changes: any) => {
      if (!selectedLayer) {return;}
      updateLayer(selectedLayer.id, changes);
    },
    [selectedLayer, updateLayer]
  );

  const handleToneRewrite = async (id: string, instruction: string) => {
    setShowRewriteTones(false);
    setIsProcessing(true);
    try {
      const newText = await geminiService.generateText((selectedLayer as TextLayer).text, instruction);
      updateLayer(id, { text: newText });
    } catch (error) {
      log.error('[Toolbar] Text rewrite failed', error, { layerId: id });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full h-full">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
          {isMultiSelect ? (
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-[#7d2ae8] uppercase tracking-widest">Selected ({(selectedLayerIds || []).length})</span>
              <Divider />
              <div className="flex bg-black/40 rounded-xl border border-white/5 p-1 gap-1">
                <IconButton onClick={() => onAlignLayers?.('left')} title="Align Left">
                  <Icons.AlignLeft className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={() => onAlignLayers?.('center')} title="Align Center">
                  <Icons.AlignCenter className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={() => onAlignLayers?.('right')} title="Align Right">
                  <Icons.AlignRight className="w-4 h-4" />
                </IconButton>
              </div>
              <div className="flex items-center gap-1">
                <IconButton onClick={onGroup} title="Group" shortcut="Ctrl+G">
                  <Icons.Group className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={onUngroup} title="Ungroup" shortcut="Ctrl+Shift+G">
                  <Icons.Ungroup className="w-4 h-4" />
                </IconButton>
              </div>
              <Divider />
              <IconButton onClick={() => (selectedLayerIds || []).forEach((id) => onDeleteLayer(id))} title="Delete All">
                <Icons.Trash className="w-4 h-4 text-red-400" />
              </IconButton>
            </div>
          ) : !selectedLayer ? (
            <CanvasTools documentColors={documentColors} />
          ) : (
            <>
              <div className="flex items-center gap-4">
                {((selectedLayer as any).type === 'path' || (selectedLayer as any).vectorPath) && (
                  <VectorTools
                    layer={selectedLayer}
                    handleUpdateLayer={handleUpdateLayer}
                    onCompletePath={onCompletePath}
                    onBooleanOperation={onBooleanOperation}
                    onBooleanHover={onBooleanHover}
                    documentColors={documentColors}
                  />
                )}
                {selectedLayer.type === 'text' && (
                  <TextTools
                    layer={selectedLayer as TextLayer}
                    onUpdateTextLayer={(id, changes) => updateLayer(id, changes)}
                    documentColors={documentColors}
                    onMagicWrite={() => {}}
                    showFontPicker={showFontPicker}
                    setShowFontPicker={setShowFontPicker}
                    fontSearch={fontSearch}
                    setFontSearch={setFontSearch}
                    showRewriteTones={showRewriteTones}
                    setShowRewriteTones={setShowRewriteTones}
                    rewriteRef={rewriteRef}
                    handleToneRewrite={handleToneRewrite}
                    showGlyphs={showGlyphs}
                    setShowGlyphs={setShowGlyphs}
                  />
                )}
                {selectedLayer.type !== 'text' && selectedLayer.type !== 'image' && (
                  <ShapeTools
                    layer={selectedLayer as any}
                    handleUpdateLayer={handleUpdateLayer}
                    documentColors={documentColors}
                  />
                )}
                {selectedLayer.type === 'image' && (
                  <ImageTools
                    layer={selectedLayer as any}
                    isPro={true}
                    isRemovingBg={isRemovingBgStore}
                    isExpanding={isExpandingStore}
                    isEraserActive={isEraserActiveStore}
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
                    onCrop={() => {
                      onCropAction(selectedLayer.id);
                      setIsLassoMode(false);
                    }}
                    showResize={showResize}
                    setShowResize={setShowResize}
                    setIsLassoMode={(active) => {
                      setIsLassoMode(active);
                      if (active) {
                        useStore.setState({ croppingLayerId: selectedLayer.id } as any);
                      }
                    }}
                    isLassoMode={isLassoModeStore}
                    refineBrushMode={refineBrushModeStore}
                    setRefineBrushMode={setRefineBrushMode}
                    refineBrushSize={refineBrushSizeStore}
                    setRefineBrushSize={setRefineBrushSize}
                    doneLasso={doneLasso}
                    cancelLasso={cancelLasso}
                    _onVectorize={() => vectorizeLayer(selectedLayer.id, {})}
                  />
                )}
              </div>

              <Divider />

              <div className="flex items-center gap-4">
                <AutoLayoutTools selectedLayer={selectedLayer} handleUpdateLayer={handleUpdateLayer} />
                <TransformTools selectedLayer={selectedLayer} />
                <CommonActions
                  selectedLayer={selectedLayer}
                  handleUpdateLayer={handleUpdateLayer}
                  documentColors={documentColors}
                  onMoveLayer={onMoveLayer}
                  onDuplicateLayer={onDuplicateLayer}
                  onDeleteLayer={onDeleteLayer}
                />
              </div>
            </>
          )}
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';
