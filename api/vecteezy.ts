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

  const accountId = process.env.VITE_VECTEEZY_ACCOUNT_ID;
  const secretKey = process.env.VITE_VECTEEZY_SECRET_KEY;

  if (!accountId || !secretKey) {
    return new Response(JSON.stringify({ error: 'Vecteezy API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const VECTEEZY_API_URL = 'https://api.vecteezy.com/v2';

    if (action === 'search') {
      const query = url.searchParams.get('query') || '';
      const page = url.searchParams.get('page') || '1';

      const response = await fetch(
        `${VECTEEZY_API_URL}/${accountId}/resources?search_term=${encodeURIComponent(query)}&page=${page}&per_page=20`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Vecteezy Search failed');
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } else if (action === 'download') {
      const resourceId = url.searchParams.get('resourceId');
      if (!resourceId) {
        return new Response(JSON.stringify({ error: 'resourceId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const response = await fetch(
        `${VECTEEZY_API_URL}/${accountId}/resources/${resourceId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Vecteezy Download failed');
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
