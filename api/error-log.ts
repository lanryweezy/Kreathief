import { log } from '../utils/log';
import { cacheHeaders, noStoreHeaders } from '../utils/cacheHeaders';

export const config = {
  runtime: 'edge',
};

// Simple API key for client-side error reporting
const ERROR_LOG_KEY = process.env.ERROR_LOG_KEY;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

export default async function handler(req: Request) {
  const origin = process.env.VITE_FRONTEND_URL || req.headers.get('origin') || '*';

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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    });
  }

  // API key validation for client-side error reporting
  const apiKey = req.headers.get('X-API-Key');
  if (ERROR_LOG_KEY && apiKey !== ERROR_LOG_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
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
    const bodyText = await req.text();
    if (bodyText.length > 10000) {
      return new Response(JSON.stringify({ error: 'Body too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      });
    }
    payload = JSON.parse(bodyText);
    // Sanitize: only allow known fields
    const allowed = {
      message: String(payload.message || '').slice(0, 500),
      filename: String(payload.filename || '').slice(0, 200),
      lineno: Number(payload.lineno) || 0,
    };
    payload = allowed;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  try {
    log.error('[Client Error via Beacon]', new Error(payload.message || 'Unknown error'), payload);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...noStoreHeaders(),
      },
    });
  } catch (error: any) {
    log.error('API Route Error', error, { url: req.url });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
