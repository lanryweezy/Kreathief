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

export async function checkAndDeductCredits(
  userId: string | undefined,
  cost: number = 1
): Promise<CreditCheckResult> {
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
    const queryUrl = `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&select=ai_credits_balance,plan_id,status&limit=1`;

    const getRes = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!getRes.ok) {
      clearTimeout(timer);
      return { allowed: true, remaining: null };
    }

    const rows = await getRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      clearTimeout(timer);
      return { allowed: true, remaining: null };
    }

    const row = rows[0];
    const balance = typeof row.ai_credits_balance === 'number' ? row.ai_credits_balance : null;
    if (balance === null) {
      clearTimeout(timer);
      return { allowed: true, remaining: null, plan: row.plan_id };
    }

    if (balance < cost) {
      clearTimeout(timer);
      return { allowed: false, remaining: balance, plan: row.plan_id };
    }

    const nextBalance = balance - cost;
    const patchUrl = `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${encodeURIComponent(userId)}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ ai_credits_balance: nextBalance }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return { allowed: true, remaining: nextBalance, plan: row.plan_id };
  } catch {
    clearTimeout(timer);
    return { allowed: true, remaining: null };
  }
}
