import { log } from '../utils/log';
import { cacheHeaders, noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';


export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
  }

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

  try {
    await requireAuth(req);
  } catch (response) {
    return response as Response;
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...noStoreHeaders(),
      },
    });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitState = rateLimitMap.get(clientIp);

  if (rateLimitState) {
    if (now > rateLimitState.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (rateLimitState.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }
      rateLimitState.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  const { endpoint, body } = payload;
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FAL API key not configured on server' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  const allowedEndpoints = [
    // FLUX
    'https://fal.run/fal-ai/flux/dev',
    'https://fal.run/fal-ai/flux/schnell',
    'https://fal.run/fal-ai/flux-pro',
    'https://fal.run/fal-ai/flux-2-pro',
    // Google Nano Banana
    'https://fal.run/fal-ai/nano-banana',
    'https://fal.run/fal-ai/nano-banana-2',
    'https://fal.run/fal-ai/nano-banana-pro',
    // Chinese models
    'https://fal.run/fal-ai/bytedance/seedream/v5/lite/text-to-image',
    'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image',
    'https://fal.run/fal-ai/qwen-image',
    'https://fal.run/fal-ai/ideogram/v3',
    'https://fal.run/fal-ai/ideogram/v4',
    // OpenAI
    'https://fal.run/fal-ai/openai/gpt-image-2',
    // Recraft
    'https://fal.run/fal-ai/recraft-v3/vector',
    'https://fal.run/fal-ai/recraft/v4/pro/text-to-image',
    // SDXL + utilities
    'https://fal.run/fal-ai/sdxl/inpainting',
    'https://fal.run/fal-ai/fast-sdxl',
    'https://fal.run/fal-ai/aura-sr',
  ];

  if (!allowedEndpoints.includes(endpoint)) {
    return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Fal.ai API ${response.status}: ${errText.slice(0, 200)}`);
    }
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...noStoreHeaders(),
      },
    });
  } catch (error: any) {
    log.error('API Route Error', error, { endpoint: payload?.endpoint });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
