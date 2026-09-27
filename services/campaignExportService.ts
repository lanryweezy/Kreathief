/**
 * Campaign Batch Export Service
 * Renders and packages multi-format campaign artboards into a structured ZIP archive
 * containing high-res assets for every social and digital channel along with campaign metadata.
 */

import JSZip from 'jszip';
import { Artboard } from '../types';
import { batchExportArtboardsZip, exportToSVG } from './exportService';
import { CampaignCopy, CampaignArchetypeTheme } from './campaignGeneratorService';
import { log } from '../utils/log';

export interface CampaignExportOptions {
  format?: 'png' | 'jpeg' | 'svg';
  quality?: number;
  scale?: number;
  includeManifest?: boolean;
}

/**
 * Triggers a browser file download for a given Blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Renders all campaign artboards and packages them into a ZIP archive with manifest.
 */
export async function exportCampaignToZip(
  artboards: Artboard[],
  campaignTitle: string,
  metadata?: {
    copy?: CampaignCopy;
    archetype?: CampaignArchetypeTheme;
  },
  options: CampaignExportOptions = {}
): Promise<Blob> {
  const zip = new JSZip();
  const format = options.format || 'png';
  const quality = options.quality || 0.95;

  log.info('[CampaignExport] Starting batch export of campaign artboards', {
    artboardCount: artboards.length,
    format,
  });

  // Render each artboard
  await Promise.all(
    artboards.map(async (artboard, idx) => {
      try {
        const safeName = (artboard.name || `Asset_${idx + 1}`)
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/_+/g, '_');

        if (format === 'svg') {
          const svgString = await exportToSVG(
            artboard.width,
            artboard.height,
            artboard.backgroundColor || '#090a15',
            artboard.layers as any[]
          );
          zip.file(`${idx + 1}_${safeName}.svg`, svgString);
        } else {
          // Render via batch export canvas helper
          const singleZip = await batchExportArtboardsZip([artboard], {
            format,
            quality,
          });
          const unzipped = await JSZip.loadAsync(singleZip);
          const firstFile = Object.values(unzipped.files)[0];
          if (firstFile) {
            const blob = await firstFile.async('blob');
            zip.file(`${idx + 1}_${safeName}.${format}`, blob);
          }
        }
      } catch (err) {
        log.warn(`[CampaignExport] Failed rendering artboard ${artboard.id}`, err);
      }
    })
  );

  // Add campaign manifest JSON
  if (options.includeManifest !== false) {
    const manifest = {
      campaignTitle,
      generatedAt: new Date().toISOString(),
      generator: 'Kreathief AI Creative Director v2.0',
      totalAssets: artboards.length,
      formats: artboards.map((a) => ({
        name: a.name,
        width: a.width,
        height: a.height,
        aspectRatio: `${a.width}:${a.height}`,
      })),
      copywriting: metadata?.copy || {},
      designTheme: metadata?.archetype || {},
    };

    zip.file('campaign-manifest.json', JSON.stringify(manifest, null, 2));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  log.info('[CampaignExport] Batch ZIP export completed successfully', {
    sizeBytes: zipBlob.size,
  });

  return zipBlob;
}
