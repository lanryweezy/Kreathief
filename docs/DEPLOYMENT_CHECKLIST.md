# Kreathief — Deployment Checklist

Pre-flight checklist for shipping a production build to Vercel. Run every section in order.
When in doubt, the automated gates (`pnpm run verify:env`, CI) are the source of truth — this list
explains *why* each gate exists so a human reviewer understands the risk it removes.

---

## 1. Dependencies — reproducible, frozen install

Installs must be byte-for-byte reproducible. `package.json` pins the package manager
(`packageManager: pnpm@9.15.4`) and the lockfile is `lockfileVersion: 9.0`.

- [ ] `pnpm install --frozen-lockfile` succeeds locally **and does not modify `pnpm-lock.yaml`**.
- [ ] If you changed dependencies, regenerate the lockfile (`pnpm install`) and commit it — never
      deploy with a stale lockfile.
- [ ] CI (`.github/workflows/ci.yml`, `e2e-tests.yml`) and Vercel (`vercel.json`
      `installCommand`) all use `--frozen-lockfile`.

> Note: keep `pnpm.overrides` in `package.json` in sync with the `overrides:` block recorded in
> `pnpm-lock.yaml`. A mismatch makes `--frozen-lockfile` fail with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.

## 2. Environment variables

The deploy-time gate validates every variable against the `.env.example` contract:

```bash
# Validate the real environment (Vercel injects these at build time):
pnpm run verify:env

# Or check a local file before it goes up:
node scripts/verify-env.mjs --env-file=.env.local
```

It fails (exit 1) when any **critical** variable is missing, empty, or still a
`your_..._here` placeholder, or when a value is malformed (e.g. `OPENROUTER_API_KEY` not
prefixed `sk-or-`, Supabase/frontend URLs not `https://`). It also enforces two production
invariants that presence-checks alone cannot catch:

- **`VITE_USE_QA_BYPASS` must not be `true` in production** — that disables real authentication.
- **At least one payment provider must be fully wired** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`,
  or `PAYSTACK_SECRET_KEY`.

Required (critical): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `VITE_FRONTEND_URL`, `OPENROUTER_API_KEY`, `FAL_KEY`.

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, payment keys) must
**never** be exposed to the client — they are used only inside `api/*` functions.

## 3. Database migrations

Apply pending Supabase migrations (in order) before promoting traffic. The latest additions:

- `013_position_display_order_constraints.sql` — non-negative ordering constraints.
- `014_webhook_idempotency.sql` — `processed_webhook_events` ledger + `apply_paid_event_credits()` RPC.

Either apply each file individually in the Supabase SQL editor, or run the combined
`supabase/run_all_migrations.sql` (which already includes 013 & 014).

- [ ] `processed_webhook_events` table exists.
- [ ] `apply_paid_event_credits(...)` function exists and is executable by `service_role`.

## 4. Payment webhooks

- [ ] Stripe dashboard → endpoint points at `POST /api/stripe-webhook`; the endpoint secret is
      set as `STRIPE_WEBHOOK_SECRET`.
- [ ] Paystack dashboard → webhook URL points at `POST /api/paystack-webhook`;
      `PAYSTACK_SECRET_KEY` matches.
- [ ] Idempotency is active: re-delivering the same paid event must log
      `Skipping duplicate …` and NOT re-credit. The claim + credit runs in a single atomic
      RPC, so a retried delivery can neither double-credit nor half-apply.

## 5. Build & ship

- [ ] `pnpm run type-check` passes.
- [ ] `pnpm run test:run` is green.
- [ ] `pnpm run build` produces `dist/`.
- [ ] **A Vercel *production* build now runs `verify:env` before `vite build`** (see
      `vercel.json` `buildCommand`): if a critical env var is missing/placeholder, `VITE_USE_QA_BYPASS`
      is not `false`, or no payment provider is wired, the **deploy fails before it ships**. Preview
      deploys skip the gate. This is intentional — a misconfigured prod should never deploy.
- [ ] Deploy: `vercel deploy --prod` (output `dist`).
- [ ] Post-deploy smoke test: load the app, sign in (real Supabase auth), run one AI generation,
      complete one test credit purchase and confirm credits land exactly once.

## 6. Launch gate — before you spend on marketing

CI green is necessary but not sufficient: the frontend build and type-check **exclude `api/`**, so
broken payments and missing server secrets can still ship quietly. Run this sequence once, top to
bottom, and confirm every box. **Phase B and Phase C are the two hard gates** — do not send paid
traffic until both pass against production.

> **Run it:** `pnpm run verify:launch --env-file=.env.prod-check` (add `-- --db-check` to also
> confirm migration 014 is live on the target DB). It runs the automatable gates (A + B + optional
> C) and prints the manual ones — it never fakes a payment or a Sentry hit.

**A. Config is real (production Vercel env, not your local `.env.local`)**
- [ ] `vercel env pull .env.prod-check --environment production` (browser-authed; never commit this file).
- [ ] `node scripts/verify-env.mjs --env-file=.env.prod-check` → **exit 0** (it prints only status, never values).

**B. Migrations applied on production Supabase** (without this, every webhook 500s and nobody gets credits)
- [ ] Paste `supabase/migrations/014_webhook_idempotency.sql` into the Supabase SQL Editor → Run.
- [ ] Confirm `processed_webhook_events` exists and `apply_paid_event_credits(...)` returns
      `credited` then `duplicate` for the same key (see §3 smoke SQL).
- [ ] Prefer the SQL-editor paste over `supabase db push` unless your remote migration history
      (`supabase_migrations.schema_migrations`) is already tracked — otherwise `db push` will try to
      re-apply 001..014 and conflict.

**C. One real money transaction, end to end** (the actual marketing gate)
- [ ] Stripe **test** checkout of a Credit Pack → webhook fires → credits land **exactly once**;
      a replayed event logs `Skipping duplicate` and adds nothing.
- [ ] Paystack **test** charge → same confirmation.
- [ ] Run the live replay proof against the branch:
      `RUN_DB_INTEGRATION=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TEST_USER_ID=<uuid> pnpm exec vitest run tests/api/webhookIdempotency.integration.test.ts`

**D. Observability + trust, before traffic**
- [ ] `VITE_SENTRY_DSN` set; a deliberate error shows up in Sentry; an alert on error-rate is on.
- [ ] Watch `api/stripe-webhook` / `api/paystack-webhook` for 5xx during the first hour of traffic.
- [ ] Terms, privacy, refund policy, and a support/contact channel are live.
- [ ] First-run funnel works on **mobile** (sign up → generate → export → credit wall → pay → generate again).

---

## Automated gates

| Gate | Command | Blocks |
| ---- | ------- | ------ |
| Env config | `pnpm run verify:env` (also runs in the Vercel **production** build) | Missing/placeholder/malformed prod config, auth-bypass in prod, no payment provider |
| Launch pre-flight | `pnpm run verify:launch` (`-- --db-check` for a live migration probe) | Env config, missing idempotency migration/test artifacts, 014 not applied (with `--db-check`) |
| Reproducible deps | `pnpm install --frozen-lockfile` | Drift between `package.json` and `pnpm-lock.yaml` |
| Types | `pnpm run type-check` | Compile regressions |
| Behavior | `pnpm run test:run` | Test failures |
