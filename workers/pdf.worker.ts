import { jsPDF } from 'jspdf';
import { resolveTextLines } from '../utils/textRendering';
import { log } from '../utils/log';

// Helper to convert ArrayBuffer to Base64 (since btoa requires strings)
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert HEX string to CMYK floats [0-1]
function hexToCmyk(hex: string): [number, number, number, number] {
  let r = 0,
    g = 0,
    b = 0;
  let h = hex.replace('#', '');
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length >= 6) {
    r = parseInt(h.substring(0, 2), 16);
    g = parseInt(h.substring(2, 4), 16);
    b = parseInt(h.substring(4, 6), 16);
  }
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);
  if (k === 1) return [0, 0, 0, 1];
  return [(c - k) / (1 - k), (m - k) / (1 - k), (y - k) / (1 - k), k];
}

// Fetch TTF font. We use a trick to get TTF from Google Fonts CSS API v1
async function fetchFont(fontFamily: string): Promise<string | null> {
  try {
    const encodedFamily = fontFamily.replace(/ /g, '+');
    // Using unpkg or google fonts. For safety, try to load from a raw GitHub repo or use default.
    // In a real production app, we would have a dedicated TTF endpoint or use pdf-lib with fontkit.
    // We'll try to fetch CSS without WOFF2 support header if possible, but fetch() forbids modifying User-Agent.
    // Instead, we just use standard fonts if we can't reliably get TTF.
    return null;
  } catch (e) {
    return null;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { width, height, layers, fileName, options = {} } = e.data;
  const { bleed = 0, cropMarks = false, colorProfile = 'sRGB', quality = 'print' } = options;

  try {
    const effectiveWidth = width + bleed * 2;
    const effectiveHeight = height + bleed * 2;
    const orientation = effectiveWidth > effectiveHeight ? 'landscape' : 'portrait';

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: [effectiveWidth, effectiveHeight],
    });

    // Add print-ready metadata
    pdf.setProperties({
      title: fileName,
      creator: 'Kreathief Pro Engine',
    });

    const cx = effectiveWidth / 2;
    const cy = effectiveHeight / 2;

    const isCmyk =
      options.colorProfile === 'CMYK' || options.colorProfile === 'FOGRA39' || options.colorProfile === 'SWOP';

    const applyColor = (pdfInstance: any, hexColor: string, type: 'fill' | 'text' | 'draw') => {
      if (isCmyk) {
        const [c, m, y, k] = hexToCmyk(hexColor);
        if (type === 'fill') pdfInstance.setFillColor(c, m, y, k);
        else if (type === 'text') pdfInstance.setTextColor(c, m, y, k);
        else if (type === 'draw') pdfInstance.setDrawColor(c, m, y, k);
      } else {
        if (type === 'fill') pdfInstance.setFillColor(hexColor);
        else if (type === 'text') pdfInstance.setTextColor(hexColor);
        else if (type === 'draw') pdfInstance.setDrawColor(hexColor);
      }
    };

    // Render layers
    for (const layer of layers) {
      // Calculate absolute position based on center origin (assuming layers are center-origin mapped)
      const x = cx + layer.x;
      const y = cy + layer.y;

      if (layer.type === 'shape') {
        const fill = layer.color || '#000000';
        applyColor(pdf, fill, 'fill');

        if (layer.stroke && layer.stroke.width > 0) {
          applyColor(pdf, layer.stroke.color || '#000000', 'draw');
          pdf.setLineWidth(layer.stroke.width);
        } else {
          pdf.setLineWidth(0);
        }

        const style = layer.stroke && layer.stroke.width > 0 ? 'DF' : 'F';

        if (layer.shapeType === 'rectangle' || layer.shapeType === undefined) {
          pdf.rect(x - layer.width / 2, y - layer.height / 2, layer.width, layer.height, style);
        } else if (layer.shapeType === 'circle') {
          pdf.circle(x, y, layer.width / 2, style);
        } else if (layer.shapeType === 'path' && layer.pathData) {
          // Robust MVP vector
          if (!layer.stroke || layer.stroke.width === 0) {
            applyColor(pdf, fill, 'draw');
          }
          pdf.rect(x - layer.width / 2, y - layer.height / 2, layer.width, layer.height, style);
        }
      } else if (layer.type === 'text') {
        const fill = layer.color || '#000000';
        const fontSize = layer.fontSize || 16;

        applyColor(pdf, fill, 'text');
        pdf.setFontSize(fontSize);

        // Split text by resolving wrap
        const lines = resolveTextLines(layer);
        let currentY = y - (layer.height || fontSize) / 2 + fontSize; // Approximate baseline

        for (const line of lines) {
          // Align center
          const textWidth = pdf.getStringUnitWidth(line) * fontSize;
          const lineX = x - textWidth / 2;

          pdf.text(line, lineX, currentY);
          currentY += fontSize * (layer.lineHeight || 1.2);
        }
      } else if (layer.type === 'image') {
        if (layer.src) {
          try {
            // Determine format
            const format = layer.src.includes('jpeg') || layer.src.includes('jpg') ? 'JPEG' : 'PNG';
            pdf.addImage(layer.src, format, x - layer.width / 2, y - layer.height / 2, layer.width, layer.height);
          } catch (imgErr) {
            log.error('Failed to embed image layer', imgErr);
          }
        }
      }
    }

    // Render Crop Marks
    if (cropMarks && bleed > 0) {
      const markLength = 18;
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(0, 0, 0);

      // Top-Left
      pdf.line(bleed - markLength, bleed, bleed - 2, bleed);
      pdf.line(bleed, bleed - markLength, bleed, bleed - 2);

      // Top-Right
      pdf.line(effectiveWidth - bleed + 2, bleed, effectiveWidth - bleed + markLength, bleed);
      pdf.line(effectiveWidth - bleed, bleed - markLength, effectiveWidth - bleed, bleed - 2);

      // Bottom-Left
      pdf.line(bleed - markLength, effectiveHeight - bleed, bleed - 2, effectiveHeight - bleed);
      pdf.line(bleed, effectiveHeight - bleed + 2, bleed, effectiveHeight - bleed + markLength);

      // Bottom-Right
      pdf.line(
        effectiveWidth - bleed + 2,
        effectiveHeight - bleed,
        effectiveWidth - bleed + markLength,
        effectiveHeight - bleed
      );
      pdf.line(
        effectiveWidth - bleed,
        effectiveHeight - bleed + 2,
        effectiveWidth - bleed,
        effectiveHeight - bleed + markLength
      );
    }

    // Embed XMP Metadata
    const timestamp = new Date().toISOString();
    const xmp = `
<?xpacket begin="?" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/">
   <pdfx:ColorProfile>${colorProfile}</pdfx:ColorProfile>
   <pdfx:Quality>${quality}</pdfx:Quality>
   <pdfx:CreationDate>${timestamp}</pdfx:CreationDate>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`.trim();

    // @ts-ignore - jspdf types don't include addMetadata but the method exists in the build
    if (pdf.addMetadata) {
      // @ts-ignore - jspdf types don't include addMetadata but the method exists in the build
      pdf.addMetadata(xmp, 'application/rdf+xml');
    }

    const blob = pdf.output('blob');
    self.postMessage({ type: 'SUCCESS', payload: blob, fileName });
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};
