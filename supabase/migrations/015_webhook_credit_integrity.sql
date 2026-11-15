-- Migration 015: Ensure positive webhook credits and resilient credit fulfillment
-- What: Adds a CHECK constraint to processed_webhook_events.credits (must be > 0),
--       validates RPC inputs (p_credits > 0, p_user_id NOT NULL), and ensures
--       apply_paid_event_credits provisions missing subscription rows instead of silently dropping credits.
-- Why: Negative or zero credits corrupt the billing ledger. Furthermore, if a customer's
--       user_subscriptions row is not yet provisioned, an UPDATE updates 0 rows while claiming
--       the event in the ledger, permanently losing the user's purchased credits.

-- 1. Sanitize any legacy violating records before adding the constraint
UPDATE public.processed_webhook_events
SET credits = 1
WHERE credits IS NOT NULL AND credits <= 0;

-- 2. Prevent future zero or negative credit values in the idempotency ledger
ALTER TABLE public.processed_webhook_events
ADD CONSTRAINT processed_webhook_events_credits_check
CHECK (credits > 0);

-- 3. Harden the atomic claim + credit RPC
CREATE OR REPLACE FUNCTION public.apply_paid_event_credits(
  p_idempotency_key TEXT,
  p_provider TEXT,
  p_event_type TEXT,
  p_reference_id TEXT,
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
  v_updated  INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id cannot be null';
  END IF;

  IF p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'p_credits must be strictly positive: %', p_credits;
  END IF;

  INSERT INTO public.processed_webhook_events
    (idempotency_key, provider, event_type, reference_id, user_id, credits)
  VALUES
    (p_idempotency_key, p_provider, p_event_type, p_reference_id, p_user_id, p_credits)
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN 'duplicate';
  END IF;

  UPDATE public.user_subscriptions
  SET ai_credits_balance = COALESCE(ai_credits_balance, 0) + p_credits
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    INSERT INTO public.user_subscriptions (user_id, ai_credits_balance, plan_id, status)
    VALUES (p_user_id, p_credits, 'free', 'active')
    ON CONFLICT (user_id) DO UPDATE
    SET ai_credits_balance = COALESCE(public.user_subscriptions.ai_credits_balance, 0) + EXCLUDED.ai_credits_balance;
  END IF;

  RETURN 'credited';
END;
$$;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE public.processed_webhook_events DROP CONSTRAINT IF EXISTS processed_webhook_events_credits_check;
