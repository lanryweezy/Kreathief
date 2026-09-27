#!/usr/bin/env node
// Launch gate — one runnable command for the "can we turn on paid marketing?" question.
//
// WHY: CI green is NOT launch-ready. The frontend build and `type-check` both EXCLUDE `api/`,
// so broken payments and missing server secrets can ship quietly, and a migration that was
// never applied to *production* Supabase makes every payment webhook 500 (nobody gets credits).
// This script runs the checks that CAN be automated and prints the exact commands for the ones
// that require a human + live credentials. It is a pre-flight, not a deploy: read it, run the
// manual gates, then deploy.
//
// Usage:
//   node scripts/verify-launch.mjs                        # env(process.env) + repo checks
//   node scripts/verify-launch.mjs --env-file=.env.prod-check
//   node scripts/verify-launch.mjs --env-file=.env.prod-check --db-check
//
//   --env-file=<path>   validate this dotenv file (forwarded to verify-env)
//   --db-check          ALSO connect to the target Supabase and confirm the idempotency
//                       migration is applied. Needs SUPABASE_URL (or VITE_SUPABASE_URL) +
//                       SUPABASE_SERVICE_ROLE_KEY resolvable from process.env or --env-file.
//                       Read-only (a single bounded SELECT); performs no writes.
//
// Exit code 0 = every automated gate passed (manual gates still listed). Non-zero = a blocking
// automated gate failed. Values are never printed — only status.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const argv = process.argv.slice(2);
const envFileArg = argv.find((a) => a.startsWith('--env-file='));
const envFilePath = envFileArg ? resolve(root, envFileArg.split('=')[1]) : null;
const dbCheck = argv.includes('--db-check');

const blocking = [];
const passed = [];
const manual = [];
const note = (kind, msg) => (kind === 'pass' ? passed : blocking).push(msg);

function parseEnvFile(path) {
  const out = {};
  if (!path || !existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

const fileEnv = parseEnvFile(envFilePath);
const readVar = (name) => {
  const fromProcess = process.env[name];
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  return fileEnv[name];
};

console.log('\n=== Kreathief launch gate ===');
console.log(`env source: ${envFilePath ? envFilePath : '(process.env only)'}\n`);

// ── A. Environment config (delegates to the single source of truth: verify-env) ──
console.log('[A] Environment configuration (verify:env, production rules)…');
{
  const args = [resolve(root, 'scripts/verify-env.mjs')];
  if (envFilePath) args.push(`--env-file=${envFilePath}`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status === 0) note('pass', 'verify:env exited 0 (all critical vars present, no auth-bypass, a payment provider is wired)');
  else blocking.push(`verify:env FAILED (exit ${r.status}) — fix every listed failure before deploying.`);
}

// ── B. Repo integrity: the launch-critical artifacts must actually exist ──
console.log('\n[B] Launch-critical repo artifacts…');
{
  const migration = 'supabase/migrations/014_webhook_idempotency.sql';
  const replayTest = 'tests/api/webhookIdempotency.integration.test.ts';
  const combined = 'supabase/run_all_migrations.sql';
  for (const [f, why] of [
    [migration, 'the no-double-credit guarantee lives in its apply_paid_event_credits() RPC'],
    [replayTest, 'proves webhook replay credits exactly once against a live DB'],
  ]) {
    if (existsSync(resolve(root, f))) note('pass', `${f} present — ${why}`);
    else blocking.push(`${f} MISSING — ${why}`);
  }
  if (existsSync(resolve(root, combined))) {
    const text = readFileSync(resolve(root, combined), 'utf8');
    if (/014_webhook_idempotency/i.test(text)) note('pass', `${combined} includes migration 014`);
    else blocking.push(`${combined} does NOT reference 014 — applying it would skip idempotency`);
  }
}

// ── C. Optional live DB check: is the idempotency migration applied to THIS database? ──
if (dbCheck) {
  console.log('\n[C] Live Supabase migration check (--db-check)…');
  const url = readVar('SUPABASE_URL') || readVar('VITE_SUPABASE_URL') || readVar('NEXT_PUBLIC_SUPABASE_URL') || '';
  const key = readVar('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) {
    blocking.push('--db-check requested but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not resolvable');
  } else {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      // Bounded read-only probe: proves processed_webhook_events (migration 014) exists here.
      const { error } = await supabase.from('processed_webhook_events').select('event_id').limit(1);
      if (!error) note('pass', 'processed_webhook_events exists on the target DB (migration 014 applied)');
      else blocking.push(`processed_webhook_events not queryable: ${error.message} — apply migration 014 to production`);
    } catch (e) {
      blocking.push(`--db-check could not run: ${e && e.message ? e.message : e}`);
    }
  }
} else {
  manual.push(
    'Live DB check (optional automation): re-run with --db-check to confirm migration 014 is applied to the target Supabase.'
  );
}

// ── D. Manual gates a script must never fake ──
manual.push(
  'Apply migration 014 on PRODUCTION Supabase: paste supabase/migrations/014_webhook_idempotency.sql in the SQL Editor (prefer over `db push` unless migration history is tracked).'
);
manual.push(
  'One REAL test transaction each provider: Stripe test checkout + Paystack test charge → webhook fires → credits land EXACTLY ONCE; a replay logs "Skipping duplicate" and adds nothing.'
);
manual.push(
  'Replay proof against the branch:\n      RUN_DB_INTEGRATION=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TEST_USER_ID=<uuid> pnpm exec vitest run tests/api/webhookIdempotency.integration.test.ts'
);
manual.push('Observability: VITE_SENTRY_DSN set; trigger a deliberate error and see it in Sentry; an error-rate alert is configured.');
manual.push('Legal/trust: Terms, privacy, refund policy, support channel are live; first-run funnel works on mobile.');

// ── Report ──
console.log('\n=== Summary ===');
for (const p of passed) console.log(`  [OK]   ${p}`);
for (const f of blocking) console.log(`  [FAIL] ${f}`);

if (manual.length) {
  console.log('\n--- Manual gates still required before paid traffic ---');
  for (const m of manual) console.log(`  [ ] ${m}`);
}

if (blocking.length) {
  console.log(`\n${blocking.length} blocking automated gate(s) failed. Resolve them, then re-run.\n`);
  process.exit(1);
}
console.log('\nAll automated gates passed. Complete the manual gates above before spending on marketing.\n');
