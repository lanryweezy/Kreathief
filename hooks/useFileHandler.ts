import { useStore } from '../store/useStore';
import { ImageLayer } from '../types';
import * as exportService from '../services/exportService';
import * as psdService from '../services/psdService';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/log';
import { haptics } from '../utils/haptics';

export const useFileHandler = () => {
  const uploads = useStore((state) => state.uploads) || [];
  const history = useStore((state) => state.history) || [];
  const artboards = useStore((state) => state.artboards) || [];
  const layers = artboards.flatMap(a => a.layers);
  const canvasSize = useStore((state) => state.canvasSize) || { width: 1080, height: 1080, name: 'Square' };
  const canvasBackgroundColor = useStore((state) => state.canvasBackgroundColor) || '#ffffff';
  const canvasFilters = useStore((state) => state.canvasFilters);
  const addLayers = useStore((state) => state.addLayers);
  const setCanvasFilters = useStore((state) => state.setCanvasFilters);
  const setIsExporting = useStore((state) => state.setIsExporting);
  const addToast = useStore((state) => state.addToast);

  const activeImage = history.length > 0 ? history[history.length - 1] || null : null;
  const uploadedImage = uploads.length > 0 ? uploads[uploads.length - 1] || null : null;

  const handleFileUploads = (files: File[]) => {
    const readers: Promise<string>[] = files.map((file) => 
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      })
    );

    Promise.all(readers).then((urls) => {
      const validUrls = urls.filter((u) => u);
      if (validUrls.length > 0) {
        addLayers(validUrls.map(url => ({
          id: uuidv4(),
          type: 'image',
          name: 'Image',
          src: url,
          x: canvasSize.width / 2 - 100,
          y: canvasSize.height / 2 - 100,
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
        } as ImageLayer)));
        if (setCanvasFilters) {
          setCanvasFilters({
            brightness: 100, contrast: 100, saturation: 100,
            sepia: 0, grayscale: 0, blur: 0, opacity: 1, vignette: 0, hueRotate: 0
          });
        }
      }
    });
  };

  const handleExportDataUrl = async (): Promise<string> => {
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

  const handleConfirmExport = async (format: any, quality: any, size: any, transparentBg: any, customFilename: any, onComplete?: () => void) => {
    setIsExporting(true);
    try {
      const exportWidth = size?.width || canvasSize.width;
      const exportHeight = size?.height || canvasSize.height;
      const fileName = customFilename ? `${customFilename}.${format}` : `design-${Date.now()}.${format}`;
      const scaleX = exportWidth / canvasSize.width;
      const scaleY = exportHeight / canvasSize.height;
      
      const scaledLayers = layers.map(l => ({
        ...l,
        x: l.x * scaleX,
        y: l.y * scaleY,
        width: l.width * scaleX,
        height: (l as any).height ? (l as any).height * scaleY : l.width * scaleX,
        ...(l.type === 'text' ? { fontSize: (l as any).fontSize * scaleY } : {}),
      })) as any[];

      const bgColor = transparentBg && format === 'png' ? 'transparent' : canvasBackgroundColor;
      let downloadUrl = '';

      if (format === 'psd') {
        const psdBlob = await psdService.exportLayersToPsd(exportWidth, exportHeight, scaledLayers);
        downloadUrl = URL.createObjectURL(psdBlob);
      } else if (format === 'svg') {
        const svgString = await exportService.exportToSVG(exportWidth, exportHeight, bgColor, scaledLayers);
        downloadUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
      } else {
        downloadUrl = await exportService.exportDesignToImage(
          exportWidth, exportHeight, bgColor, activeImage?.url || uploadedImage || null, scaledLayers, canvasFilters, format, quality
        );
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      if (onComplete) {onComplete();}
      haptics.success();
    } catch (error) {
      log.error('[FileHandler] Export failed', error, { format, quality });
      addToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    handleFileUploads,
    handleExportDataUrl,
    handleExportBlob,
    handleConfirmExport,
    uploadedImage
  };
};
