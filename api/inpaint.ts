import { log } from '../utils/log';
import { requireAuth } from './_auth';
import { noStoreHeaders } from '../utils/cacheHeaders';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const origin =
    process.env.VITE_FRONTEND_URL ||
    req.headers?.get?.('origin') ||
    req.headers?.origin ||
    req.headers?.['origin'] ||
    '*';

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }

  const { image, mask, prompt } = body;
  if (!image || !mask) {
    return new Response(JSON.stringify({ error: 'Image and mask are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }

  try {
    // Forward inpainting to Fal.ai via our existing fal proxy
    const falRes = await fetch(`${origin}/api/fal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        endpoint: 'fal-ai/fast-sdxl/inpainting',
        input: {
          image_url: image,
          mask_url: mask,
          prompt: prompt || 'Fill in the transparent areas to match the surrounding image context.',
          num_inference_steps: 25,
        },
      }),
    });

    if (!falRes.ok) {
      const errorText = await falRes.text();
      log.error('[Inpaint] Fal inpainting failed', new Error(errorText), { status: falRes.status });
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    }

    const result = await falRes.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, ...noStoreHeaders() },
    });
  } catch (error: any) {
    log.error('[Inpaint] Error', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }
}
