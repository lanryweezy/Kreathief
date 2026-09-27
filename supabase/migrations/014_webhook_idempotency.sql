-- Migration 014: Webhook idempotency ledger for payment credit events
-- 💡 What: Creates `processed_webhook_events` (a ledger keyed by a per-provider event key) and an
--          atomic `apply_paid_event_credits(...)` RPC that claims an event and credits the user in a
--          single transaction, returning 'credited' | 'duplicate'.
-- 🎯 Why: Stripe and Paystack retry webhook deliveries. The handlers previously did an unguarded
--          `balance = balance + 1000` on every paid event, so a retried delivery could double-credit a
--          customer (giving away credits) and concurrent deliveries could clobber each other via a
--          read-modify-write race. Claiming the event id before crediting — atomically — removes both.

-- ============================================
-- PROCESSED WEBHOOK EVENT LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  -- Stable, unique key per charge/session event: '<provider>:<event_type>:<provider_reference_id>'.
  idempotency_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paystack')),
  event_type TEXT NOT NULL,
  reference_id TEXT,
  user_id UUID,
  credits INTEGER,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at
  ON public.processed_webhook_events(processed_at DESC);

-- Lock the ledger down: only the service role / SECURITY DEFINER functions may touch it.
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ATOMIC CLAIM + CREDIT
-- ============================================
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
  v_current  BIGINT;
BEGIN
  -- Claim the event first. Because this INSERT and the credit UPDATE below run in the SAME
  -- transaction, a delivery can never be left half-applied (credited-but-unclaimed or the
  -- reverse). A retried delivery finds the key already present and does nothing.
  INSERT INTO public.processed_webhook_events
    (idempotency_key, provider, event_type, reference_id, user_id, credits)
  VALUES
    (p_idempotency_key, p_provider, p_event_type, p_reference_id, p_user_id, p_credits)
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN 'duplicate';
  END IF;

  -- Fresh claim: apply the credit atomically (no client-side read-modify-write race).
  SELECT ai_credits_balance INTO v_current
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF v_current IS NULL THEN
    v_current := 0;
  END IF;

  UPDATE public.user_subscriptions
  SET ai_credits_balance = v_current + p_credits
  WHERE user_id = p_user_id;

  RETURN 'credited';
END;
$$;

-- Only the service role should be able to invoke the credit function.
REVOKE ALL ON FUNCTION public.apply_paid_event_credits(TEXT, TEXT, TEXT, TEXT, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_paid_event_credits(TEXT, TEXT, TEXT, TEXT, UUID, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paid_event_credits(TEXT, TEXT, TEXT, TEXT, UUID, INTEGER) TO service_role;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- DROP FUNCTION IF EXISTS public.apply_paid_event_credits(TEXT, TEXT, TEXT, TEXT, UUID, INTEGER);
-- DROP TABLE IF EXISTS public.processed_webhook_events;
