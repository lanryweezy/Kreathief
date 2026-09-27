#!/usr/bin/env node
/**
 * capture-recraft.mjs
 * ------------------------------------------------------------------
 * HONEST competitor capture for the Phase 1.5 head-to-head: populates the
 * "Recraft V3 Vector" column with REAL Recraft output, fetched through the
 * Fal.ai API (the same endpoint our integration uses), so the comparison is a
 * measurement and not us grading our own homework.
 *
 * It NEVER writes a score and NEVER writes a placeholder. Scores are computed
 * by the same analyzer that scores our own exports (see the benchmark test).
 * If it cannot get a genuine SVG from the API it errors out — it will not fake
 * a competitor file, because fabricated evidence is exactly what this harness
 * exists to prevent.
 *
 * Briefs come from verification/vector-quality/competitors/prompts.json, which
 * the benchmark generates from HEAD_TO_HEAD_PROMPTS — one source of truth.
 *
 * Usage:
 *   FAL_KEY=...            corepack pnpm run capture:competitors
 *   corepack pnpm run capture:competitors -- --dry-run   # list targets, no network / no credits
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const COMPETITOR_DIR = join(ROOT, 'verification', 'vector-quality', 'competitors');
const PROMPTS_FILE = join(COMPETITOR_DIR, 'prompts.json');

// Single provider (Recraft) reached via Fal — never a standalone vendor API.
const TOOL = 'recraft';
const ENDPOINT = 'https://fal.run/fal-ai/recraft-v3/vector';

export const outputFileFor = (id) => `${TOOL}-${id}.svg`;

function loadBriefs() {
  if (!existsSync(PROMPTS_FILE)) {
    throw new Error(
      `Missing ${PROMPTS_FILE}. Generate it first by running the benchmark:\n` +
        `  vitest run tests/unit/vectorOutputQuality.benchmark.test.ts`
    );
  }
  const briefs = JSON.parse(readFileSync(PROMPTS_FILE, 'utf8'));
  if (!Array.isArray(briefs) || briefs.length === 0) {
    throw new Error('prompts.json is empty — refusing to run.');
  }
  return briefs;
}

/** Ask Fal for the Recraft V3 Vector SVG for one prompt. Throws if no real SVG comes back. */
async function captureOne(falKey, prompt) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style: 'vector_art', output_format: 'svg' }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`Fal ${res.status} for "${prompt.slice(0, 40)}…": ${detail}`);
  }
  const data = await res.json();
  let svg = data.vector_svg;
  if (!svg && data.images?.[0]?.url) {
    svg = await (await fetch(data.images[0].url)).text();
  }
  // Guard: a competitor file must actually be vector, or the comparison is meaningless.
  if (typeof svg !== 'string' || !/<svg[\s>]/i.test(svg)) {
    throw new Error('Recraft returned no SVG payload — refusing to write a non-vector file.');
  }
  return svg;
}

export async function main({ falKey = process.env.FAL_KEY, dryRun = false } = {}) {
  const briefs = loadBriefs();

  if (dryRun) {
    console.log(`[dry-run] Would capture ${briefs.length} Recraft SVGs via ${ENDPOINT}:`);
    for (const b of briefs) console.log(`  - ${outputFileFor(b.id)}  <- "${b.prompt.slice(0, 64)}…"`);
    console.log('[dry-run] No network calls made, no files written.');
    return briefs.map((b) => outputFileFor(b.id));
  }

  if (!falKey) {
    throw new Error(
      'FAL_KEY is required. Refusing to fabricate competitor output. ' +
        'Export FAL_KEY, or run with --dry-run to preview the plan.'
    );
  }

  mkdirSync(COMPETITOR_DIR, { recursive: true });
  const manifest = [];
  for (const b of briefs) {
    process.stdout.write(`Capturing ${b.id}… `);
    const svg = await captureOne(falKey, b.prompt);
    const file = outputFileFor(b.id);
    writeFileSync(join(COMPETITOR_DIR, file), svg, 'utf8');
    manifest.push({
      id: b.id,
      file,
      tool: TOOL,
      endpoint: ENDPOINT,
      bytes: svg.length,
      source: 'live Fal API (Recraft V3 Vector)',
      capturedAt: new Date().toISOString(),
    });
    console.log(`ok (${svg.length} bytes)`);
  }
  writeFileSync(join(COMPETITOR_DIR, `${TOOL}-capture.json`), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('\nDone. Score them (and ours) with the SAME analyzer:');
  console.log('  vitest run tests/unit/vectorOutputQuality.benchmark.test.ts');
  return manifest;
}

// Only auto-run when executed directly, never when imported by tests.
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main({ dryRun: process.argv.includes('--dry-run') }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
