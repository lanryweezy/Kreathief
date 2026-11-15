import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndDeductCredits } from '../../api/_credits';

describe('api/_credits checkAndDeductCredits', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('calls deduct_ai_credits RPC atomically with a single POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ allowed: true, remaining: 9, plan_id: 'pro' }],
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkAndDeductCredits('user-123', 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/deduct_ai_credits');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ p_user_id: 'user-123', p_cost: 1 });
    expect(result).toEqual({ allowed: true, remaining: 9, plan: 'pro' });
  });

  it('denies the request when the RPC reports insufficient credits', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ allowed: false, remaining: 2, plan_id: 'free' }],
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkAndDeductCredits('user-123', 5);

    expect(result).toEqual({ allowed: false, remaining: 2, plan: 'free' });
  });

  it('fails open when Supabase env vars are missing or RPC errors', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const missingEnvResult = await checkAndDeductCredits('user-123', 1);
    expect(missingEnvResult).toEqual({ allowed: true, remaining: null });

    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    const rpcErrorResult = await checkAndDeductCredits('user-123', 1);
    expect(rpcErrorResult).toEqual({ allowed: true, remaining: null });
  });

  it('skips DB call for unauthenticated, qa-bypass, or non-positive cost requests', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await checkAndDeductCredits(undefined, 1)).toEqual({ allowed: true, remaining: null });
    expect(await checkAndDeductCredits('qa-bypass-user', 1)).toEqual({ allowed: true, remaining: null });
    expect(await checkAndDeductCredits('user-123', 0)).toEqual({ allowed: true, remaining: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
