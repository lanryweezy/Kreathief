import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exportToSvg } from '../../services/exportService';
import { analyzeSvg, type VectorQualityMetrics } from '../../services/vectorQuality/analyzer';
import { BENCHMARK_CASES } from '../../services/vectorQuality/cases';
import { HEAD_TO_HEAD_PROMPTS } from '../../services/vectorQuality/prompts';
import { validateCompetitorFilename, isRejection, ALLOWED_TOOLS } from '../../services/vectorQuality/naming';
import type { DesignNode } from '../../types/design';

/**
 * VECTOR OUTPUT-QUALITY BENCHMARK
 * ------------------------------------------------------------------
 * Answers the only question that decides "is this a good AI *vector* tool":
 * when a professional opens our exported file, is it clean, editable, real
 * vector — or is it a raster in a trench coat?
 *
 * This is deliberately a benchmark that CAN fail. The `raster-trap` case is a
 * negative control that MUST be flagged; if the analyzer ever scores it highly
 * the suite goes red. A green run therefore means something to an outside
 * reviewer, which is the whole point (self-praise is not evidence).
 *
 * Artifacts are written to `verification/vector-quality/` so a human can open
 * every SVG at full resolution and drop competitor exports into
 * `verification/vector-quality/competitors/` to be scored by this same code.
 */

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'verification', 'vector-quality');
const COMPETITOR_DIR = join(OUT_DIR, 'competitors');

interface Row {
  name: string;
  metrics: VectorQualityMetrics;
}

const render = (c: (typeof BENCHMARK_CASES)[number]): string =>
  exportToSvg(c.nodes, c.background, c.width, c.height);

describe('Vector output-quality benchmark (exported SVG is real, editable vector)', () => {
  const rows: Row[] = [];

  it('every genuine-vector case exports clean, editable, raster-free SVG', () => {
    for (const c of BENCHMARK_CASES) {
      const svg = render(c);
      const m = analyzeSvg(svg, c.name);
      if (c.expectRaster) continue; // handled by the negative-control test
      rows.push({ name: c.name, metrics: m });

      // Structural sanity — no corrupted coordinates, single well-formed root.
      expect(m.wellFormed, `${c.name}: not well-formed`).toBe(true);
      expect(m.hasViewBox, `${c.name}: missing viewBox`).toBe(true);
      expect(m.nanTokens, `${c.name}: NaN in output`).toBe(0);
      expect(m.undefinedTokens, `${c.name}: undefined in output`).toBe(0);
      expect(m.emptyGroups, `${c.name}: empty groups`).toBe(0);

      // The critical claim: no smuggled raster.
      expect(m.rasterImages, `${c.name}: contains <image>`).toBe(0);
      expect(m.hiddenRasterInClip, `${c.name}: hidden raster in clip-path`).toBe(0);

      // It must actually contain editable vector content.
      expect(m.vectorPrimitives + m.editableText, `${c.name}: nothing editable`).toBeGreaterThan(0);
      expect(m.score, `${c.name}: score too low (${m.score})`).toBeGreaterThanOrEqual(85);
    }
  });

  it('logo-mark: genuine bezier geometry with separated, recolorable fills', () => {
    const m = rows.find((r) => r.name === 'logo-mark')!.metrics;
    expect(m.pathElements).toBeGreaterThanOrEqual(1);
    expect(m.totalCurves, 'bezier curves expected').toBeGreaterThanOrEqual(2);
    expect(m.curveRatio).toBeGreaterThan(0.1);
    expect(m.distinctFills, 'colors should be separated into distinct fills').toBeGreaterThanOrEqual(2);
    expect(m.maxAnchorsPerPath, 'path is suspiciously dense (traced raster?)').toBeLessThan(200);
  });

  it('wordmark + badge: text stays editable (<text>), not flattened to outlines', () => {
    const word = rows.find((r) => r.name === 'wordmark')!.metrics;
    expect(word.editableText).toBeGreaterThanOrEqual(1);
    const badge = rows.find((r) => r.name === 'boolean-badge')!.metrics;
    expect(badge.editableText).toBeGreaterThanOrEqual(1);
    expect(badge.pathElements).toBeGreaterThanOrEqual(1);
  });

  it('icon-trio: distinct primitives keep distinct colors', () => {
    const m = rows.find((r) => r.name === 'icon-trio')!.metrics;
    expect(m.vectorPrimitives).toBeGreaterThanOrEqual(3);
    expect(m.distinctFills).toBeGreaterThanOrEqual(3);
  });

  it('NEGATIVE CONTROL: analyzer flags raster-smuggled-into-a-shape (so a green run is meaningful)', () => {
    const trap = BENCHMARK_CASES.find((c) => c.expectRaster)!;
    const m = analyzeSvg(render(trap), trap.name);
    rows.push({ name: trap.name, metrics: m });
    expect(m.rasterImages).toBeGreaterThanOrEqual(1);
    expect(m.hiddenRasterInClip).toBeGreaterThanOrEqual(1);
    expect(m.score, 'raster trap must score poorly').toBeLessThan(70);
  });

  it('writes inspectable artifacts + a machine-readable report', () => {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const r of rows) {
      const c = BENCHMARK_CASES.find((x) => x.name === r.name)!;
      writeFileSync(join(OUT_DIR, `${r.name}.svg`), render(c), 'utf8');
    }
    writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(rows.map((r) => r.metrics), null, 2), 'utf8');
    expect(existsSync(join(OUT_DIR, 'report.json'))).toBe(true);

    // Human-readable scorecard.
    const table = rows.map((r) => ({
      case: r.name,
      score: r.metrics.score,
      vectors: r.metrics.vectorPrimitives,
      editableText: r.metrics.editableText,
      distinctFills: r.metrics.distinctFills,
      raster: r.metrics.rasterImages,
      maxAnchors: r.metrics.maxAnchorsPerPath,
    }));
    console.table(table);
  });
});

