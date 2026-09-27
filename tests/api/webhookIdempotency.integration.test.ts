/**
 * Webhook idempotency — REAL replay test against a live Supabase branch.
 *
 * This is the test that proves the actual no-double-credit guarantee, which lives in the
 * apply_paid_event_credits() RPC (migration 014), not in the handler. It claims the same
 * idempotency key twice and asserts the balance moves by exactly one credit and the second
 * delivery reports 'duplicate'.
 *
 * It is intentionally GATED so it never runs (or writes) against a shared database by accident:
 *   RUN_DB_INTEGRATION=1  SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  TEST_USER_ID=<uuid> \
 *     pnpm exec vitest run tests/api/webhookIdempotency.integration.test.ts
 *
 * TEST_USER_ID must be a user that already has a user_subscriptions row (the RPC UPDATE only
 * touches an existing row). The test restores the original balance and removes its ledger row,
 * so it is safe to re-run. When any gate is missing the whole suite skips (stays green in CI).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const enabled =
  process.env.RUN_DB_INTEGRATION === '1' &&
  !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !!process.env.TEST_USER_ID;

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const userId = process.env.TEST_USER_ID || '';

const CREDITS = 1000;
// Unique per run so repeated runs never collide with a prior ledger row.
const idempotencyKey = `test:stripe:replay:${crypto.randomUUID()}`;

const supabase = enabled ? createClient(url, key) : null;

let initialBalance = 0;
const call = () => {
  if (!supabase) throw new Error('supabase client not configured');
  return supabase.rpc('apply_paid_event_credits', {
    p_idempotency_key: idempotencyKey,
    p_provider: 'stripe',
    p_event_type: 'checkout.session.completed',
    p_reference_id: 'cs_replay_test',
    p_user_id: userId,
    p_credits: CREDITS,
  });
};

const readBalance = async () => {
  if (!supabase) throw new Error('supabase client not configured');
  const { data } = await supabase
    .from('user_subscriptions')
    .select('ai_credits_balance')
    .eq('user_id', userId)
    .single();
  return data?.ai_credits_balance ?? 0;
};

describe.skipIf(!enabled)('apply_paid_event_credits RPC (live replay)', () => {
  beforeAll(async () => {
    initialBalance = await readBalance();
  });

  afterAll(async () => {
    if (!supabase) return;
    // Restore original balance and drop the ledger claim this test created.
    await supabase.from('user_subscriptions').update({ ai_credits_balance: initialBalance }).eq('user_id', userId);
    await supabase.from('processed_webhook_events').delete().eq('idempotency_key', idempotencyKey);
  });

  it('credits once, then treats a duplicate delivery as a no-op', async () => {
    const first = await call();
    expect(first.error).toBeNull();
    expect(first.data).toBe('credited');
    expect(await readBalance()).toBe(initialBalance + CREDITS);

    const second = await call();
    expect(second.error).toBeNull();
    expect(second.data).toBe('duplicate');
    // The whole point: a retried delivery must NOT credit a second time.
    expect(await readBalance()).toBe(initialBalance + CREDITS);
  });
});

// Keep the file valid (a test file must have at least one test) even when gated off.
describe.skipIf(enabled)('apply_paid_event_credits RPC (live replay) — skipped', () => {
  it('skipped: set RUN_DB_INTEGRATION=1 + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + TEST_USER_ID to enable', () => {
    expect(true).toBe(true);
  });
});
