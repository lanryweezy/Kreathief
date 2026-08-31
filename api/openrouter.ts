import { log } from '../utils/log';
import { noStoreHeaders } from '../utils/cacheHeaders';
import { requireAuth } from './_auth';

export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

// Periodic cleanup of expired rate limit entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);



export default async function handler(req: Request) {
  const origin =
    process.env.VITE_FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.headers.get('origin') || '*');


  try {
    await requireAuth(req);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
      headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
    });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Rate limiting
  const state = rateLimitMap.get(clientIp);
  if (state && now < state.resetTime && state.count >= MAX_REQUESTS_PER_WINDOW) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
    });
  }

  if (!state || now > state.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    state.count++;
  }

  try {
    const body = await req.json();
    const { model, messages, max_tokens = 4096 } = body;

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing required fields: model, messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
      });
    }

    const ALLOWED_MODELS = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o3',
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'meta-llama/llama-4-scout',
    ];

    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': origin,
        'X-Title': 'Kreathief',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        ...(body.response_format && { response_format: body.response_format }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('[OpenRouter API] Error', { status: response.status, error: errorText });
      return new Response(JSON.stringify({ error: `AI model error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
      });
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
    log.error('[OpenRouter API] Handler failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...noStoreHeaders() },
    });
  }
}
