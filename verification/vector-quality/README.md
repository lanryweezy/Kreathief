# Vector output-quality evidence

This folder is **generated** by `tests/unit/vectorOutputQuality.benchmark.test.ts`.
It exists to answer one question with inspectable proof rather than marketing:

> When a professional opens a file Kreathief exports, is it a *real, editable
> vector* — clean paths, sensible node counts, separated colors, live text — or
> is it a raster image pretending to be a vector?

## What's here

| File | What it is |
| --- | --- |
| `*.svg` | Sample exports (logo mark, wordmark, boolean badge, icon set) produced by the **real** export path (`services/exportService.ts`). Open them at full resolution / import into Illustrator, Figma, Affinity. |
| `golden/` | Two text-export modes as a **golden-file corpus**: `text-editable.svg` keeps live `<text>`, `text-outline.svg` has fonts converted to `<path>` outlines (no font needed). Open both to confirm they render identically. |
| `report.json` | Machine-readable metrics per sample: `score`, `vectorPrimitives`, `editableText`, `distinctFills`, `rasterImages`, `hiddenRasterInClip`, `maxAnchorsPerPath`, `curveRatio`. |
| `competitors/` | *(optional)* Drop rival exports here as `.svg` and the **same analyzer** scores them — see below. |

## Capabilities this harness proves (Phase 1)

- **Clean-vector export pass** (`geometry/simplify.ts`, opt-in per node via
  `node.cleanVector`): reduces anchor count + coordinate precision without changing
  the visible shape. The `Clean-vector export pass` test shows a bloated traced path
  drop node count through the *real* serializer while staying well-formed vector.
- **Editable-text vs outline mode** (`exportToSvg(..., { outlineText })` and the
  `exportToSvgWithTextOutlines` browser bridge): the same wordmark exports as either
  live `<text>` or `<path>` outlines, and outline mode falls back to `<text>` if a
  glyph can't be converted — never dropping text.
- **A second SVG-gen path that can't dead-end** (`config/imageModels.ts`
  `capabilities.rasterToVector` + `getVectorTraceFallbackModel`, wired through
  `imageGenService`): if the native-SVG model (Recraft) is down, generation routes to
  the best *trace-friendly raster model* and promotes its output to vector via
  ImageTracer, parsed back with the pure `utils/svgIngest.ts` kernel. The routing is
  a data decision with a **negative control** (photographic models must NOT be
  trace-routed) in `tests/unit/imageModelVectorRouting.test.ts`.

## How to regenerate

```bash
corepack pnpm exec vitest run tests/unit/vectorOutputQuality.benchmark.test.ts
```

## Scoring rubric (`services/vectorQuality/metrics.ts`)

The score starts at 100 and is docked for the things that actually matter:

- **−45** any `<image>` smuggled behind a clip-path (a "fake vector")
- **−50** any `NaN` coordinate, **−25** any `undefined` leaking into attributes
- **−25** malformed / multi-root SVG, **−8** missing `viewBox`
- **−15** pathological anchor density (`maxAnchorsPerPath > 4000`, i.e. a traced bitmap)
- **−10** essentially no bezier curvature on a dense path (straight-line salad)
- **−30** nothing editable at all

## Head-to-head (grading ourselves in public)

Put a competitor's exported `.svg` into `competitors/` (e.g. a logo exported from
Recraft / Illustrator / Figma / Affinity / Linearity) and re-run the test. It
scores every file with identical rules and prints a comparison table. A claim of
"best" only means something when measured on the same yardstick as the
alternatives — so the harness is built to be pointed *at us* exactly as hard as
at them.

## A note on honesty

`raster-trap` is a **negative control**: a shape filled with a raster photo. The
suite *requires* it to score poorly. If it ever scored high, the benchmark would
be a rubber stamp — so a green run means the analyzer genuinely discriminates
real vector from fake.
