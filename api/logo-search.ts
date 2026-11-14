import { log } from '../utils/log';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const origin =
    process.env.VITE_FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.kreathief.com');

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secretKey = process.env.LOGO_DEV_SECRET_KEY;
  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'Logo.dev secret key not configured' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim();
  if (!query) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  try {
    const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      log.warn('[api/logo-search] Logo.dev upstream error', { status: response.status });
      return new Response(JSON.stringify({ error: `Logo.dev upstream error (${response.status})` }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    log.error('[api/logo-search] Failed to query Logo.dev', err);
    return new Response(JSON.stringify({ error: 'Failed to search brands' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
