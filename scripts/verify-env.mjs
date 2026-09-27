#!/usr/bin/env node
// Deploy environment verification.
//
// Why: a misconfigured production deploy (a placeholder key left in place, QA auth-bypass
// still enabled, a payment provider half-wired) fails at runtime in front of customers. This
// script turns that into a pre-deploy checklist: it validates that every required variable is
// present, non-placeholder, and well-formed, and exits non-zero otherwise so it can gate CI /
// `vercel deploy`.
//
// Usage:
//   node scripts/verify-env.mjs                 # validate process.env (production mode)
//   node scripts/verify-env.mjs --mode=dev      # relax production-only rules
//   node scripts/verify-env.mjs --env-file=.env.local   # also read a local dotenv file
//
// Values from process.env take precedence; the --env-file is merged underneath it.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const argv = process.argv.slice(2);
const modeFlag = argv.find((a) => a.startsWith('--mode='));
const mode = modeFlag ? modeFlag.split('=')[1] : 'production';
const isProd = mode === 'production';
const envFileArg = argv.find((a) => a.startsWith('--env-file='));
const envFilePath = envFileArg ? resolve(root, envFileArg.split('=')[1]) : null;

// Treat these literal sentinel values (and empty strings) as "not configured".
const PLACEHOLDER = /^(your_.*_here|changeme|change_me|todo|xxx+|<.*>)$/i;

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = parseEnvFile(envFilePath);
// process.env wins over the file; empty process.env values fall through to the file.
function readVar(name) {
  const fromProcess = process.env[name];
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  return fileEnv[name] ?? fromProcess;
}

// category: 'critical' | 'recommended'; validators run only when a value is present.
const SPEC = [
  { name: 'VITE_SUPABASE_URL', category: 'critical', label: 'Supabase project URL', validate: (v) => /^https:\/\/.+/.test(v), hint: 'must be an https:// URL' },
  { name: 'VITE_SUPABASE_ANON_KEY', category: 'critical', label: 'Supabase anon key' },
  { name: 'SUPABASE_JWT_SECRET', category: 'critical', label: 'Supabase JWT signing secret (server)' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', category: 'critical', label: 'Supabase service-role key (server only)' },
  { name: 'VITE_FRONTEND_URL', category: 'critical', label: 'Canonical frontend origin (CORS/callbacks)', validate: (v) => (isProd ? /^https:\/\/.+/.test(v) : /^(https?|file):\/\/.+|^$/.test(v)), hint: 'must be an https:// URL in production' },
  { name: 'OPENROUTER_API_KEY', category: 'critical', label: 'OpenRouter gateway key (AI text/design)', validate: (v) => /^sk-or-./.test(v), hint: 'expected to start with "sk-or-"' },
  { name: 'FAL_KEY', category: 'critical', label: 'Fal.ai key (image generation)' },

  { name: 'STRIPE_SECRET_KEY', category: 'recommended', label: 'Stripe secret key', validate: (v) => /^sk_(live|test)_.+/.test(v), hint: 'expected "sk_live_..." (prod) or "sk_test_..."' },
  { name: 'STRIPE_WEBHOOK_SECRET', category: 'recommended', label: 'Stripe webhook signing secret', validate: (v) => /^whsec_.+/.test(v), hint: 'expected "whsec_..."' },
  { name: 'PAYSTACK_SECRET_KEY', category: 'recommended', label: 'Paystack secret key', validate: (v) => /^sk_(live|test)_.+/.test(v), hint: 'expected "sk_live_..." (prod) or "sk_test_..."' },
  { name: 'VITE_SENTRY_DSN', category: 'recommended', label: 'Sentry DSN (error tracking)', validate: (v) => /^https:\/\/.+@.+\.\d+$/i.test(v) || /^https:\/\/.+@.+/.test(v), hint: 'expected an https://…@….ingest.sentry.io DSN' },

  { name: 'DYNAMIC_MOCKUPS_API_KEY', category: 'optional', label: 'Dynamic Mockups API' },
  { name: 'ICONSCOUT_CLIENT_ID', category: 'optional', label: 'IconScout client ID' },
  { name: 'ICONSCOUT_SECRET_KEY', category: 'optional', label: 'IconScout secret' },
  { name: 'UNSPLASH_ACCESS_KEY', category: 'optional', label: 'Unsplash' },
  { name: 'PEXELS_API_KEY', category: 'optional', label: 'Pexels' },
  { name: 'PIXABAY_API_KEY', category: 'optional', label: 'Pixabay' },
  { name: 'FREEPIK_API_KEY', category: 'optional', label: 'Freepik' },
  { name: 'TENOR_API_KEY', category: 'optional', label: 'Tenor' },
];

const failures = [];
const warnings = [];
const ok = [];

const state = new Map();
for (const entry of SPEC) {
  const value = readVar(entry.name);
  const missing = value === undefined || value === '' || PLACEHOLDER.test(value);
  state.set(entry.name, { value: missing ? undefined : value, missing });
}

for (const entry of SPEC) {
  const { value, missing } = state.get(entry.name);
  if (missing) {
    const msg = `${entry.name} — ${entry.label}`;
    if (entry.category === 'critical') failures.push(`MISSING required: ${msg}`);
    else if (entry.category === 'recommended') warnings.push(`not set (recommended): ${msg}`);
    else warnings.push(`not set (optional): ${entry.name}`);
    continue;
  }
  if (entry.validate && !entry.validate(value)) {
    failures.push(`INVALID ${entry.name}: ${entry.hint}`);
  } else {
    ok.push(entry.name);
  }
}

// Production cross-checks that individual presence cannot catch.
const bypass = readVar('VITE_USE_QA_BYPASS');
if (isProd && String(bypass).toLowerCase() === 'true') {
  failures.push('VITE_USE_QA_BYPASS=true in production — this disables real authentication. Set it to false.');
}

// At least one payment provider must be fully wired for a paid product.
const stripeReady = !state.get('STRIPE_SECRET_KEY').missing && !state.get('STRIPE_WEBHOOK_SECRET').missing;
const paystackReady = !state.get('PAYSTACK_SECRET_KEY').missing;
if (isProd && !stripeReady && !paystackReady) {
  failures.push('No payment provider configured: set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET, or PAYSTACK_SECRET_KEY.');
} else if (isProd && !stripeReady && paystackReady) {
  warnings.push('Paystack is configured but Stripe is not fully wired (webhook may fail for Stripe events).');
}

// Report.
const symbol = { ok: 'OK ', warn: 'WARN', fail: 'FAIL' };
console.log(`\nKreathief environment check (mode: ${mode})`);
console.log(`env file: ${envFilePath ? envFilePath : '(none — process.env only)'}\n`);
for (const entry of SPEC) {
  const { missing } = state.get(entry.name);
  const failed = failures.some((f) => f.includes(entry.name));
  const tag = missing ? (entry.category === 'critical' ? symbol.fail : symbol.warn) : failed ? symbol.fail : symbol.ok;
  console.log(`  [${tag}]  ${entry.name.padEnd(28)} ${entry.label}`);
}

if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`  - ${w}`);
}
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  - ${f}`);
  console.log(`\n${failures.length} blocking issue(s). Fix before deploying.\n`);
  process.exit(1);
}

console.log(`\nAll ${ok.length} present variable(s) valid; ${failures.length} failures. Ready to deploy.\n`);
