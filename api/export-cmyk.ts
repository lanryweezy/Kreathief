import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageUrl, bleed = 0 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // 1. Fetch the high-res RGB image from the provided URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 2. Convert to CMYK using Sharp
    // We convert it to a CMYK JPEG, which is natively supported by pdf-lib
    const cmykJpegBuffer = await sharp(imageBuffer)
      .toColorspace('cmyk')
      .jpeg({ quality: 100 })
      .toBuffer();

    // Get dimensions of the processed image
    const metadata = await sharp(cmykJpegBuffer).metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1080;

    // 3. Create Print-Ready PDF
    const pdfDoc = await PDFDocument.create();
    
    // Set PDF/X-compliant metadata to indicate CMYK intent
    pdfDoc.setTitle('Kreathief Print Export');
    pdfDoc.setAuthor('Kreathief');
    pdfDoc.setCreator('Kreathief Print Engine');
    
    // Embed the CMYK JPEG
    const image = await pdfDoc.embedJpg(cmykJpegBuffer);
    
    // Create page matching image dimensions
    const page = pdfDoc.addPage([width, height]);
    
    // Draw the CMYK image
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    // 4. Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Send back the PDF as a binary response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="print-ready-cmyk.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.status(200).send(pdfBuffer);
    
  } catch (error: any) {
    console.error('CMYK Conversion Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
