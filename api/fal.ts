import { log } from '../utils/log';
import { cacheHeaders, noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';
import { checkAndDeductCredits } from './_credits';

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

  let authUser: { id: string; email?: string; role?: string };
  try {
    authUser = await requireAuth(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
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
  const rateLimitKey = authUser?.id || clientIp;
  const rateLimitState = rateLimitMap.get(rateLimitKey);

  if (rateLimitState) {
    if (now > rateLimitState.resetTime) {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
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
    rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
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

  const { endpoint, body, mode, queueModel, requestId } = payload;
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

  // Async Queue API for long-running video generation jobs (Kling, Luma, MiniMax, Wan)
  const allowedQueueModels = [
    'fal-ai/kling-video/v2/master/text-to-video',
    'fal-ai/kling-video/v1.6/standard/text-to-video',
    'fal-ai/luma-dream-machine',
    'fal-ai/minimax/video-01',
    'fal-ai/wan-t2v',
  ];

  if (mode === 'queue_submit' || mode === 'queue_status' || mode === 'queue_result') {
    if (!queueModel || !allowedQueueModels.includes(queueModel)) {
      return new Response(JSON.stringify({ error: 'Queue model not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    }

    if (mode === 'queue_submit') {
      const creditCheck = await checkAndDeductCredits(authUser?.id, 5);
      if (!creditCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient AI credits for video generation (5 credits required).',
            remaining: creditCheck.remaining ?? 0,
          }),
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': origin,
              'X-Credits-Remaining': String(creditCheck.remaining ?? 0),
              ...noStoreHeaders(),
            },
          }
        );
      }

      const safeQueueBody: Record<string, unknown> = {};
      if (body && typeof body === 'object') {
        for (const key of ['prompt', 'negative_prompt', 'aspect_ratio', 'duration', 'image_url']) {
          if (key in body) safeQueueBody[key] = body[key];
        }
      }

      const submitRes = await fetch(`https://queue.fal.run/${queueModel}`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeQueueBody),
      });

      const submitData = await submitRes.json().catch(() => ({}));
      return new Response(JSON.stringify(submitData), {
        status: submitRes.ok ? 200 : submitRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...(creditCheck.remaining !== null ? { 'X-Credits-Remaining': String(creditCheck.remaining) } : {}),
          ...noStoreHeaders(),
        },
      });
    }

    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(requestId)) {
      return new Response(JSON.stringify({ error: 'Invalid requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    }

    const queueUrl =
      mode === 'queue_status'
        ? `https://queue.fal.run/${queueModel}/requests/${requestId}/status`
        : `https://queue.fal.run/${queueModel}/requests/${requestId}`;

    const pollRes = await fetch(queueUrl, {
      method: 'GET',
      headers: { Authorization: `Key ${apiKey}`, Accept: 'application/json' },
    });
    const pollData = await pollRes.json().catch(() => ({}));
    return new Response(JSON.stringify(pollData), {
      status: pollRes.ok ? 200 : pollRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...noStoreHeaders(),
      },
    });
  }

  const allowedEndpoints = [
    // FLUX
    'https://fal.run/fal-ai/flux/dev',
    'https://fal.run/fal-ai/flux/dev/image-to-image',
    'https://fal.run/fal-ai/flux/schnell',
    'https://fal.run/fal-ai/flux-pro',
    'https://fal.run/fal-ai/flux-pro/v1.1',
    'https://fal.run/fal-ai/flux-pro/v1.1-ultra',
    'https://fal.run/fal-ai/flux-2-pro',
    // Google Nano Banana
    'https://fal.run/fal-ai/nano-banana',
    'https://fal.run/fal-ai/nano-banana/edit',
    'https://fal.run/fal-ai/nano-banana-2',
    'https://fal.run/fal-ai/nano-banana-2/edit',
    'https://fal.run/fal-ai/nano-banana-pro',
    'https://fal.run/fal-ai/nano-banana-pro/edit',
    // Chinese models
    'https://fal.run/fal-ai/bytedance/seedream/v5/lite/text-to-image',
    'https://fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image',
    'https://fal.run/fal-ai/bytedance/seedream/v4.5/edit',
    'https://fal.run/fal-ai/qwen-image',
    'https://fal.run/fal-ai/qwen-image-edit',
    'https://fal.run/fal-ai/qwen-image-2-1',
    'https://fal.run/fal-ai/qwen-image-2-1/edit',
    'https://fal.run/fal-ai/ideogram/v3',

    'https://fal.run/fal-ai/ideogram/v4',
    // OpenAI & Luma
    'https://fal.run/fal-ai/gpt-image-2',
    'https://fal.run/fal-ai/gpt-image-2-5',
    'https://fal.run/fal-ai/luma/photon',
    // Recraft
    'https://fal.run/fal-ai/recraft-v3/vector',
    'https://fal.run/fal-ai/recraft-v3/text-to-svg',
    'https://fal.run/fal-ai/recraft/v4/pro/text-to-image',
    // SDXL + utilities
    'https://fal.run/fal-ai/fast-sdxl/inpainting',
    'https://fal.run/fal-ai/fast-sdxl',
    'https://fal.run/fal-ai/aura-sr',
    'https://fal.run/fal-ai/esrgan',
    'https://fal.run/fal-ai/clarity-upscaler',
    'https://fal.run/fal-ai/ccsr',
    'https://fal.run/fal-ai/creative-upscaler',
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

  const creditCheck = await checkAndDeductCredits(authUser?.id, 1);
  if (!creditCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Insufficient AI generation credits. Please upgrade your plan or purchase a credit pack.',
        remaining: creditCheck.remaining ?? 0,
      }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'X-Credits-Remaining': String(creditCheck.remaining ?? 0),
          ...noStoreHeaders(),
        },
      }
    );
  }

  try {
    // Validate body — only allow safe fields to prevent SSRF via webhook_url
    const safeBody: any = {};
    if (body && typeof body === 'object') {
      const allowedFields = [
        'prompt',
        'image_url',
        // Array form required by the /edit routes (nano-banana, seedream). Media input
        // only — the allowlist exists to block webhook_url-style SSRF vectors, not images.
        'image_urls',
        'mask_url',
        'image',
        'image_size',
        // Sizing vocabulary of the Nano Banana family, which ignores image_size
        // (see ImageGenModel.sizeField). Stripping these would silently discard the
        // user's chosen aspect ratio.
        'aspect_ratio',
        'resolution',
        'num_images',
        'guidance_scale',
        'num_inference_steps',
        // How far an image-to-image result may drift from the reference.
        'strength',
        'width',
        'height',
        'seed',
        'style',
        'scale',
        'upscale_factor',
        'factor',
        'creativity',
        'resemblance',
        'detail',
        // Qwen-Image-2.1 transparent output format flag ("png" → RGBA channel active)
        'output_format',
      ];

      for (const key of Object.keys(body)) {
        if (allowedFields.includes(key)) {
          safeBody[key] = body[key];
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safeBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      // An upstream 4xx means our request shape was wrong for this model (typically the
      // wrong image field name), not an outage. Collapsing it into a 500 hid the reason and
      // made the client retry an error that can never succeed, so the status and Fal's
      // validation message are forwarded. Fal echoes back request-schema details only —
      // the API key is server-side and never appears in its response body.
      const isClientError = response.status >= 400 && response.status < 500;
      log.warn('Fal.ai rejected request', {
        endpoint,
        status: response.status,
        fields: Object.keys(safeBody).sort(),
        detail: errText.slice(0, 500),
      });

      return new Response(
        JSON.stringify({
          error: `Fal.ai API ${response.status}`,
          detail: errText.slice(0, 500),
        }),
        {
          status: isClientError ? response.status : 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...noStoreHeaders(),
          },
        }
      );
    }
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...(creditCheck.remaining !== null ? { 'X-Credits-Remaining': String(creditCheck.remaining) } : {}),
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
