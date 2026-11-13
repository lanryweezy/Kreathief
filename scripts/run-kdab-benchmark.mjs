#!/usr/bin/env node
/**
 * KDAB Benchmark CLI Verification & Spec Audit Runner
 *
 * Parses docs/DESIGN_AGENT_BENCHMARK.md, validates all benchmark prompts and
 * pass criteria (KT-001 through KT-067 + S-01..S-05), and cross-checks that
 * the Kreathief AI pipeline modules and specialist routes are wired and intact.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function parseBenchmarkDoc(mdContent) {
  const tasks = [];
  const regex = /###\s+(KT-\d{3}|S-\d{2})\s+[—-]\s+([^\r\n]+)([\s\S]*?)(?=###\s+(?:KT-\d{3}|S-\d{2})|##\s+Regression Tracking|$)/g;
  let match;
  while ((match = regex.exec(mdContent)) !== null) {
    const id = match[1].trim();
    const title = match[2].trim();
    const body = match[3] || '';
    const hasPromptOrProtocol =
      body.includes('**Prompt:**') || body.includes('**Protocol:**') || body.includes('>');
    const hasPassCriteria =
      body.includes('**Pass criteria:**') || id.startsWith('S-');
    tasks.push({ id, title, hasPromptOrProtocol, hasPassCriteria });
  }
  return tasks;
}

function verifyPipelineInvariants() {
  const checks = [];

  const checkFileContains = (relPath, snippets, label) => {
    const full = path.join(ROOT, relPath);
    if (!fs.existsSync(full)) {
      checks.push({ label, passed: false, detail: `Missing file: ${relPath}` });
      return;
    }
    const content = fs.readFileSync(full, 'utf8');
    const missing = snippets.filter((s) => !content.includes(s));
    checks.push({
      label,
      passed: missing.length === 0,
      detail: missing.length === 0 ? 'OK' : `Missing: ${missing.join(', ')}`,
    });
  };

  checkFileContains(
    'utils/authFetch.ts',
    ['export async function authFetch', 'Authorization', 'X-Credits-Remaining'],
    'Auth header + credit sync wrapper (utils/authFetch.ts)'
  );
  checkFileContains(
    'services/geminiService.ts',
    ['authFetch(endpoint', 'geminiSchemaToJsonSchema', 'OUTPUT CONTRACT'],
    'OpenRouter authFetch + JSON schema forwarding (services/geminiService.ts)'
  );
  checkFileContains(
    'services/aiModelsService.ts',
    ["authFetch('/api/fal'", 'generateVideoFromQueue'],
    'Fal proxy authFetch + async video queue (services/aiModelsService.ts)'
  );
  checkFileContains(
    'services/aiDesignDirector.ts',
    ['generateLayerAsset', "layer.role === 'hero-cutout'", "layer.role === 'vector-accent'", "layer.role === 'background'"],
    'Specialist multi-model asset router active (services/aiDesignDirector.ts)'
  );
  checkFileContains(
    'config/imageModels.ts',
    ["id: 'qwen-image-2-1'", 'nativeTransparency: true', "DEFAULT_CUTOUT_MODEL = 'qwen-image-2-1'"],
    'Qwen-Image 2.1 native RGBA cutout model registered (config/imageModels.ts)'
  );
  checkFileContains(
    'api/fal.ts',
    ['checkAndDeductCredits', 'queue_submit', 'queue_status', 'queue_result'],
    'Server-side credit metering + Fal queue endpoints (api/fal.ts)'
  );
  checkFileContains(
    'services/kdabBenchmarkService.ts',
    ['evaluateVariantOnKDAB', 'evaluateClarificationSuite', 'runKDABBenchmarkSuite'],
    'KDAB 20-dimension rubric evaluator (services/kdabBenchmarkService.ts)'
  );

  return checks;
}

function main() {
  const docPath = path.join(ROOT, 'docs', 'DESIGN_AGENT_BENCHMARK.md');
  const md = fs.readFileSync(docPath, 'utf8');
  const tasks = parseBenchmarkDoc(md);
  const ktTasks = tasks.filter((t) => t.id.startsWith('KT-'));
  const suppTasks = tasks.filter((t) => t.id.startsWith('S-'));
  const checks = verifyPipelineInvariants();

  console.log('================================================================');
  console.log(' KREATHIEF DESIGN AGENT BENCHMARK (KDAB) PIPELINE AUDIT');
  console.log('================================================================');
  console.log(`Parsed Benchmark Tasks : ${tasks.length} total (${ktTasks.length} KT core + ${suppTasks.length} supplementary)`);
  console.log(
    `Spec Completeness      : ${tasks.filter((t) => t.hasPromptOrProtocol && t.hasPassCriteria).length}/${tasks.length} tasks have prompt/protocol & pass criteria`
  );
  console.log('----------------------------------------------------------------');
  console.log(' Pipeline Invariant Checks:');
  for (const c of checks) {
    console.log(`  [${c.passed ? 'PASS' : 'FAIL'}] ${c.label} -> ${c.detail}`);
  }
  console.log('================================================================');

  const failed = checks.filter((c) => !c.passed);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
