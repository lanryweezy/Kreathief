import { useStore } from '../store/useStore';
import { ImageLayer } from '../types';
import * as exportService from '../services/exportService';
import { storageService } from '../services/storageService';
import { generateLayerId } from '../utils/layers/layerUtils';
import { log } from '../utils/log';
import { haptics } from '../utils/haptics';

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf' | 'psd';
  quality: number;
  size?: { width: number; height: number };
  transparentBg?: boolean;
  customFilename?: string;
  onComplete?: () => void;
  overrideLayers?: any[];
  printOptions?: exportService.PDFExportOptions;
}

export const useFileHandler = () => {
  const uploads = useStore((state) => state.uploads) || [];
  const history = useStore((state) => state.history) || [];
  const artboards = useStore((state) => state.artboards) || [];
  const activeArtboardId = useStore((state) => state.activeArtboardId);
  const activeArtboard = artboards.find((a) => a.id === activeArtboardId) || artboards[0];
  const layers = activeArtboard ? activeArtboard.layers : [];
  const canvasSize = useStore((state) => state.canvasSize) || { width: 1080, height: 1080, name: 'Square' };
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';
  const canvasFilters = useStore((state) => state.canvasFilters);
  const addLayers = useStore((state) => state.addLayers);
  const setCanvasFilters = useStore((state) => state.setCanvasFilters);
  const setIsExporting = useStore((state) => state.setIsExporting);
  const addToast = useStore((state) => state.addToast);

  const activeImage = history.length > 0 ? history[history.length - 1] || null : null;
  const uploadedImage = uploads.length > 0 ? uploads[uploads.length - 1] || null : null;

  const handleFileUploads = async (files: File[]) => {
    const { compressImage } = await import('../utils/imageOptimizer');
    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        if (!file.type.startsWith('image/')) return file;
        const blob = await compressImage(file, 1920, 0.8);
        return new File([blob], file.name, { type: blob.type });
      })
    );

    const readers: Promise<string>[] = compressedFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then(async (urls: string[]) => {
      const validUrls = urls.filter((u) => u);
      if (validUrls.length > 0) {
        // Local-First: Cache assets in IndexedDB
        const cachedUrls = await Promise.all(validUrls.map((url) => storageService.cacheAsset(url)));

        addLayers(
          cachedUrls.map(
            (url: string, idx: number) =>
              ({
                id: generateLayerId('image'),
                type: 'image',
                name: `Image ${idx + 1}`,
                src: url,
                x: canvasSize.width / 2 - 100 + idx * 20,
                y: canvasSize.height / 2 - 100 + idx * 20,
                width: 200,
                height: 200,
                rotation: 0,
                opacity: 1,
                locked: false,
                visible: true,
                filters: { ...canvasFilters },
                blendMode: 'normal',
                skewX: 0,
                skewY: 0,
                perspective: 0,
                rotateX: 0,
                rotateY: 0,
              }) as ImageLayer
          )
        );

        // Also add the files to the uploads list so they appear in the UI
        const handleFileUpload = useStore.getState().handleFileUpload;
        if (handleFileUpload) {
          handleFileUpload(compressedFiles);
        }

        if (setCanvasFilters) {
          setCanvasFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            opacity: 1,
            vignette: 0,
            hueRotate: 0,
          });
        }
      }
    });
  };

  const handleExportDataUrl = async (): Promise<string> => {
    const store = useStore.getState();
    const artboards = store.artboards || [];
    const activeArtboard = artboards.find((a: any) => a.id === store.activeArtboardId) || artboards[0];
    const layers = activeArtboard ? activeArtboard.layers || [] : [];
    const canvasSize = store.canvasSize || { width: 1080, height: 1080 };
    const canvasBackgroundColor = store.canvasBackgroundColor || '#ffffff';
    const canvasFilters = store.canvasFilters;
    const history = store.history || [];
    const uploads = store.uploads || [];
    const activeImage = history.length > 0 ? history[history.length - 1] || null : null;
    const uploadedImage = uploads.length > 0 ? uploads[uploads.length - 1] || null : null;
    const backgroundImageUrl = activeImage?.url || uploadedImage || null;

    return await exportService.exportDesignToImage(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      layers,
      canvasFilters
    );
  };

  const handleExportBlob = async (): Promise<Blob | null> => {
    const store = useStore.getState();
    const artboards = store.artboards || [];
    const activeArtboard = artboards.find((a: any) => a.id === store.activeArtboardId) || artboards[0];
    const layers = activeArtboard ? activeArtboard.layers || [] : [];
    const canvasSize = store.canvasSize || { width: 1080, height: 1080 };
    const canvasBackgroundColor = store.canvasBackgroundColor || '#ffffff';
    const canvasFilters = store.canvasFilters;
    const history = store.history || [];
    const uploads = store.uploads || [];
    const activeImage = history.length > 0 ? history[history.length - 1] || null : null;
    const uploadedImage = uploads.length > 0 ? uploads[uploads.length - 1] || null : null;
    const backgroundImageUrl = activeImage?.url || uploadedImage || null;

    return await exportService.exportDesignToBlob(
      canvasSize.width,
      canvasSize.height,
      canvasBackgroundColor,
      backgroundImageUrl,
      layers,
      canvasFilters
    );
  };

  const handleConfirmExport = async (options: ExportOptions) => {
    const { format, quality, size, transparentBg, customFilename, onComplete, overrideLayers, printOptions } = options;

    setIsExporting(true);
    try {
      const store = useStore.getState();
      const exportWidth = size?.width || canvasSize.width;
      const exportHeight = size?.height || canvasSize.height;
      const fileName = customFilename ? customFilename : `design-${Date.now()}`;
      const scaleX = exportWidth / canvasSize.width;
      const scaleY = exportHeight / canvasSize.height;

      const activeArtboard = store.artboards.find((a: any) => a.id === store.activeArtboardId) || store.artboards[0];
      const targetLayers = overrideLayers || (activeArtboard ? activeArtboard.layers || [] : []);
      const scaledLayers = targetLayers.map((l) => ({
        ...l,
        x: l.x * scaleX,
        y: l.y * scaleY,
        width: l.width * scaleX,
        height: (l as any).height
          ? (l as any).height * scaleY
          : l.type === 'text'
            ? (l as any).fontSize * 1.2
            : l.width * scaleX,
        ...(l.type === 'text' ? { fontSize: (l as any).fontSize * scaleY } : {}),
      })) as any[];

      const bgColor = transparentBg && format === 'png' ? 'transparent' : canvasBackgroundColor;

      if (format === 'psd') {
        await exportService.exportToLayeredPSD(exportWidth, exportHeight, scaledLayers, fileName);
      } else if (format === 'pdf' && printOptions) {
        // High-end Print Export
        const imgDataUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          bgColor,
          activeImage?.url || uploadedImage || null,
          scaledLayers,
          canvasFilters,
          'png',
          1
        );
        await exportService.exportToPrintPDF(exportWidth, exportHeight, imgDataUrl, fileName, printOptions);
      } else if (format === 'svg') {
        const svgString = await exportService.exportToSVG(exportWidth, exportHeight, bgColor, scaledLayers);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        exportService.downloadBlob(blob, `${fileName}.svg`);
      } else {
        const imgFormat = format === 'pdf' ? 'png' : format;
        const downloadUrl = await exportService.exportDesignToImage(
          exportWidth,
          exportHeight,
          bgColor,
          activeImage?.url || uploadedImage || null,
          scaledLayers,
          canvasFilters,
          imgFormat,
          quality
        );

        if (format === 'pdf') {
          // Legacy/Fallback PDF
          await exportService.exportToPrintPDF(exportWidth, exportHeight, downloadUrl, fileName, {
            colorProfile: 'sRGB',
            bleed: 0,
            cropMarks: false,
          });
        } else {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${fileName}.${format}`;
          link.click();
        }
      }

      if (onComplete) {
        onComplete();
      }
      haptics.success();
    } catch (error) {
      log.error('[FileHandler] Export failed', error, { format, quality });
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Export failed: ${msg}. Try a different format or smaller canvas.`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    handleFileUploads,
    handleExportDataUrl,
    handleExportBlob,
    handleConfirmExport,
    uploadedImage,
  };
};
