import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { log } from '../utils/log';
import { z } from 'zod';
import { noStoreHeaders } from '../utils/cacheHeaders';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

// Schema validation for request body
const ExportCmykSchema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
  bleed: z.number().min(0).max(500).default(0),
});

export default async function handler(req: any, res: any) {
  const now = Date.now();

  // Periodic cleanup of expired rate limit entries to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [ip, state] of rateLimitMap.entries()) {
      if (now > state.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
    lastCleanup = now;
  }
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_FRONTEND_URL || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || 'unknown';
  const rateLimitState = rateLimitMap.get(clientIp);

  if (rateLimitState) {
    if (now > rateLimitState.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (rateLimitState.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      rateLimitState.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  try {
    // Validate request body
    const parsed = ExportCmykSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues[0].message });
    }

    const { imageUrl, bleed } = parsed.data;

    // SSRF Protection: Validate URL before fetching
    try {
      const url = new URL(imageUrl);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return res.status(400).json({ error: 'Invalid URL protocol' });
      }

      const hostname = url.hostname.toLowerCase();

      // Basic blocklist for local/internal IPs to prevent simple SSRF.
      // Note: A robust solution would resolve the DNS and check the IP before fetching,
      // but this basic check covers simple bypasses for this specific endpoint.
      if (
        hostname === 'localhost' ||
        hostname.includes('127.0.0.1') ||
        hostname.startsWith('127.') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        hostname.startsWith('192.168.') ||
        hostname.endsWith('.internal') ||
        hostname === '[::1]' ||
        hostname === '::1' ||
        // Octal/Hex encoding bypasses for 127.0.0.1
        hostname === '0177.0.0.1' ||
        hostname === '0x7f.0.0.1' ||
        hostname === '2130706433' ||
        hostname === '0x7f000001' ||
        hostname === '017700000001'
      ) {
        return res.status(400).json({ error: 'Invalid image URL (internal/reserved IP)' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid image URL format' });
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
    const cmykJpegBuffer = await sharp(imageBuffer).toColorspace('cmyk').jpeg({ quality: 100 }).toBuffer();

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

    // Create page matching image dimensions + bleed
    const page = pdfDoc.addPage([width + bleed * 2, height + bleed * 2]);

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
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    log.error('CMYK Conversion Error', error, { body: req.body });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
