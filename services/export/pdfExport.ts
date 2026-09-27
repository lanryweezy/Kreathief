import {
  exportToPrintPDF,
  PDFExportOptions,
} from '../exportService';
import {
  exportArtboardToNativePdf,
  exportToNativePdf,
  NativePdfOptions,
} from '../nativePdfService';

export {
  exportToPrintPDF,
  exportArtboardToNativePdf,
  exportToNativePdf,
};
export type { PDFExportOptions, NativePdfOptions };

/**
 * Unified PDF export entrypoint supporting both print-ready CMYK PDF and vector native PDF.
 */
export async function exportPdf(
  artboardsOrLayers: any[],
  options: {
    native?: boolean;
    width?: number;
    height?: number;
    fileName?: string;
    backgroundColor?: string;
    printOptions?: PDFExportOptions;
  } = {}
): Promise<void> {
  const fileName = options.fileName || 'design';
  if (options.native) {
    await exportToNativePdf(
      artboardsOrLayers,
      fileName,
      options.backgroundColor || '#ffffff',
      { isPro: true }
    );
  } else {
    const w = options.width || 1080;
    const h = options.height || 1080;
    await exportToPrintPDF(w, h, artboardsOrLayers, fileName, options.printOptions);
  }
}
