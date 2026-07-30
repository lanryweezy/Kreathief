import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
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

export const Toolbar = React.memo(
  ({ documentColors = [], onCompletePath, onBooleanOperation, onBooleanHover }: ToolbarProps) => {
    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [showResize, setShowResize] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showRewriteTones, setShowRewriteTones] = useState(false);
    const [showGlyphs, setShowGlyphs] = useState(false);
    const [fontSearch, setFontSearch] = useState('');

    // Refs
    const rewriteRef = useRef<HTMLButtonElement>(null);

    // Actions are stable refs — safe to grab once without triggering re-renders
    const s = useStore.getState();
    const updateLayer = s.updateLayer;
    const onDeleteLayer = s.deleteLayer;
    const onDuplicateLayer = s.duplicateLayer;
    const onMoveLayer = s.moveLayer;
    const onAlignLayers = s.alignLayers;
    const onGroup = s.groupSelected;
    const onUngroup = s.ungroupSelected;
    const onRmBg = s.onRmBg;
    const vectorizeLayer = s.vectorizeLayer;
    const onCropAction = s.onCrop;
    const onEnhance = s.onEnhance;
    const onUpscale = s.onUpscale;
    const onRetouch = s.onRetouch;
    const onRemix = s.onRemix;
    const onMagicExpand = s.onMagicExpand;
    const setIsProcessing = s.setIsProcessing;
    const setActiveTab = s.setActiveTab;
    const setIsLassoMode = s.setIsLassoMode;
    const setRefineBrushMode = s.setRefineBrushMode;
    const setRefineBrushSize = s.setRefineBrushSize;

    // Only subscribe to changing state
    const selectedLayerIds = useStore((state) => state.selectedLayerIds);

    const isRemovingBgStore = useStore((state) => state.isRemovingBg);
    const isExpandingStore = useStore((state) => state.isExpanding);
    const isSmartMaskModeStore = useStore((state) => state.isSmartMaskMode);
    const setIsSmartMaskMode = useStore((state) => state.setIsSmartMaskMode);
    const isLassoModeStore = useStore((state) => state.isLassoMode);
    const refineBrushModeStore = useStore((state) => state.refineBrushMode);
    const refineBrushSizeStore = useStore((state) => state.refineBrushSize);

    const doneLasso = () => setIsLassoMode(false);
    const cancelLasso = () => setIsLassoMode(false);

    const selectedLayer = useStore(selectedLayerSelector);
    const isMultiSelect = (selectedLayerIds || []).length > 1;

    const selectedLayers = useStore(
      useShallow((state) => {
        const artboard = state.artboards.find((a) => a.id === state.activeArtboardId);
        if (!artboard || !state.selectedLayerIds) {
          return [];
        }

        // ⚡ Bolt Optimization: Replaced O(N*M) array search (mapping over selectedLayerIds and finding in layers)
        // with O(N) Set-based filter approach. This significantly reduces CPU overhead when many layers are selected.
        const selectedIdsSet = new Set(state.selectedLayerIds);
        return artboard.layers.filter((l) => selectedIdsSet.has(l.id));
      })
    );
    const selectedLayersRef = React.useRef(selectedLayers);
    selectedLayersRef.current = selectedLayers;
    const stableSelectedLayers = React.useMemo(() => selectedLayersRef.current, [selectedLayerIds]);

    // Listen for "open effects panel" event
    useEffect(() => {
      const handleOpenEffects = () => {
        setActiveTab(NavTab.TEXT);
        // We could ideally trigger the inner tab state of TextPanel here, but setting active tab to TEXT is the fallback.
      };
      window.addEventListener('open-effects-panel', handleOpenEffects);
      return () => window.removeEventListener('open-effects-panel', handleOpenEffects);
    }, [setActiveTab]);

    const handleUpdateLayer = useCallback(
      (changes: any) => {
        if (!selectedLayer) {
          return;
        }
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
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                Selected ({(selectedLayerIds || []).length})
              </span>
              <Divider />

              {/* Boolean Operations for Multi-Path Selection */}
              {selectedLayers.length >= 2 &&
                selectedLayers.every((l) => (l as any).type === 'path' || (l as any).vectorPath) && (
                  <>
                    <VectorTools
                      layer={selectedLayer!}
                      handleUpdateLayer={handleUpdateLayer}
                      onCompletePath={onCompletePath}
                      onBooleanOperation={onBooleanOperation}
                      onBooleanHover={onBooleanHover}
                      documentColors={documentColors}
                    />
                    <Divider />
                  </>
                )}

              <div className="flex bg-black/40 rounded-xl border border-white/5 p-1 gap-1">
                <IconButton onClick={() => onAlignLayers?.('left')} title="Align Left" aria-label="Align Left">
                  <Icons.AlignLeft className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={() => onAlignLayers?.('center')} title="Align Center" aria-label="Align Center">
                  <Icons.AlignCenter className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={() => onAlignLayers?.('right')} title="Align Right" aria-label="Align Right">
                  <Icons.AlignRight className="w-4 h-4" />
                </IconButton>
              </div>
              <div className="flex items-center gap-1">
                <IconButton onClick={onGroup} title="Group" shortcut="Ctrl+G" aria-label="Group">
                  <Icons.Group className="w-4 h-4" />
                </IconButton>
                <IconButton onClick={onUngroup} title="Ungroup" shortcut="Ctrl+Shift+G" aria-label="Ungroup">
                  <Icons.Ungroup className="w-4 h-4" />
                </IconButton>
              </div>
              <Divider />
              <IconButton
                onClick={() => (selectedLayerIds || []).forEach((id) => onDeleteLayer(id))}
                title="Delete All"
                aria-label="Delete All"
              >
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
                    onMagicWrite={(id) => {
                      setShowRewriteTones(true);
                    }}
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
                    selectedLayers={selectedLayers as any}
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
                    isSmartMaskMode={!!isSmartMaskModeStore}
                    setIsSmartMaskMode={setIsSmartMaskMode as any}
                    handleRemoveBackground={() => onRmBg(selectedLayer.id)}
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
  }
);

Toolbar.displayName = 'Toolbar';
