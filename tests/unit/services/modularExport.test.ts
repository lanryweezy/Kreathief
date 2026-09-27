import { describe, it, expect, vi } from 'vitest';
import { cleanSvgMarkupProxy } from '../../../services/export/svgExport';
import { exportPdf } from '../../../services/export/pdfExport';
import * as exportService from '../../../services/exportService';
import * as nativePdfService from '../../../services/nativePdfService';

vi.mock('../../../services/exportService', async () => {
  const actual = await vi.importActual('../../../services/exportService');
  return {
    ...actual,
    exportToPrintPDF: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../services/nativePdfService', () => ({
  exportToNativePdf: vi.fn().mockResolvedValue(undefined),
  exportArtboardToNativePdf: vi.fn().mockResolvedValue(new Blob()),
}));

describe('Modular Export System (pdfExport & svgExport)', () => {
  it('cleanSvgMarkupProxy strips data attributes and cleans up markup', () => {
    const raw = '<svg data-testid="foo"><g></g><rect x="0" y="0" width="10" height="10"/></svg>';
    const cleaned = cleanSvgMarkupProxy(raw);
    expect(cleaned).not.toContain('data-testid');
    expect(cleaned).not.toContain('<g></g>');
  });

  it('exportPdf routes to print PDF when native is false', async () => {
    const layers = [{ id: '1', type: 'rect', x: 0, y: 0, width: 100, height: 100 }];
    await exportPdf(layers, { native: false, width: 500, height: 500, fileName: 'test-print' });
    expect(exportService.exportToPrintPDF).toHaveBeenCalledWith(
      500,
      500,
      layers,
      'test-print',
      undefined
    );
  });

  it('exportPdf routes to native vector PDF when native is true', async () => {
    const artboards = [{ id: 'ab1', name: 'Board', width: 800, height: 600, layers: [] }];
    await exportPdf(artboards, { native: true, fileName: 'test-native' });
    expect(nativePdfService.exportToNativePdf).toHaveBeenCalledWith(
      artboards,
      'test-native',
      '#ffffff',
      { isPro: true }
    );
  });
});
