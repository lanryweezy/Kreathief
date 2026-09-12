// Smart Placement Zone Presets
// Calibrated placement archetypes matching industry standards (Printful, Smartmockups, Placeit)

import { MockupPlacement } from './enhancedMockupsLibrary';

export type PlacementZoneId =
  | 'left_chest'
  | 'center_hero'
  | 'oversized_streetwear'
  | 'full_device'
  | 'all_over_pattern'
  | 'front_pocket'
  | 'sleeve_patch'
  | 'back_center';

export interface PlacementPreset {
  id: PlacementZoneId;
  name: string;
  icon: string;
  description: string;
  placement: MockupPlacement;
}

/**
 * Standard placement zone presets calibrated for each archetype.
 * These match the industry standards from Printful/Smartmockups/Placeit.
 */
export const PLACEMENT_PRESETS: PlacementPreset[] = [
  {
    id: 'left_chest',
    name: 'Left Chest',
    icon: '◧',
    description: 'Classic left chest pocket logo placement (10-12% width)',
    placement: {
      top: 28,
      left: 28,
      width: 14,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
  {
    id: 'center_hero',
    name: 'Center Hero',
    icon: '⬛',
    description: 'Centered chest print — classic POD placement (35-42% width)',
    placement: {
      top: 24,
      left: 30,
      width: 40,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
  {
    id: 'oversized_streetwear',
    name: 'Oversized Drop',
    icon: '▬',
    description: 'Oversized high-chest streetwear print (60-70% width)',
    placement: {
      top: 18,
      left: 18,
      width: 64,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
  {
    id: 'full_device',
    name: 'Full Device Fill',
    icon: '▣',
    description: 'Fill the entire device screen (phones, tablets, laptops)',
    placement: {
      top: 10,
      left: 12,
      width: 76,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 1,
      blendMode: 'source-over',
    },
  },
  {
    id: 'all_over_pattern',
    name: 'All-Over Pattern',
    icon: '⣿',
    description: 'Seamless tile repeat across the entire product',
    placement: {
      top: 0,
      left: 0,
      width: 100,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.85,
      blendMode: 'multiply',
    },
  },
  {
    id: 'front_pocket',
    name: 'Front Pocket',
    icon: '◫',
    description: 'Small front pocket logo/label placement (8-10% width)',
    placement: {
      top: 58,
      left: 30,
      width: 12,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
  {
    id: 'sleeve_patch',
    name: 'Sleeve Patch',
    icon: '⬡',
    description: 'Arm sleeve embroidered patch placement',
    placement: {
      top: 35,
      left: 5,
      width: 18,
      rotate: -10,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
  {
    id: 'back_center',
    name: 'Back Center',
    icon: '▥',
    description: 'Full back center print placement',
    placement: {
      top: 20,
      left: 22,
      width: 56,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      opacity: 0.9,
      blendMode: 'multiply',
    },
  },
];

/**
 * Get a specific placement preset by ID
 */
export function getPlacementPreset(id: PlacementZoneId): PlacementPreset | undefined {
  return PLACEMENT_PRESETS.find((p) => p.id === id);
}

/**
 * Get presets valid for a given list of zone IDs
 */
export function getPresetsForZones(zoneIds: string[]): PlacementPreset[] {
  return PLACEMENT_PRESETS.filter((p) => zoneIds.includes(p.id));
}
