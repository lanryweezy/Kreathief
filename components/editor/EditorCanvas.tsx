import React from 'react';
import { useStore } from '../../store/useStore';
import { Icons } from '../../constants';
import { Layer, NavTab } from '../../types';
import { Canvas } from '../Canvas';
import { CursorOverlay } from '../collaboration/CursorOverlay';
import { ErrorBoundary } from '../ErrorBoundary';
const MockupPanel = React.lazy(() => import('../panels/MockupPanel').then((m) => ({ default: m.MockupPanel })));

interface EditorCanvasProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  onFileUpload: (files: File[]) => void;
  onAddLogoToCanvas: (url: string) => void;
  onDoubleClickLayer: (layer: Layer) => void;
  booleanPreview: { path: string; operation: string } | null;
  onUpdatePath: (path: any) => void;
  previewAnimation?: any;
  showGrid: boolean;
  showRulers: boolean;
  onToggleGrid: (show: boolean) => void;
  onToggleRulers: (show: boolean) => void;
  activeTab: NavTab;
  selectedLayerIds: string[];
  isMobile: boolean;
  onExportForMockup: () => Promise<string>;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = React.memo(
  ({
    zoom,
    setZoom,
    onFileUpload,
    onAddLogoToCanvas,
    onDoubleClickLayer,
    booleanPreview,
    onUpdatePath,
    previewAnimation,
    showGrid,
    showRulers,
    onToggleGrid,
    onToggleRulers,
    activeTab,
    selectedLayerIds,
    isMobile,
    onExportForMockup,
  }) => {
    const handleFitToScreen = () => {
      const state = useStore.getState();
      const abs = state.artboards || [];
      if (abs.length === 0) return;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      abs.forEach((a: any) => {
        minX = Math.min(minX, a.x);
        minY = Math.min(minY, a.y);
        maxX = Math.max(maxX, a.x + a.width);
        maxY = Math.max(maxY, a.y + a.height);
      });

      const vw = window.innerWidth * 0.85;
      const vh = window.innerHeight * 0.85;
      const contentW = maxX - minX;
      const contentH = maxY - minY;
      const newZoom = Math.min(vw / contentW, vh / contentH, 5);
      setZoom(newZoom);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      state.setPanOffset({
        x: vw / 2 - centerX * newZoom + window.innerWidth * 0.075,
        y: vh / 2 - centerY * newZoom + 20,
      });
    };

    const handleZoomToSelection = () => {
      const state = useStore.getState();
      let layer: any = null;
      for (const ab of state.artboards || []) {
        layer = ab.layers?.find((l: any) => l.id === selectedLayerIds[0]);
        if (layer) break;
      }
      if (!layer) return;

      const vw = window.innerWidth * 0.85;
      const vh = window.innerHeight * 0.85;
      const lw = layer.width || 100;
      const lh = layer.height || 100;
      const newZoom = Math.min(vw / lw, vh / lh, 10);
      setZoom(newZoom);

      const cx = (layer.x || 0) + lw / 2;
      const cy = (layer.y || 0) + lh / 2;
      useStore.getState().setPanOffset({
        x: vw / 2 - cx * newZoom + window.innerWidth * 0.075,
        y: vh / 2 - cy * newZoom + 20,
      });
    };

    const handleZoomInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const val = parseInt((e.target as HTMLInputElement).value.replace('%', ''));
        if (!isNaN(val)) {
          setZoom(Math.max(0.1, Math.min(10, val / 100)));
        }
      }
    };

    const handleZoomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value.replace('%', ''));
      if (!isNaN(val)) {
        setZoom(Math.max(0.1, Math.min(10, val / 100)));
      }
    };

    const showSelectionZoom =
      selectedLayerIds.length === 1 &&
      (() => {
        const state = useStore.getState();
        let layer: any = null;
        for (const ab of state.artboards || []) {
          layer = ab.layers?.find((l: any) => l.id === selectedLayerIds[0]);
          if (layer) break;
        }
        return layer;
      })();

    return (
      <div className="flex-1 relative overflow-hidden flex flex-row">
        <ErrorBoundary componentName="Canvas" variant="widget">
          <Canvas
            onDoubleClickLayer={onDoubleClickLayer}
            zoom={zoom}
            onZoomChange={setZoom}
            onFileUpload={onFileUpload}
            onAddLogoToCanvas={onAddLogoToCanvas}
            booleanPreview={booleanPreview}
            onUpdatePath={onUpdatePath}
            previewAnimation={previewAnimation}
          />
        </ErrorBoundary>
        <CursorOverlay />

        {/* Floating Zoom & View Controls */}
        <div className="absolute bottom-4 right-4 z-[90] flex items-center bg-surface-dark-3/90 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-2xl">
          <div className="flex items-center px-1">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <Icons.Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              value={Math.round(zoom * 100) + '%'}
              onChange={() => {}}
              onKeyDown={handleZoomInput}
              onBlur={handleZoomBlur}
              className="px-1 w-[42px] text-center text-[10px] font-black text-gray-300 font-mono bg-transparent border border-white/10 rounded outline-none focus:border-brand/50"
              title="Zoom Level"
            />
            <button
              onClick={() => setZoom(Math.min(10, zoom + 0.1))}
              className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-800 mx-1" />

          <div className="flex items-center gap-1 px-1">
            <button
              onClick={handleFitToScreen}
              className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white rounded-md transition-colors"
              title="Fit to Screen"
            >
              Fit
            </button>
            {showSelectionZoom && (
              <button
                onClick={handleZoomToSelection}
                className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white rounded-md transition-colors"
                title="Zoom to Selection"
              >
                Sel
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-gray-800 mx-1" />

          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => onToggleGrid(!showGrid)}
              className={`p-1.5 rounded-md transition-all ${showGrid ? 'bg-brand/20 text-brand' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              title="Toggle Grid"
            >
              <Icons.Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleRulers(!showRulers)}
              className={`p-1.5 rounded-md transition-all ${showRulers ? 'bg-brand/20 text-brand' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              title="Toggle Rulers"
            >
              <Icons.Layout className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeTab === NavTab.MOCKUP && !isMobile && (
          <div className="absolute inset-0 z-[100] bg-surface-dark-2 flex animate-in fade-in slide-in-from-right duration-300">
            <div className="flex-1 relative overflow-hidden flex flex-row">
              <MockupPanel
                onExportForMockup={onExportForMockup}
                variant="full"
                onClose={() => useStore.getState().setActiveTab(NavTab.MAGIC)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

EditorCanvas.displayName = 'EditorCanvas';
