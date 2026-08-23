import { Artboard, TextLayer, ImageLayer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { log } from './log';

// Dynamically load pdfjs to avoid node_modules blocking
const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const importPdfAsArtboards = async (file: File): Promise<Artboard[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdfjsLib = await loadPdfJs();
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const artboards: Artboard[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.0 });

          const artboard: Artboard = {
            id: uuidv4(),
            name: `Page ${pageNum}`,
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
            backgroundColor: '#ffffff',
            layers: [],
          };

          // Render full page to canvas to preserve images, vectors, and layout exactly
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const bgDataUrl = canvas.toDataURL('image/png');

            const bgLayer: ImageLayer = {
              id: uuidv4(),
              type: 'image',
              name: 'Original PDF (Visual Reference)',
              src: bgDataUrl,
              x: 0,
              y: 0,
              width: viewport.width,
              height: viewport.height,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: true, // Lock it so they don't accidentally move it
              cornerRadius: 0,
              blendMode: 'normal',
              flipX: false,
              flipY: false,
            };
            artboard.layers.push(bgLayer);
          }

          // Extract actual editable text content on top
          const textContent = await page.getTextContent();

          for (const item of textContent.items as any[]) {
            if (item.str.trim().length === 0) {
              continue;
            }

            const textLayer: TextLayer = {
              id: uuidv4(),
              type: 'text',
              name: item.str.substring(0, 10),
              text: item.str,
              x: item.transform[4],
              y: viewport.height - item.transform[5] - (item.height || 20), // Convert to top-left origin
              width: item.width || 100,
              height: item.height || 20,
              rotation: 0,
              opacity: 1,
              visible: true,
              locked: false,

              fontSize: item.transform[0] || 16,
              fontFamily: item.fontName || 'Inter',
              fontWeight: '400',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#000000', // Basic fallback
              textAlign: 'left',
              letterSpacing: 0,
              lineHeight: 1.2,
              textTransform: 'none',
              blendMode: 'normal',
            };

            artboard.layers.push(textLayer);
          }

          artboards.push(artboard);
        }

        resolve(artboards);
      } catch (err) {
        log.error('PDF parsing error:', err);
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
