-- Migration 015: Atomic AI credit deduction RPC
-- What: Adds `deduct_ai_credits(p_user_id, p_cost)` RPC to lock and deduct `ai_credits_balance`
--       inside a single PostgreSQL transaction.
-- Why: `api/_credits.ts` previously performed a separate GET + JS subtraction + PATCH, allowing
--      concurrent Edge API requests to double-spend credits or clobber concurrent top-ups.

CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  p_user_id UUID,
  p_cost INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, plan_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_plan    TEXT;
BEGIN
  IF p_cost IS NULL OR p_cost <= 0 THEN
    RETURN QUERY SELECT TRUE, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;

  -- Lock the subscription row to serialize concurrent deductions and top-ups.
  SELECT s.ai_credits_balance, s.plan_id
    INTO v_balance, v_plan
  FROM public.user_subscriptions s
  WHERE s.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_balance IS NULL THEN
    RETURN QUERY SELECT TRUE, NULL::INTEGER, v_plan;
    RETURN;
  END IF;

  IF v_balance < p_cost THEN
    RETURN QUERY SELECT FALSE, v_balance, v_plan;
    RETURN;
  END IF;

  UPDATE public.user_subscriptions
  SET ai_credits_balance = v_balance - p_cost
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, v_balance - p_cost, v_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(UUID, INTEGER) TO service_role;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- DROP FUNCTION IF EXISTS public.deduct_ai_credits(UUID, INTEGER);