/**
 * Head-to-head. Drop competitor exports (Recraft / Illustrator / Figma / etc.)
 * as `.svg` files into `verification/vector-quality/competitors/` and the SAME
 * analyzer scores them alongside ours — the fairest way to answer "is it the
 * best," because we are not grading our own homework alone.
 */
describe('Head-to-head competitor scoring (same analyzer)', () => {
  const mdTable = (rows: { tool: string; file: string; metrics: VectorQualityMetrics }[]): string => {
    const sorted = [...rows].sort((a, b) => b.metrics.score - a.metrics.score);
    const lines = [
      '# Head-to-head vector quality',
      '',
      'Scored by `services/vectorQuality/analyzer.ts` — identical rules for every file, ours included.',
      '',
      '| rank | file | tool | score | vectors | editableText | distinctFills | raster | maxAnchors | curveRatio |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ];
    sorted.forEach((r, i) => {
      const m = r.metrics;
      lines.push(
        `| ${i + 1} | ${r.file} | ${r.tool} | ${m.score} | ${m.vectorPrimitives} | ${m.editableText} | ${m.distinctFills} | ${m.rasterImages} | ${m.maxAnchorsPerPath} | ${m.curveRatio.toFixed(2)} |`
      );
    });
    return lines.join('\n') + '\n';
  };

  it('writes a drop-in template (from the canonical prompts) into competitors/', () => {
    mkdirSync(COMPETITOR_DIR, { recursive: true });
    const readmePath = join(COMPETITOR_DIR, 'README.md');
    const lines = [
      '# Competitor exports',
      '',
      `Run the **exact same ${HEAD_TO_HEAD_PROMPTS.length} prompts** through each tool, export **SVG**`,
      '(keep text as text where the tool allows; do NOT rasterize / flatten), then drop the files here named:',
      '',
      '    <tool>-<prompt-id>.svg   e.g.  recraft-logo-mark.svg, illustrator-wordmark.svg',
      '',
      'Tools for a credible claim: Recraft V3 Vector, Adobe Illustrator (Text-to-Vector), Linearity Curve, Figma AI.',
      '',
      '## The prompts (paste verbatim, unchanged)',
      '',
    ];
    HEAD_TO_HEAD_PROMPTS.forEach((p, i) => {
      lines.push(`${i + 1}. **${p.label}** — id \`${p.id}\``, '', `   > ${p.prompt}`, '');
    });
    lines.push(
      'Then re-run:',
      '',
      '```bash',
      'corepack pnpm exec vitest run tests/unit/vectorOutputQuality.benchmark.test.ts',
      '```',
      '',
      'The test scores every file here with the SAME analyzer as our own exports and writes',
      '`head-to-head.md` + `competitors-report.json`. A green ranking is evidence; our own',
      'score without rivals next to it is not.'
    );
    if (!existsSync(readmePath)) writeFileSync(readmePath, lines.join('\n') + '\n', 'utf8');
    expect(existsSync(readmePath)).toBe(true);

    // Machine-readable briefs: the honest capture tool reads THIS file, so the list it
    // sends to a competitor can never drift from the list this harness scores against.
    const promptsPath = join(COMPETITOR_DIR, 'prompts.json');
    writeFileSync(
      promptsPath,
      JSON.stringify(HEAD_TO_HEAD_PROMPTS.map((p) => ({ id: p.id, label: p.label, prompt: p.prompt })), null, 2),
      'utf8'
    );
    const roundTrip = JSON.parse(readFileSync(promptsPath, 'utf8'));
    expect(roundTrip.map((p: any) => p.id)).toEqual(HEAD_TO_HEAD_PROMPTS.map((p) => p.id));
    // NEGATIVE CONTROL: the file must carry the real prompts, not just id stubs.
    expect(roundTrip.every((p: any) => typeof p.prompt === 'string' && p.prompt.length > 10)).toBe(true);
  });

  it('scores any competitor SVGs found in the competitors/ folder, alongside ours', () => {
    const files = existsSync(COMPETITOR_DIR)
      ? readdirSync(COMPETITOR_DIR).filter((f) => f.toLowerCase().endsWith('.svg'))
      : [];
    // Our reference rows are always computed so the table stays comparable even when
    // only a single rival file has landed.
    const ours = BENCHMARK_CASES.filter((c) => !c.expectRaster).map((c) => ({
      tool: 'kreathief',
      file: `kreathief-${c.name}.svg`,
      metrics: analyzeSvg(render(c), `kreathief-${c.name}`),
    }));
    if (files.length === 0) {
      console.log('[vector-quality] competitors/ is empty — template README written; drop rival SVGs to enable scoring.');
      writeFileSync(join(COMPETITOR_DIR, 'kreathief-baseline.md'), mdTable(ours), 'utf8');
      return;
    }
    // Provenance contract: only well-named `<tool>-<id>.svg` files are scored;
    // anything else is rejected with a reason instead of silently polluting the table
    // with a mis-attributed "tool" derived from a stray filename.
    const parsed = files.map((f) => ({ file: f, result: validateCompetitorFilename(f) }));
    const matched = parsed.filter((p) => !isRejection(p.result));
    const rejected = parsed.filter((p) => isRejection(p.result));
    for (const r of rejected) {
      console.warn(`[vector-quality] REJECTED ${r.file}: ${(r.result as { reason: string }).reason}`);
    }
    const rivals = matched.map((p) => ({
      tool: (p.result as { tool: string }).tool,
      file: p.file,
      metrics: analyzeSvg(readFileSync(join(COMPETITOR_DIR, p.file), 'utf8'), p.file),
    }));
    if (rivals.length === 0) {
      console.log('[vector-quality] competitors/ has files but none validly named — writing ours baseline only.');
      writeFileSync(join(COMPETITOR_DIR, 'kreathief-baseline.md'), mdTable(ours), 'utf8');
      return;
    }
    const all = [...ours, ...rivals];
    writeFileSync(join(COMPETITOR_DIR, 'head-to-head.md'), mdTable(all), 'utf8');
    writeFileSync(
      join(COMPETITOR_DIR, 'competitors-report.json'),
      JSON.stringify(all.map((r) => ({ tool: r.tool, file: r.file, metrics: r.metrics })), null, 2),
      'utf8'
    );
    console.table(all.map((r) => ({ file: r.file, score: r.metrics.score, raster: r.metrics.rasterImages, anchors: r.metrics.totalAnchors })));
    expect(all.length).toBeGreaterThan(ours.length);
    expect(existsSync(join(COMPETITOR_DIR, 'head-to-head.md'))).toBe(true);
  });
});

describe('Competitor filename provenance contract (naming.ts)', () => {
  const validIds = HEAD_TO_HEAD_PROMPTS.map((p) => p.id);

  it.each(validIds)('accepts a well-named recraft file for brief "%s"', (id) => {
    const r = validateCompetitorFilename(`recraft-${id}.svg`);
    expect(isRejection(r)).toBe(false);
    expect((r as { tool?: string }).tool).toBe('recraft');
    expect((r as { id?: string }).id).toBe(id);
  });

  it('every allowed tool × every brief id round-trips cleanly', () => {
    for (const tool of ALLOWED_TOOLS) {
      for (const id of validIds) {
        const r = validateCompetitorFilename(`${tool}-${id}.svg`);
        expect(isRejection(r), `${tool}-${id}.svg should be valid`).toBe(false);
      }
    }
  });

  it('rejects a file with an unknown tool prefix', () => {
    const r = validateCompetitorFilename('my-cool-tool-logo-mark.svg');
    expect(isRejection(r)).toBe(true);
    expect((r as { reason?: string }).reason).toMatch(/known tool prefix/);
  });

  it('rejects a well-prefixed file whose brief id is not canonical', () => {
    const r = validateCompetitorFilename('illustrator-not-a-real-brief.svg');
    expect(isRejection(r)).toBe(true);
    expect((r as { reason?: string }).reason).toMatch(/Unknown prompt-id/);
  });

  it('rejects our OWN name — ours are generated inline, never dropped as a file', () => {
    const r = validateCompetitorFilename('kreathief-logo-mark.svg');
    expect(isRejection(r)).toBe(true);
    expect((r as { reason?: string }).reason).toMatch(/known tool prefix/);
  });

  it('rejects a tool prefix with no id segment', () => {
    const r = validateCompetitorFilename('linearity-.svg');
    expect(isRejection(r)).toBe(true);
    expect((r as { reason?: string }).reason).toMatch(/Missing prompt-id/);
  });

  it('NEGATIVE CONTROL: a versioned filename that looks valid is still rejected', () => {
    const r = validateCompetitorFilename('recraft-logo-mark.final.svg');
    expect(isRejection(r)).toBe(true);
  });
});

/**
 * Proves the opt-in "clean vector" export pass (Phase 1.2) works through the REAL
 * serializer: a bloated traced path loses redundant nodes but stays valid vector.
 */
describe('Clean-vector export pass (geometry/simplify via exportToSvg)', () => {
  const dirty =
    'M0 0 L10 0 L20 0 L30 0 L40 0 L50 0 L50 10 L50 20 L50 30 L50 40 L50 50 ' +
    'L40 50 L30 50 L20 50 L10 50 L0 50 L0 40 L0 30 L0 20 L0 10 L0 0 Z';

  const nodeFor = (clean: boolean): DesignNode =>
    ({
      id: 'trace',
      type: 'path',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      viewBox: '0 0 50 50',
      fill: '#111827',
      pathData: dirty,
      ...(clean ? { cleanVector: { decimals: 1 } } : {}),
    }) as DesignNode;

  it('reduces node count without breaking structure or editability', () => {
    const raw = analyzeSvg(exportToSvg([nodeFor(false)], false, 100, 100), 'dirty-raw');
    const clean = analyzeSvg(exportToSvg([nodeFor(true)], false, 100, 100), 'dirty-clean');

    expect(clean.maxAnchorsPerPath).toBeLessThan(raw.maxAnchorsPerPath);
    expect(clean.wellFormed).toBe(true);
    expect(clean.nanTokens).toBe(0);
    expect(clean.undefinedTokens).toBe(0);
    expect(clean.rasterImages).toBe(0);
    expect(clean.score).toBeGreaterThanOrEqual(85);
    console.log(`[vector-quality] clean pass: anchors ${raw.maxAnchorsPerPath} -> ${clean.maxAnchorsPerPath}`);
  });
});

/**
 * Phase 1.4 — editable <text> vs outline mode.
 *
 * A pro needs BOTH: text that survives as live, editable <text> (so they can retype
 * it) AND an "outline fonts" mode (so the file renders identically without the font
 * installed). This drives the real serializer for both modes and asserts each opens
 * cleanly (well-formed, no corruption), then writes a golden-file corpus so a human
 * can open them in Illustrator/Figma and confirm by eye.
 */
describe('Editable-text vs outline mode (Phase 1.4)', () => {
  const textNode = (): DesignNode =>
    ({
      id: 'word',
      type: 'text',
      name: 'Brand Wordmark',
      x: 20,
      y: 30,
      width: 160,
      height: 40,
      text: 'ACME',
      fontSize: 40,
      fontFamily: 'system-ui',
      fontWeight: '800',
      fill: '#0f172a',
      // Precomputed glyph outline in the node's local space (what the browser
      // convertTextToOutlines pipeline yields, parsed back via svgToDesignNodes).
      textOutlinePaths: [{ d: 'M0 40 L0 0 L40 0 L40 40 L30 40 L30 10 L10 10 L10 40 Z', fill: '#0f172a' }],
      textOutlineBox: { width: 40, height: 40 },
    }) as DesignNode;

  it('editable mode keeps a live <text> element (retypable)', () => {
    const svg = exportToSvg([textNode()], false, 200, 100);
    const m = analyzeSvg(svg, 'text-editable');
    expect(svg).toContain('<text');
    expect(m.editableText).toBeGreaterThanOrEqual(1);
    expect(m.wellFormed).toBe(true);
    expect(m.undefinedTokens).toBe(0);
  });

  it('outline mode replaces <text> with editable <path> geometry', () => {
    const svg = exportToSvg([textNode()], false, 200, 100, undefined, { outlineText: true });
    const m = analyzeSvg(svg, 'text-outline');
    expect(svg).not.toContain('<text');
    expect(svg).toContain('<path');
    expect(m.pathElements).toBeGreaterThanOrEqual(1);
    expect(m.editableText).toBe(0);
    expect(m.wellFormed).toBe(true);
    expect(m.nanTokens).toBe(0);
    expect(m.undefinedTokens).toBe(0);
  });

  it('outline mode falls back to <text> when no glyph outline is available (never drops glyphs)', () => {
    const node = textNode();
    delete (node as any).textOutlinePaths;
    const svg = exportToSvg([node], false, 200, 100, undefined, { outlineText: true });
    expect(svg).toContain('<text');
    expect(svg).toContain('ACME');
  });

  it('writes a golden-file corpus for both modes under verification/vector-quality/golden', () => {
    const goldenDir = join(OUT_DIR, 'golden');
    mkdirSync(goldenDir, { recursive: true });
    const editable = exportToSvg([textNode()], false, 200, 100);
    const outlined = exportToSvg([textNode()], false, 200, 100, undefined, { outlineText: true });
    writeFileSync(join(goldenDir, 'text-editable.svg'), editable, 'utf8');
    writeFileSync(join(goldenDir, 'text-outline.svg'), outlined, 'utf8');
    // Round-trip: reopen what we wrote and confirm it is still clean vector.
    expect(analyzeSvg(readFileSync(join(goldenDir, 'text-editable.svg'), 'utf8'), 'golden-editable').wellFormed).toBe(true);
    expect(analyzeSvg(readFileSync(join(goldenDir, 'text-outline.svg'), 'utf8'), 'golden-outline').wellFormed).toBe(true);
  });
});
