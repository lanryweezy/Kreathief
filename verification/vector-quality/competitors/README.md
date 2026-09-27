# Competitor exports

Run the **exact same 5 prompts** through each tool, export **SVG**
(keep text as text where the tool allows; do NOT rasterize / flatten), then drop the files here named:

    <tool>-<prompt-id>.svg   e.g.  recraft-logo-mark.svg, illustrator-wordmark.svg

Tools for a credible claim: Recraft V3 Vector, Adobe Illustrator (Text-to-Vector), Linearity Curve, Figma AI.

## The prompts (paste verbatim, unchanged)

1. **Abstract logo mark** — id `logo-mark`

   > Minimal flat geometric logo mark of a single water droplet containing a leaf, two colors only, clean bezier curves, generous whitespace, no gradients, no text

2. **Wordmark** — id `wordmark`

   > Bold modern wordmark reading "KREATHIEF", tight kerning, geometric sans-serif, single solid color, transparent background

3. **App icon / badge** — id `icon-badge`

   > Circular app-icon badge with a lightning bolt cut out of the center, flat vector, one accent color on dark, crisp edges

4. **Three-icon set** — id `icon-set`

   > A matching set of three line icons: search, cart, and user profile. Consistent 2px stroke, rounded caps, single color, no fills

5. **Full logo lockup** — id `brand-lockup`

   > Horizontal brand lockup: a simple mountain-peak icon to the left of the wordmark "SUMMIT", aligned baseline, two colors, editable text, vector

Then re-run:

```bash
corepack pnpm exec vitest run tests/unit/vectorOutputQuality.benchmark.test.ts
```

The test scores every file here with the SAME analyzer as our own exports and writes
`head-to-head.md` + `competitors-report.json`. A green ranking is evidence; our own
score without rivals next to it is not.
