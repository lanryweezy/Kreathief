/**
 * api/logo-search proxy tests.
 *
 * The proxy exists so the Logo.dev secret key (sk_...) stays server-side. These tests pin the
 * contract that matters: the key is sent upstream as a Bearer token, never echoed to the browser,
 * and missing config / upstream failures surface as clean status codes instead of silent empties.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/logo-search';

const SECRET = 'sk_test_secret_value';
const call = (qs = '') => handler(new Request(`https://www.kreathief.com/api/logo-search${qs}`));

describe('api/logo-search', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('LOGO_DEV_SECRET_KEY', SECRET);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns 503 when the secret key is not configured', async () => {
    vi.stubEnv('LOGO_DEV_SECRET_KEY', '');
    expect((await call('?q=stripe')).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty list without calling upstream when the query is blank', async () => {
    const res = await call('?q=%20%20');
    expect(await res.json()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('authenticates upstream with the secret and never leaks it in the response', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ domain: 'stripe.com' }]), { status: 200 }));
    const res = await call('?q=str%20ipe');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.logo.dev/search?q=str%20ipe');
    expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
    expect(await res.text()).not.toContain(SECRET);
  });

  it('passes through the upstream status when Logo.dev rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 429 }));
    expect((await call('?q=stripe')).status).toBe(429);
  });

  it('returns 500 when the upstream request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    expect((await call('?q=stripe')).status).toBe(500);
  });
});
