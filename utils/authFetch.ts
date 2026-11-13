/**
 * authFetch - fetch wrapper that attaches the Supabase access token to /api/* calls.
 *
 * The serverless proxies (api/openrouter, api/fal, api/freepik, ...) call requireAuth(),
 * which in production only accepts `Authorization: Bearer <jwt>` or an `sb-*-auth-token`
 * cookie. Supabase JS keeps the session in localStorage, so without this wrapper every
 * AI call is rejected with 401 and silently degrades to a procedural fallback.
 *
 * Fails soft: if there is no session (or the lookup stalls), the request is sent as-is so
 * dev/QA-bypass environments and unauthenticated flows keep working unchanged.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { log } from './log';

const SESSION_LOOKUP_TIMEOUT_MS = 1500;

/** Returns the current access token, or null when signed out / unavailable. */
export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const lookup = supabase.auth.getSession().then(({ data }) => data?.session?.access_token ?? null);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_LOOKUP_TIMEOUT_MS));
    return await Promise.race([lookup, timeout]);
  } catch (err) {
    log.warn('[authFetch] Session lookup failed; sending request unauthenticated', err);
    return null;
  }
}

/** Merges an Authorization header into arbitrary HeadersInit without clobbering a caller-set one. */
export function withAuthHeader(headers: HeadersInit | undefined, token: string | null): Headers {
  const merged = new Headers(headers || {});
  if (token && !merged.has('Authorization')) {
    merged.set('Authorization', `Bearer ${token}`);
  }
  return merged;
}

function syncServerCreditsHeader(response: Response): void {
  try {
    if (!response?.headers || typeof response.headers.get !== 'function') {
      return;
    }
    const raw = response.headers.get('X-Credits-Remaining');
    if (raw === null) {
      return;
    }
    const remaining = parseInt(raw, 10);
    if (!Number.isFinite(remaining) || remaining < 0) {
      return;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('kreathief_credits', String(remaining));
    }
  } catch {
    // Non-fatal: header sync is best-effort
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = !token
    ? await fetch(input, init)
    : await fetch(input, { ...init, headers: withAuthHeader(init.headers, token) });
  syncServerCreditsHeader(response);
  return response;
}
