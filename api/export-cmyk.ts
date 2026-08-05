import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { log } from '../utils/log';
import { z } from 'zod';
import { noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';
import dns from 'dns';

export const config = { runtime: 'nodejs' };

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
  const origin =
    process.env.VITE_FRONTEND_URL ||
    req.headers?.get?.('origin') ||
    req.headers?.origin ||
    req.headers?.['origin'] ||
    '*';

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
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await requireAuth({
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()],
      },
    } as unknown as Request);
  } catch (error) {
    if (error instanceof Response) {
      // In nodejs runtime, we can't just return a Response object from an Edge function.
      // We need to translate it back to a res.status().json()
      // But _auth.ts throws `new Response(JSON.stringify({ error: ... }), { status: ... })`
      return res.status(error.status || 401).json({ error: 'Authentication required' });
    }
    return res.status(500).json({ error: 'Internal server error during authentication' });
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

    // SSRF Protection: Validate URL and resolve DNS to prevent bypasses
    let safeFetchUrl = imageUrl;
    let originalHostname = '';

    try {
      const url = new URL(imageUrl);
      originalHostname = url.hostname;

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return res.status(400).json({ error: 'Invalid URL protocol' });
      }

      let hostname = url.hostname.toLowerCase();
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
      }

      const lookup = await dns.promises.lookup(hostname, { all: true });

      const isPrivateIp = (ip: string) => {
        if (!ip) {
          return true;
        }
        if (
          ip.startsWith('10.') ||
          ip.match(/^172\.(1[6-9]|2\d|3[0-1])\./) ||
          ip.startsWith('192.168.') ||
          ip.startsWith('127.') ||
          ip.startsWith('169.254.') ||
          ip === '0.0.0.0'
        ) {
          return true;
        }

        const ipv6Lower = ip.toLowerCase();
        // Handle various IPv6 loopback/unspecified representations
        if (
          ipv6Lower === '::1' ||
          ipv6Lower === '::' ||
          /^0*:0*:0*:0*:0*:0*:0*:1$/.test(ipv6Lower) ||
          /^0*:0*:0*:0*:0*:0*:0*:0$/.test(ipv6Lower) ||
          /^::0*:1$/.test(ipv6Lower) ||
          ipv6Lower.startsWith('fc00:') ||
          ipv6Lower.startsWith('fd00:') ||
          ipv6Lower.startsWith('fe80:')
        ) {
          return true;
        }
        if (ip.toLowerCase().startsWith('::ffff:')) {
          const ipv4Part = ip.substring(7);
          return isPrivateIp(ipv4Part);
        }
        return false;
      };

      for (const address of lookup) {
        if (isPrivateIp(address.address)) {
          return res.status(400).json({ error: 'Invalid image URL (internal/reserved IP)' });
        }
      }

      // Re-assign the URL's hostname to the validated target IP to prevent DNS rebinding attacks (TOCTOU).
      const targetIp = lookup[0].address;
      url.hostname = targetIp.includes(':') ? `[${targetIp}]` : targetIp;
      safeFetchUrl = url.toString();
    } catch (e: any) {
      log.error('[ExportCMYK] URL validation/DNS resolution failed', e);
      return res.status(400).json({ error: 'Invalid or unresolvable image URL' });
    }

    // 1. Fetch the high-res RGB image with timeout protection
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 30000);
    let imageResponse: Response;
    try {
      imageResponse = await fetch(safeFetchUrl, {
        signal: controller.signal,
        headers: {
          Host: originalHostname,
        },
      });
    } finally {
      clearTimeout(fetchTimeout);
    }
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

    // Draw the CMYK image centered within the bleed area
    page.drawImage(image, {
      x: bleed,
      y: bleed,
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
