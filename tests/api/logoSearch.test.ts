/**
 * api/logo-search proxy resilience and behavior tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/logo-search';

const SECRET = 'sk_test_secret_value';
const call = (qs = '') => handler(new Request(`https://www.kreathief.com/api/logo-search${qs}`));

describe('api/logo-search resilience', () => {
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

  it('authenticates upstream with the secret and passes the abort signal', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ domain: 'stripe.com' }]), { status: 200 }));
    const res = await call('?q=str%20ipe');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.logo.dev/search?q=str%20ipe');
    expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
    expect(init.signal).toBeDefined();
    expect(await res.text()).not.toContain(SECRET);
  });

  it('passes through the upstream status when Logo.dev rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));
    expect((await call('?q=stripe')).status).toBe(429);
  });

  it('returns 504 Gateway Timeout when upstream query times out or aborts', async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    fetchMock.mockRejectedValue(abortErr);

    const res = await call('?q=stripe');
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body).toEqual({ error: 'Logo search timed out' });
  });

  it('returns 500 when upstream request fails with a generic network error', async () => {
    fetchMock.mockRejectedValue(new Error('network socket hangup'));
    expect((await call('?q=stripe')).status).toBe(500);
  });
});
