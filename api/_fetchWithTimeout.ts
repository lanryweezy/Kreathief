import { noStoreHeaders } from '../utils/cacheHeaders';

export const DEFAULT_EDGE_FETCH_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_EDGE_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function timeoutResponse(origin: string, message = 'Upstream API timeout'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 504,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      ...noStoreHeaders(),
    },
  });
}
