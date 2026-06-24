import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Icons } from '../../constants';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { analyticsService } from '../../services/analyticsService';
import { log } from '../../utils/log';
import { ColorProfile, batchExportArtboardsZip } from '../../services/exportService';
import { isWithinCMYKGamut, getClosestCMYKSafeColor } from '../../utils/colorUtils';
import { Button } from '../Button';
import { Input } from '../Input';
import { Toggle } from '../Toggle';

interface ExportModalProps {
  onClose: () => void;
  onExport: (
    format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd',
    quality: number,
    size?: { width: number; height: number },
    transparentBg?: boolean,
    customFilename?: string,
    overrideLayers?: any[],
    printOptions?: { colorProfile: ColorProfile; bleed: number; cropMarks: boolean }
  ) => Promise<void>;
  onGetPngBlob?: () => Promise<Blob | null>;
  currentSize: { width: number; height: number; name: string };
}

const EXPORT_PRESETS = [
  { id: 'current', name: 'Current', width: 0, height: 0 },
  { id: 'ig_post', name: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'ig_story', name: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'fb_cover', name: 'Facebook Cover', width: 820, height: 312 },
  { id: 'twitter_header', name: 'Twitter Header', width: 1500, height: 500 },
  { id: 'hd_video', name: 'HD Video (1080p)', width: 1920, height: 1080 },
  { id: '4k_wallpaper', name: '4K Ultra HD', width: 3840, height: 2160 },
];

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, onGetPngBlob, currentSize }) => {
  const { addToast, artboards, activeArtboardId, selectedLayerIds, projectTitle, user } = useStore(
    useShallow((state) => ({
      addToast: state.addToast,
      artboards: state.artboards,
      activeArtboardId: state.activeArtboardId,
      selectedLayerIds: state.selectedLayerIds,
      projectTitle: state.projectTitle,
      user: state.user,
    }))
  );
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd'>('png');
  const [quality, setQuality] = useState(0.95);
  const [activePreset, setActivePreset] = useState<string>('current');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [exportStage, setExportStage] = useState<string>('');
  const [exportScale, setExportScale] = useState<number>(1);
  const [dpi, setDpi] = useState<number>(150);
  const [exportProgress, setExportProgress] = useState(0);
  // 🌸 Bloom: Ensure default export filenames strictly adhere to safe character limits and fallback gracefully
  const sanitizeFilename = (name: string) =>
    name
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() || 'design';

  const [filename, setFilename] = useState<string>(
    projectTitle && projectTitle !== 'Untitled Design'
      ? sanitizeFilename(projectTitle)
      : currentSize.name
        ? sanitizeFilename(currentSize.name)
        : 'design'
  );

  const [filenameFeedback, setFilenameFeedback] = useState<string>('');

  // CMYK Print export options
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [colorProfile, setColorProfile] = useState<ColorProfile>('FOGRA39');
  const [bleed, setBleed] = useState<number>(9); // 1/8 inch default
  const [cropMarks, setCropMarks] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const [transparentBg, setTransparentBg] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  // Batch export state
  const [batchMode, setBatchMode] = useState(false);
  const [selectedArtboardIds, setSelectedArtboardIds] = useState<string[]>([]);

  // Gamut Validation for Print
  const outOfGamutCount = React.useMemo(() => {
    if (format !== 'pdf' || !isPrintMode) {
      return 0;
    }
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
    if (!activeArtboard) {
      return 0;
    }
    // @ts-ignore - necessary due to canvas library typings - color may exist on layer
    return activeArtboard.layers.filter((l) => l.color && !isWithinCMYKGamut(l.color)).length;
  }, [format, isPrintMode, artboards, activeArtboardId]);

  const handleSnapAllToSafe = useCallback(() => {
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
    if (!activeArtboard) {
      return;
    }

    const updates: Record<string, any> = {};
    activeArtboard.layers.forEach((l) => {
      // @ts-ignore - necessary due to canvas library typings - color may exist on layer
      if (l.color && !isWithinCMYKGamut(l.color)) {
        // @ts-ignore - necessary due to canvas library typings
        updates[l.id] = { color: getClosestCMYKSafeColor(l.color) };
      }
    });

    if (Object.keys(updates).length > 0) {
      useStore.getState().updateLayers(updates);
      addToast(`Optimized ${Object.keys(updates).length} layers for print`, 'success');
    }
  }, [artboards, activeArtboardId, addToast]);

  // Format-aware quality reset for #20
  React.useEffect(() => {
    if (format === 'webp') {
      setQuality(0.8);
    } else if (format === 'jpeg') {
      setQuality(0.9);
    } else {
      setQuality(1);
    }
    if (format === 'pdf') {
      setDpi(300);
    } else {
      setDpi(150);
    }
  }, [format]);

  const presets = React.useMemo(
    () => [
      {
        id: 'current',
        name: `Current (${currentSize.width}x${currentSize.height})`,
        width: currentSize.width,
        height: currentSize.height,
      },
      ...EXPORT_PRESETS.slice(1),
    ],
    [currentSize.width, currentSize.height]
  );

  const handleExportClick = async () => {
    setIsExporting(true);
    setExportStage('Preparing assets...');

    try {
      const preset = presets.find((p) => p.id === activePreset);
      const dpiScale = dpi / 72;
      const scale = exportScale * dpiScale;
      const size = preset
        ? { width: Math.round(preset.width * scale), height: Math.round(preset.height * scale) }
        : { width: Math.round(currentSize.width * scale), height: Math.round(currentSize.height * scale) };

      setExportStage('Rendering design...');

      // 🌸 Bloom: Handle empty filename edge case by providing a safe fallback instead of failing
      const safeCustomFilename = filename.trim() || 'design';

      // Handle print mode PDF export separately
      if (format === 'pdf' && isPrintMode) {
        // For print mode, we need to get the canvas data URL first
        await onExport(format, quality, size, false, safeCustomFilename + '_print');
        // The actual print PDF export would be handled by the parent component
        // with the exportToPrintPDF function
      } else {
        await onExport(format, quality, size, transparentBg && format === 'png', safeCustomFilename);
      }

      // Track once removed duplicate call
      analyticsService.trackExport(format, quality, {
        printMode: isPrintMode,
        colorProfile: isPrintMode ? colorProfile : undefined,
        bleed: isPrintMode ? bleed : undefined,
        cropMarks: isPrintMode ? cropMarks : undefined,
      });

      setExportStage('Complete!');
      addToast(
        isPrintMode ? 'Print-ready PDF exported with CMYK profile!' : `Exported as ${format.toUpperCase()}!`,
        'success'
      );
      setTimeout(() => onClose(), 300);
    } catch (e: any) {
      log.error('[ExportModal] Export failed', e, { format, quality, isPrintMode });
      addToast(
        'Export failed',
        'error',
        { label: 'Try Again', onClick: handleExportClick },
        e.message || 'The canvas might be too large for this format.'
      );
      setExportStage('');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!artboards || artboards.length === 0) {
      addToast('No artboards to export', 'error');
      return;
    }
    setIsExporting(true);
    setExportProgress(0);
    let successCount = 0;
    const failedArtboards: string[] = [];

    try {
      for (let i = 0; i < artboards.length; i++) {
        const ab = artboards[i];
        const label = ab.name || `Artboard ${i + 1}`;
        const safeFilename = sanitizeFilename(label);
        const progressPercent = Math.round(((i + 1) / artboards.length) * 100);
        setExportStage(`Exporting "${label}" (${i + 1}/${artboards.length}) — ${progressPercent}%`);
        setExportProgress(progressPercent);

        // Export from stored artboard data — no need to switch active artboard

        const dpiScale = dpi / 72;
        if (format === 'pdf' && isPrintMode) {
          await onExport(
            format,
            quality,
            {
              width: Math.round((ab.width || currentSize.width) * dpiScale),
              height: Math.round((ab.height || currentSize.height) * dpiScale),
            },
            false,
            `${safeFilename}_print`,
            ab.layers
          );
        } else {
          await onExport(
            format,
            quality,
            {
              width: Math.round((ab.width || currentSize.width) * dpiScale),
              height: Math.round((ab.height || currentSize.height) * dpiScale),
            },
            transparentBg && format === 'png',
            safeFilename,
            ab.layers
          );
        }

        analyticsService.trackExport(format, quality, {
          batchExport: true,
          printMode: isPrintMode,
          colorProfile: isPrintMode ? colorProfile : undefined,
        });
        successCount++;
      }

      const message = isPrintMode
        ? `${successCount} print-ready PDF${successCount !== 1 ? 's' : ''} exported!`
        : `${successCount} artboard${successCount !== 1 ? 's' : ''} exported as ${format.toUpperCase()}!`;

      setExportStage(message);
      addToast(message, 'success');

      if (failedArtboards.length > 0) {
        addToast(`${failedArtboards.length} failed: ${failedArtboards.join(', ')}`, 'warning');
      }

      setTimeout(() => onClose(), 1000);
    } catch (e: any) {
      log.error('[ExportModal] Export All failed', e);
      addToast(`Failed after ${successCount} artboard(s). Try exporting individually.`, 'error');
    } finally {
      setIsExporting(false);
      setExportStage('');
      setExportProgress(0);
    }
  };

  const handleExportSelection = async () => {
    if (!selectedLayerIds || selectedLayerIds.length === 0) {
      addToast('Select one or more layers first', 'warning');
      return;
    }
    setIsExporting(true);
    setExportStage(`Exporting ${selectedLayerIds.length} layer(s)...`);
    try {
      const safeCustomFilename = filename.trim() || 'design';
      await onExport(
        format,
        quality,
        { width: currentSize.width, height: currentSize.height },
        transparentBg && format === 'png',
        `${safeCustomFilename}-selection`
      );
      addToast(`Selection exported as ${format.toUpperCase()}!`, 'success');
      setTimeout(() => onClose(), 300);
    } catch (e: any) {
      log.error('[ExportModal] Export Selection failed', e);
      addToast('Export Selection failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLayer = async () => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) {
      addToast('Select exactly one layer to export as layer', 'warning');
      return;
    }
    setIsExporting(true);
    const layerId = selectedLayerIds[0];
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
    const layer = activeArtboard?.layers.find((l) => l.id === layerId);
    const layerName = layer?.name || `layer-${layerId.slice(0, 6)}`;
    setExportStage(`Exporting layer "${layerName}"...`);
    try {
      const safeLayerFilename = sanitizeFilename(layerName);
      const dpiScale = dpi / 72;
      const scale = exportScale * dpiScale;
      await onExport(
        format,
        quality,
        { width: Math.round(currentSize.width * scale), height: Math.round(currentSize.height * scale) },
        transparentBg && format === 'png',
        `${safeLayerFilename}`,
        layer ? [layer] : undefined
      );
      addToast(`Layer "${layerName}" exported as ${format.toUpperCase()}!`, 'success');
      setTimeout(() => onClose(), 300);
    } catch (e: any) {
      log.error('[ExportModal] Export Layer failed', e);
      addToast('Export Layer failed', 'error');
    } finally {
      setIsExporting(false);
      setExportStage('');
    }
  };

  const handleBatchExport = async () => {
    const selected = artboards.filter((ab) => selectedArtboardIds.includes(ab.id));
    if (selected.length === 0) {
      addToast('Select at least one artboard to export', 'warning');
      return;
    }

    setIsExporting(true);
    setExportStage(`Exporting ${selected.length} artboard(s)...`);

    try {
      const exportableFormat = ['png', 'jpeg', 'webp', 'svg'].includes(format)
        ? (format as 'png' | 'jpeg' | 'webp' | 'svg')
        : 'png';
      await batchExportArtboardsZip(
        selected.map((ab) => ({
          id: ab.id,
          name: ab.name,
          width: ab.width || currentSize.width,
          height: ab.height || currentSize.height,
          layers: ab.layers,
          backgroundColor: ab.backgroundColor || '#ffffff',
        })),
        exportableFormat,
        quality
      );

      analyticsService.trackExport(format, quality, { batchExport: true, artboardCount: selected.length });
      addToast(`Exported ${selected.length} artboard(s) as ${exportableFormat.toUpperCase()}!`, 'success');
      setTimeout(() => onClose(), 500);
    } catch (e: any) {
      log.error('[ExportModal] Batch export failed', e);
      addToast('Batch export failed', 'error');
    } finally {
      setIsExporting(false);
      setExportStage('');
    }
  };

  const toggleArtboardSelection = (id: string) => {
    setSelectedArtboardIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedArtboardIds.length === artboards.length) {
      setSelectedArtboardIds([]);
    } else {
      setSelectedArtboardIds(artboards.map((ab) => ab.id));
    }
  };

  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    try {
      // Try using the provided blob getter first
      if (onGetPngBlob) {
        const blob = await onGetPngBlob();
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          addToast('Copied to clipboard!', 'success');
          analyticsService.track('export_design', { method: 'clipboard', format: 'png' });
          setIsCopying(false);
          return;
        }
      }
      // Fallback: export as PNG then copy
      await onExport('png', 0.95, { width: currentSize.width, height: currentSize.height });
      addToast('Image downloaded - clipboard copy requires a modern browser.', 'info');
    } catch (e) {
      log.error('[ExportModal] Clipboard copy failed', e);
      addToast('Could not copy to clipboard. Try downloading instead.', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopySvgToClipboard = async () => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) {
      addToast('Select exactly one layer to copy as SVG', 'warning');
      return;
    }
    try {
      const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
      const layer = activeArtboard?.layers.find((l) => l.id === selectedLayerIds[0]);
      if (!layer || layer.type === 'text' || layer.type === 'image' || layer.type === 'group' || layer.type === 'adjustment') {
        addToast('Select a shape layer to copy as SVG', 'warning');
        return;
      }
      const shape = layer as any;
      const viewBox = shape.viewBox || `0 0 ${shape.width} ${shape.height}`;
      let svgContent = '';
      if (shape.pathData) {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${shape.width}" height="${shape.height}"><path d="${shape.pathData}" fill="${shape.color || '#7d2ae8'}"/></svg>`;
      } else {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}" width="${shape.width}" height="${shape.height}"><rect x="0" y="0" width="${shape.width}" height="${shape.height}" fill="${shape.color || '#7d2ae8'}" rx="${shape.cornerRadius || 0}"/></svg>`;
      }
      await navigator.clipboard.writeText(svgContent);
      addToast('SVG copied to clipboard!', 'success');
      analyticsService.track('export_design', { method: 'clipboard', format: 'svg' });
    } catch (e) {
      log.error('[ExportModal] SVG clipboard copy failed', e);
      addToast('Could not copy SVG to clipboard.', 'error');
    }
  };

  const handleExportSelectedAsSvg = async () => {
    if (!selectedLayerIds || selectedLayerIds.length !== 1) {
      addToast('Select exactly one shape layer to export as SVG', 'warning');
      return;
    }
    const activeArtboard = artboards.find((a) => a.id === activeArtboardId);
    const layer = activeArtboard?.layers.find((l) => l.id === selectedLayerIds[0]);
    if (!layer || layer.type === 'text' || layer.type === 'image' || layer.type === 'group' || layer.type === 'adjustment') {
      addToast('Select a shape layer to export as SVG', 'warning');
      return;
    }
    await onExport('svg', 1, { width: currentSize.width, height: currentSize.height }, false, filename);
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto outline-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        className="bg-surface-dark-3 border border-white/10 rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col md:flex-row relative max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-white/5"
          id="close-export-modal"
          data-testid="close-export-modal"
          aria-label="Close modal"
        >
          <div className="text-2xl leading-none" aria-hidden="true">
            &times;
          </div>
        </Button>

        {/* Info/Preview Side */}
        <div className="md:w-[28%] bg-surface-dark-2 p-10 border-r border-white/5 hidden md:flex flex-col select-none relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-900/40 relative z-10">
            <Icons.Download className="w-8 h-8 text-white" />
          </div>
          <h2
            id="export-modal-title"
            className="text-2xl font-black text-white mb-4 tracking-tighter italic relative z-10 uppercase"
          >
            Export Design
          </h2>
          <p className="text-muted-light text-[11px] leading-relaxed mb-10 font-medium relative z-10">
            Download your creation in professional formats. Choose a preset or maintain your native canvas coordinates.
          </p>

          <div className="mt-auto p-6 bg-white/5 border border-white/5 rounded-2xl relative z-10 backdrop-blur-md">
            <h4 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-2">
              Neural Optimization
            </h4>
            <p className="text-[10px] text-muted-light font-medium leading-relaxed">
              Our export engine automatically optimizes PNG buffers for maximum compatibility with Adobe Creative Cloud.
            </p>
          </div>
        </div>

        {/* Controls Side */}
        <div
          data-testid="export-modal"
          className="flex-1 p-10 overflow-y-auto max-h-[80vh] custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
        >
          <div className="space-y-10">
            {/* Format Selection */}
            <div>
              <label className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 block">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp', 'svg', 'pdf', 'psd'] as const).map((f) => (
                  <button
                    key={f}
                    data-testid={`export-${f}-btn`}
                    onClick={() => setFormat(f)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${format === f ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface-dark-4 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Export Mode (only when 2+ artboards) */}
            {artboards && artboards.length >= 2 && (
              <div className="p-4 bg-surface-dark-2 border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icons.Layers className="w-4 h-4 text-brand-600" />
                    <h4 className="text-xs font-bold text-white">Batch Export</h4>
                  </div>
                  <Toggle
                    checked={batchMode}
                    onChange={(checked) => {
                      setBatchMode(checked);
                      if (!checked) setSelectedArtboardIds([]);
                    }}
                    ariaLabel="Toggle Batch Export Mode"
                  />
                </div>

                {batchMode && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-muted-light">
                        {selectedArtboardIds.length} of {artboards.length} selected
                      </p>
                      <button
                        onClick={toggleSelectAll}
                        className="text-[10px] text-brand-600 hover:text-brand-400 font-bold uppercase tracking-wider"
                      >
                        {selectedArtboardIds.length === artboards.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {artboards.map((ab) => (
                        <label
                          key={ab.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedArtboardIds.includes(ab.id)
                              ? 'bg-brand-600/10 border border-brand-600'
                              : 'bg-surface-dark-4 border border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedArtboardIds.includes(ab.id)}
                            onChange={() => toggleArtboardSelection(ab.id)}
                            className="w-3.5 h-3.5 accent-brand-600 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-white truncate block">
                              {ab.name || `Artboard ${ab.id.slice(0, 6)}`}
                            </span>
                            <span className="text-[9px] text-muted-light">
                              {ab.width} x {ab.height}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Print Mode Toggle (PDF only) */}
            {format === 'pdf' && (
              <div className="flex items-center justify-between p-4 bg-surface-dark-2 border border-gray-700 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5 flex items-center gap-2">
                    <Icons.Printer className="w-4 h-4 text-brand-600" />
                    Professional Print (CMYK)
                    {(!user || user.plan === 'free') && (
                      <span className="bg-yellow-500/20 text-yellow-500 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                        PRO
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-muted-light italic">
                    True ICC CMYK conversion with bleed & crop marks
                  </p>
                </div>
                <Toggle
                  checked={isPrintMode}
                  onChange={(checked) => {
                    if (!user || user.plan === 'free') {
                      addToast('True CMYK Export is a Pro Feature.', 'warning');
                      return;
                    }
                    setIsPrintMode(checked);
                  }}
                  ariaLabel="Toggle Professional Print Mode (CMYK)"
                />
              </div>
            )}

            {/* Print Mode Options */}
            {format === 'pdf' && isPrintMode && (
              <div className="space-y-4 p-4 bg-surface-dark-2 border border-brand-600/30 rounded-xl animate-fade-in">
                {/* Gamut Guard Alert */}
                {outOfGamutCount > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <Icons.AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-amber-200 font-bold uppercase tracking-tight">Gamut Warning</p>
                        <p className="text-[9px] text-amber-500/70 leading-relaxed font-medium">
                          {outOfGamutCount} layer{outOfGamutCount > 1 ? 's' : ''} contain colors that cannot be
                          reproduced in print.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSnapAllToSafe}
                      className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-md text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Auto-Fix Gamut Issues
                    </button>
                  </div>
                )}

                {/* Color Profile */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Color Profile
                  </label>
                  <select
                    value={colorProfile}
                    onChange={(e) => setColorProfile(e.target.value as ColorProfile)}
                    className="w-full bg-surface-dark-4 border border-gray-600 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-600 outline-none"
                  >
                    <option value="FOGRA39">FOGRA39 (Offset Printing - EU)</option>
                    <option value="GRACoL">GRACoL (Offset Printing - US)</option>
                    <option value="SWOP">SWOP (Web Offset - US)</option>
                    <option value="CMYK">Generic CMYK</option>
                    <option value="sRGB">sRGB (Digital Only)</option>
                  </select>
                </div>

                {/* Bleed */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="export-bleed"
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                    >
                      Bleed
                    </label>
                    <span className="text-xs text-brand-600 font-mono">
                      {bleed}pt ({(bleed / 72).toFixed(2)}&quot;)
                    </span>
                  </div>
                  <input
                    id="export-bleed"
                    type="range"
                    min="0"
                    max="36"
                    step="3"
                    value={bleed}
                    onChange={(e) => setBleed(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[9px] text-muted-light mt-1">
                    <span>No Bleed</span>
                    <span>1/2&quot;</span>
                  </div>
                </div>

                {/* Crop Marks */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">Crop Marks</h4>
                    <p className="text-[10px] text-muted-light">Add trim guides for printer</p>
                  </div>
                  <Toggle
                    checked={cropMarks}
                    onChange={(checked) => setCropMarks(checked)}
                    ariaLabel="Toggle Crop Marks"
                  />
                </div>
              </div>
            )}

            {/* Quality Slider (JPEG/WebP only) */}
            {['jpeg', 'webp'].includes(format) ? (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-muted-light uppercase tracking-wider">Quality</label>
                  <span className="text-xs font-medium text-brand-600">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  id="export-quality"
                  data-testid="export-quality-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(parseFloat(e.target.value) / 100)}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  aria-label="Quality"
                />
              </div>
            ) : (
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 animate-fade-in">
                <p className="text-[10px] text-muted-light flex items-center gap-1.5">
                  <Icons.Info className="w-3.5 h-3.5 text-blue-400" />
                  {format.toUpperCase()} exports at maximum lossless quality.
                </p>
              </div>
            )}

            {/* Transparent Background (PNG only) */}
            {format === 'png' && (
              <div className="flex items-center justify-between p-4 bg-surface-dark-2 border border-gray-700 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Transparent Background</h4>
                  <p className="text-[10px] text-muted-light italic">Export with alpha channel</p>
                </div>
                <Toggle
                  checked={transparentBg}
                  onChange={(checked) => setTransparentBg(checked)}
                  ariaLabel="Toggle Transparent Background"
                />
              </div>
            )}

            {/* Custom Filename */}
            <div>
              <label
                htmlFor="export-filename"
                className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 block"
              >
                Filename
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="export-filename"
                  type="text"
                  value={filename}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = raw.replace(/[^a-zA-Z0-9_\-\s]/g, '');
                    if (raw !== sanitized) {
                      setFilenameFeedback('Some characters were removed');
                      setTimeout(() => setFilenameFeedback(''), 2000);
                    }
                    setFilename(sanitized);
                  }}
                  className="flex-1 bg-surface-dark-0/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-600 outline-none transition-colors"
                  placeholder="design-name"
                  autoFocus
                />
                <span className="text-muted-light text-sm font-mono">.{format}</span>
              </div>
              {filenameFeedback && (
                <p className="text-[10px] text-amber-400 mt-1 font-medium animate-pulse">{filenameFeedback}</p>
              )}
            </div>

            {/* Scale Multiplier */}
            <div>
              <label className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 block">
                Export Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setExportScale(scale)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${exportScale === scale ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface-dark-4 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>

            {/* DPI Selector */}
            <div>
              <label className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 block">
                DPI (Print Resolution)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[72, 150, 300, 600].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${dpi === d ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface-dark-4 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-light mt-2">
                {dpi <= 72
                  ? 'Screen quality'
                  : dpi <= 150
                    ? 'Web standard'
                    : dpi <= 300
                      ? 'Print quality'
                      : 'High-res print'}
                {format === 'pdf' ? ' — 300 DPI recommended for print' : ''}
              </p>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-bold text-muted-light uppercase tracking-wider mb-3 block">
                Size Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePreset(p.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all ${activePreset === p.id ? 'bg-brand-600/10 border-brand-600 ring-1 ring-brand-600' : 'bg-surface-dark-2 border-gray-700 hover:border-gray-600'}`}
                  >
                    <span className={`text-xs font-bold ${activePreset === p.id ? 'text-white' : 'text-gray-300'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-muted-light">
                      {p.width} x {p.height} px
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Extra export options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleExportAll}
                disabled={isExporting || !artboards || artboards.length <= 1}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                  format === 'pdf' && isPrintMode
                    ? 'bg-brand-600/20 border-brand-600 text-white'
                    : 'bg-surface-dark-4 border-gray-700 text-gray-300 hover:bg-surface-dark-5 hover:border-gray-500'
                }`}
                title={`Export all ${artboards?.length || 0} artboards as ${format.toUpperCase()}${format === 'pdf' && isPrintMode ? ' (Print-ready)' : ''}`}
              >
                <Icons.Download className="w-3.5 h-3.5" />
                <div className="flex flex-col items-start leading-tight">
                  <span>All Artboards ({artboards?.length || 0})</span>
                  {format === 'pdf' && isPrintMode && (
                    <span className="text-[9px] text-brand-600">Print-ready CMYK</span>
                  )}
                </div>
              </button>
              <button
                onClick={handleExportSelection}
                disabled={isExporting || !selectedLayerIds || selectedLayerIds.length === 0}
                className="py-2.5 rounded-xl border border-gray-700 bg-surface-dark-4 text-xs font-bold text-gray-300 hover:bg-surface-dark-5 hover:border-gray-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  selectedLayerIds?.length
                    ? `Export ${selectedLayerIds.length} selected layer(s)`
                    : 'Select layers on canvas first'
                }
              >
                <Icons.Scissors className="w-3.5 h-3.5" />
                <div className="flex flex-col items-start leading-tight">
                  <span>Selection</span>
                  {selectedLayerIds?.length ? (
                    <span className="text-[9px] text-gray-400">({selectedLayerIds.length} layers)</span>
                  ) : null}
                </div>
              </button>
              <button
                onClick={handleExportLayer}
                disabled={isExporting || !selectedLayerIds || selectedLayerIds.length !== 1}
                className="py-2.5 rounded-xl border border-gray-700 bg-surface-dark-4 text-xs font-bold text-gray-300 hover:bg-surface-dark-5 hover:border-gray-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={selectedLayerIds?.length === 1 ? 'Export selected layer only' : 'Select exactly one layer'}
              >
                <Icons.Layers className="w-3.5 h-3.5" />
                <div className="flex flex-col items-start leading-tight">
                  <span>Export Layer</span>
                  {selectedLayerIds?.length === 1 && <span className="text-[9px] text-gray-400">(single layer)</span>}
                </div>
              </button>
            </div>

            {/* SVG Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportSelectedAsSvg}
                disabled={isExporting || !selectedLayerIds || selectedLayerIds.length !== 1}
                className="py-2.5 rounded-xl border border-gray-700 bg-surface-dark-4 text-xs font-bold text-gray-300 hover:bg-surface-dark-5 hover:border-gray-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export selected shape as SVG file"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                <div className="flex flex-col items-start leading-tight">
                  <span>Export as SVG</span>
                  <span className="text-[9px] text-gray-400">(selected shape)</span>
                </div>
              </button>
              <button
                onClick={handleCopySvgToClipboard}
                disabled={isExporting || !selectedLayerIds || selectedLayerIds.length !== 1}
                className="py-2.5 rounded-xl border border-gray-700 bg-surface-dark-4 text-xs font-bold text-gray-300 hover:bg-surface-dark-5 hover:border-gray-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Copy selected shape as SVG to clipboard"
              >
                <Icons.Copy className="w-3.5 h-3.5" />
                <div className="flex flex-col items-start leading-tight">
                  <span>Copy SVG</span>
                  <span className="text-[9px] text-gray-400">(to clipboard)</span>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Copy to Clipboard */}
              <button
                data-testid="copy-png-btn"
                onClick={handleCopyToClipboard}
                disabled={isCopying || isExporting}
                className="flex-1 py-3 rounded-xl font-bold border border-gray-600 bg-surface-dark-4 hover:bg-surface-dark-5 hover:border-gray-500 text-gray-300 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                title="Copy PNG to clipboard"
              >
                {isCopying ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <Icons.Copy className="w-4 h-4" />
                )}
                <span>{isCopying ? 'Copying…' : 'Copy PNG'}</span>
              </button>

              {/* Download */}
              <button
                data-testid="download-btn"
                onClick={batchMode && selectedArtboardIds.length > 0 ? handleBatchExport : handleExportClick}
                disabled={isExporting || isCopying || (batchMode && selectedArtboardIds.length === 0)}
                className={`flex-[2] py-3 rounded-xl font-bold shadow-lg transform transition-all flex flex-col items-center justify-center gap-1 ${isExporting ? 'bg-gray-800' : 'bg-gradient-to-r from-accent to-brand-600 hover:scale-[1.02] active:scale-[0.98] shadow-purple-900/40'}`}
              >
                {isExporting ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full"></div>
                      <span className="text-sm font-black uppercase tracking-widest text-accent">{exportStage}</span>
                    </div>
                    <div className="w-48 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-brand-600 transition-all duration-300"
                        style={{ width: `${exportProgress || 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {batchMode ? `Download All (${selectedArtboardIds.length})` : `Download ${format.toUpperCase()}`}
                    </span>
                    <Icons.Download className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
