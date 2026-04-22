import { jsPDF } from 'jspdf';

self.onmessage = async (e: MessageEvent) => {
  const { width, height, imgDataUrl, fileName, options = {} } = e.data;
  const {
    bleed = 0,
    cropMarks = false,
    colorProfile = 'sRGB',
    quality = 'print'
  } = options;

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

    // Add main image with bleed offset
    pdf.addImage(imgDataUrl, 'PNG', bleed, bleed, width, height);

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
      pdf.line(effectiveWidth - bleed + 2, effectiveHeight - bleed, effectiveWidth - bleed + markLength, effectiveHeight - bleed);
      pdf.line(effectiveWidth - bleed, effectiveHeight - bleed + 2, effectiveWidth - bleed, effectiveHeight - bleed + markLength);
    }

    // Embed XMP Metadata for CMYK compliance (Simulation)
    const timestamp = new Date().toISOString();
    const xmp = `
<?xpacket begin="?" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfx="http://ns.adobe.com/pdfx/1.3/">
   <pdfx:ColorProfile>${colorProfile}</pdfx:ColorProfile>
   <pdfx:Quality>${quality}</pdfx:Quality>
   <pdfx:CreationDate>${timestamp}</pdfx:Quality>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`.trim();

    // @ts-ignore - addMetadata is not always present in jsPDF types
    if (pdf.addMetadata) {
      // @ts-ignore - xmp metadata is valid but types may vary
      pdf.addMetadata(xmp, 'application/rdf+xml');
    }

    const blob = pdf.output('blob');
    self.postMessage({ type: 'SUCCESS', payload: blob, fileName });
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};
