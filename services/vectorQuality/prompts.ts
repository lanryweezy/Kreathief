/**
 * Canonical head-to-head generation briefs (Phase 1.5).
 *
 * The whole point of the competitive harness is that it is NOT grading our own
 * homework. These five prompts are the fixed briefs to run through every tool —
 * Kreathief (Recraft V3 Vector), Recraft V3 direct, Illustrator Text-to-Vector,
 * Linearity, Figma AI — then export as SVG and drop into
 * `verification/vector-quality/competitors/`. The SAME analyzer scores all of them
 * on identical rules, so "are we top-3?" becomes a measurement, not an adjective.
 *
 * They are kept here (not inline in the test) so the competitors/README template is
 * generated from the same source and can never drift from the scoring code.
 */

export interface HeadToHeadPrompt {
  /** Short id used as the filename stem: `<tool>-<id>.svg`. */
  id: string;
  label: string;
  /** The literal prompt to paste into every tool, unchanged. */
  prompt: string;
}

export const HEAD_TO_HEAD_PROMPTS: HeadToHeadPrompt[] = [
  {
    id: 'logo-mark',
    label: 'Abstract logo mark',
    prompt:
      'Minimal flat geometric logo mark of a single water droplet containing a leaf, two colors only, clean bezier curves, generous whitespace, no gradients, no text',
  },
  {
    id: 'wordmark',
    label: 'Wordmark',
    prompt: 'Bold modern wordmark reading "KREATHIEF", tight kerning, geometric sans-serif, single solid color, transparent background',
  },
  {
    id: 'icon-badge',
    label: 'App icon / badge',
    prompt: 'Circular app-icon badge with a lightning bolt cut out of the center, flat vector, one accent color on dark, crisp edges',
  },
  {
    id: 'icon-set',
    label: 'Three-icon set',
    prompt: 'A matching set of three line icons: search, cart, and user profile. Consistent 2px stroke, rounded caps, single color, no fills',
  },
  {
    id: 'brand-lockup',
    label: 'Full logo lockup',
    prompt: 'Horizontal brand lockup: a simple mountain-peak icon to the left of the wordmark "SUMMIT", aligned baseline, two colors, editable text, vector',
  },
];
