/**
 * checkAndDeductCredits fail-open observability.
 *
 * The credit check intentionally fails open (the request is allowed) when Supabase is slow or
 * down. These tests pin that the failure is logged with ids only (never keys) while the returned
 * decision stays unchanged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const warn = vi.hoisted(() => vi.fn());
vi.mock('../../utils/log', () => ({ log: { warn, error: vi.fn(), info: vi.fn() } }));

import { checkAndDeductCredits } from '../../api/_credits';

describe('checkAndDeductCredits observability', () => {
  beforeEach(() => {
    warn.mockReset();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-secret');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('logs and still allows the request when the Supabase call throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    const result = await checkAndDeductCredits('user-1', 2);
    expect(result).toEqual({ allowed: true, remaining: null });
    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: 'credits.check.failed_open', userId: 'user-1', cost: 2 })
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('service-role-secret');
  });

  it('logs the upstream status and still allows the request when the lookup is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('err', { status: 503 })));
    const result = await checkAndDeductCredits('user-1');
    expect(result).toEqual({ allowed: true, remaining: null });
    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: 'credits.lookup.failed_open', status: 503 })
    );
  });
});
