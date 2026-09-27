/**
 * Naming and provenance contract for the competitive head-to-head folder.
 * ------------------------------------------------------------------
 * Every SVG in verification/vector-quality/competitors/ must follow
 *   `<tool>-<prompt-id>.svg`
 * so the scoring table can derive correct provenance from the filename.
 *
 * Files that don't match the pattern are REJECTED (not scored), preventing a
 * stray SVG from silently polluting the head-to-head comparison. This module
 * is pure — no I/O — so it can be tested with zero fixtures.
 */

import { HEAD_TO_HEAD_PROMPTS } from './prompts';

/**
 * Tools allowed in competitors/.  'kreathief' is excluded because ours are
 * generated inline by the benchmark and should not be dropped as files (would
 * double-count or allow a hand-picked cherry-pick).
 */
export const ALLOWED_TOOLS = ['recraft', 'illustrator', 'linearity', 'figma'] as const;
export type CompetitorTool = (typeof ALLOWED_TOOLS)[number];

/** Valid brief IDs derived from the canonical HEAD_TO_HEAD_PROMPTS. */
const VALID_IDS = new Set(HEAD_TO_HEAD_PROMPTS.map((p) => p.id));

export interface NamingMatch {
  tool: CompetitorTool;
  id: string;
}

export interface NamingRejection {
  file: string;
  reason: string;
}

/**
 * Parses a competitor filename against the naming contract.
 * Returns a NamingMatch on success, or a NamingRejection with a human-readable reason.
 */
export function validateCompetitorFilename(filename: string): NamingMatch | NamingRejection {
  const stem = filename.replace(/\.svg$/i, '');

  // Find the tool prefix (longest matching prefix + hyphen, so new tools with
  // hyphens in their names won't accidentally match an earlier prefix).
  let matchedTool: CompetitorTool | null = null;
  for (const tool of ALLOWED_TOOLS) {
    if (stem.startsWith(tool + '-')) {
      matchedTool = tool;
      break;
    }
  }
  if (!matchedTool) {
    return {
      file: filename,
      reason: `Filename must start with a known tool prefix (${ALLOWED_TOOLS.join(', ')}). Got "${stem}".`,
    };
  }

  const id = stem.slice(matchedTool.length + 1); // skip "tool-"
  if (!id) {
    return { file: filename, reason: 'Missing prompt-id segment after the tool prefix.' };
  }
  if (!VALID_IDS.has(id)) {
    return {
      file: filename,
      reason: `Unknown prompt-id "${id}". Must be one of: ${[...VALID_IDS].join(', ')}.`,
    };
  }

  return { tool: matchedTool, id };
}

/** Returns true if the rejection type (discriminant helper). */
export function isRejection(r: NamingMatch | NamingRejection): r is NamingRejection {
  return 'reason' in r;
}
