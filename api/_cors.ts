/**
 * Shared CORS and origin resolution helper for Vercel serverless/edge functions.
 */

export function getOrigin(req?: Request | any): string {
  if (process.env.VITE_FRONTEND_URL) {
    return process.env.VITE_FRONTEND_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (req) {
    if (typeof req.headers?.get === 'function') {
      return req.headers.get('origin') || '*';
    }
    if (req.headers && req.headers['origin']) {
      return req.headers['origin'];
    }
  }
  return '*';
}

export function corsHeaders(origin: string, allowedMethods = 'GET, POST, OPTIONS'): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export function handleOptions(origin: string, allowedMethods = 'GET, POST, OPTIONS'): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(origin, allowedMethods),
  });
}
