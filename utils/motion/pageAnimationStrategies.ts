import { AnimationSettings } from '../../types';
import { Icons } from '../../constants';
import * as React from 'react';

/**
 * HINGE: Page Animation Strategy Registry
 *
 * Evidence of extension pressure:
 * The `MotionPanel.tsx` contained a hard-coded switch statement and an array
 * for 4 different page animations ('sleek', 'party', 'corporate', 'playful').
 * Any new animation preset would have required modifying the core MotionPanel UI
 * and logic.
 *
 * Interface Contract:
 * - Implementors must provide a unique `id`, `label`, `desc`, and `icon` (React node)
 *   for the UI panel representation.
 * - The `getSettings` function must accept a `staggerDelay` and return a valid
 *   `AnimationSettings` object which will be applied to all layers on a page.
 */
export interface PageAnimationStrategy {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  getSettings: (staggerDelay: number) => AnimationSettings;
}

export const pageAnimationStrategies = new Map<string, PageAnimationStrategy>();

export function registerPageAnimationStrategy(strategy: PageAnimationStrategy) {
  pageAnimationStrategies.set(strategy.id, strategy);
}

// Pre-register core strategies
registerPageAnimationStrategy({
  id: 'sleek',
  label: 'Sleek',
  icon: Icons.ArrowRight,
  desc: 'Smooth horizontal slides with staggered delays',
  getSettings: (staggerDelay) => ({
    type: 'slide',
    direction: 'right',
    duration: 0.8,
    delay: staggerDelay,
    easing: 'ease-out',
    iterationCount: 1,
  })
});

registerPageAnimationStrategy({
  id: 'party',
  label: 'Party',
  icon: Icons.Activity,
  desc: 'Bouncy, energetic pop-ins',
  getSettings: (staggerDelay) => ({
    type: 'bounce',
    duration: 0.6,
    delay: staggerDelay,
    easing: 'bounce',
    iterationCount: 1,
  })
});

registerPageAnimationStrategy({
  id: 'corporate',
  label: 'Corporate',
  icon: Icons.Eye,
  desc: 'Professional, subtle fade-ins',
  getSettings: (staggerDelay) => ({
    type: 'fade',
    duration: 1.2,
    delay: staggerDelay,
    easing: 'ease-in-out',
    iterationCount: 1,
  })
});

registerPageAnimationStrategy({
  id: 'playful',
  label: 'Playful',
  icon: Icons.RefreshCw,
  desc: 'Rotating and scaling in',
  getSettings: (staggerDelay) => ({
    type: 'rotate',
    duration: 0.9,
    delay: staggerDelay,
    easing: 'ease-out',
    iterationCount: 1,
  })
});
