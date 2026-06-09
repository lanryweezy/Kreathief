export const config = {
  runtime: 'edge',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const rateLimitState = rateLimitMap.get(clientIp);

  if (rateLimitState) {
    if (now > rateLimitState.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (rateLimitState.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      rateLimitState.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  const accessKey = process.env.VITE_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return new Response(JSON.stringify({ error: 'Unsplash credentials not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const BASE_URL = 'https://api.unsplash.com';

    if (action === 'search') {
      const query = url.searchParams.get('query') || '';
      const page = url.searchParams.get('page') || '1';

      const response = await fetch(
        `${BASE_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Unsplash Search failed');
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
