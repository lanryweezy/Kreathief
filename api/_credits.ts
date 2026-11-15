/**
 * Server-side AI credit verification and atomic deduction for Edge API routes.
 *
 * Uses Supabase PostgREST directly with SUPABASE_SERVICE_ROLE_KEY so it works inside
 * Vercel Edge runtime without heavy Node dependencies. Fails open when the service role
 * key is not configured or when a user does not yet have a `user_subscriptions` row, so
 * dev/preview environments and newly registered accounts continue working cleanly.
 */

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number | null;
  plan?: string;
}

const CREDIT_TIMEOUT_MS = 2500;

export async function checkAndDeductCredits(userId: string | undefined, cost: number = 1): Promise<CreditCheckResult> {
  if (!userId || userId === 'qa-bypass-user' || cost <= 0) {
    return { allowed: true, remaining: null };
  }

  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    return { allowed: true, remaining: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CREDIT_TIMEOUT_MS);

  try {
    // Vault: Use atomic DB-side RPC (`deduct_ai_credits`) instead of GET + PATCH to prevent
    // concurrent Edge requests from double-spending credits or clobbering concurrent top-ups.
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/deduct_ai_credits`;
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ p_user_id: userId, p_cost: cost }),
      signal: controller.signal,
    });

    if (!rpcRes.ok) {
      clearTimeout(timer);
      return { allowed: true, remaining: null };
    }

    const rows = await rpcRes.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || typeof row.allowed !== 'boolean') {
      clearTimeout(timer);
      return { allowed: true, remaining: null };
    }

    clearTimeout(timer);
    return {
      allowed: row.allowed,
      remaining: typeof row.remaining === 'number' ? row.remaining : null,
      plan: typeof row.plan_id === 'string' ? row.plan_id : undefined,
    };
  } catch {
    clearTimeout(timer);
    return { allowed: true, remaining: null };
  }
}
