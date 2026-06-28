import type { NextApiRequest, NextApiResponse } from 'next';
import { log } from '../../utils/log';

/**
 * AI Inpainting endpoint for 3D rotation auto-fill.
 * Takes an image + mask + prompt, returns the filled image.
 *
 * Uses Gemini's image editing capabilities for inpainting.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mask, prompt } = req.body;

  if (!image || !mask) {
    return res.status(400).json({ error: 'Image and mask are required' });
  }

  try {
    // Use Gemini for inpainting via the existing API proxy
    const geminiResponse = await fetch(`${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'editImage',
        image: image,
        prompt:
          prompt ||
          'Fill in the transparent areas to match the surrounding image context. Make it look natural and continuous.',
        mask: mask,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      log.error('[Inpaint API] Gemini request failed', new Error(errorText), { status: geminiResponse.status });
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const result = await geminiResponse.json();
    return res.status(200).json(result);
  } catch (error: any) {
    log.error('[Inpaint API] Error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
