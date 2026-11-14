export interface PlanConfig {
  id: 'free' | 'pro' | 'team';
  name: string;
  badge?: string;
  description: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  monthlyPriceNgn: number;
  annualPriceNgn: number;
  paystackMonthlyKobo: number;
  paystackAnnualKobo: number;
  monthlyCredits: number;
  maxProjects: number | 'Unlimited';
  storageGb: number;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

export const PLATFORM_METRICS = {
  activeCreatorsCount: 10000,
  activeCreatorsLabel: '10,000+',
  generationsRunCount: 2500000,
  projectsSavedCount: 850000,
  workflowTimeSavedPercent: 73,
} as const;

export const PLANS: Record<'free' | 'pro' | 'team', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Starter',
    description: 'Essential vector and generative tools for independent exploration.',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    paystackMonthlyKobo: 0,
    paystackAnnualKobo: 0,
    monthlyCredits: 50,
    maxProjects: 10,
    storageGb: 2.0,
    features: [
      '50 AI generations per month',
      'Full precision vector & layer editor',
      'Up to 10 active canvas projects',
      'Standard web export (PNG, JPG, WebP)',
      '2 GB cloud asset storage',
    ],
    ctaText: 'Start Free',
    popular: false,
  },
  pro: {
    id: 'pro',
    name: 'Studio Pro',
    badge: 'Most Popular',
    description: 'Full creative velocity for professional designers, freelancers, and studios.',
    monthlyPriceUsd: 19,
    annualPriceUsd: 15,
    monthlyPriceNgn: 28500,
    annualPriceNgn: 23750,
    paystackMonthlyKobo: 2850000,
    paystackAnnualKobo: 28500000,
    monthlyCredits: 500,
    maxProjects: 'Unlimited',
    storageGb: 20.0,
    features: [
      '500 fast-queue AI generations/mo + unlimited standard',
      'Magic Erase, Inpainting & Background Removal',
      'High-res Vector & Print Export (SVG, PDF/X, CMYK, 4K)',
      'Unlimited canvas documents & 20 GB cloud sync',
      'Custom Brand Kits, Color Palettes & Typography Sync',
      'Full commercial license & zero watermarks',
      'Priority GPU rendering queue',
    ],
    ctaText: 'Unlock Studio Pro',
    popular: true,
  },
  team: {
    id: 'team',
    name: 'Team Studio',
    description: 'Multiplayer collaboration and shared brand systems for creative teams.',
    monthlyPriceUsd: 49,
    annualPriceUsd: 39,
    monthlyPriceNgn: 73500,
    annualPriceNgn: 58500,
    paystackMonthlyKobo: 7350000,
    paystackAnnualKobo: 70200000,
    monthlyCredits: 2000,
    maxProjects: 'Unlimited',
    storageGb: 100.0,
    features: [
      'Everything in Studio Pro included',
      'Multiplayer real-time canvas collaboration',
      'Shared workspace asset & component libraries',
      'Team role permissions & version history rollback',
      'Custom organization font server uploads',
      'Dedicated API endpoint & priority support',
    ],
    ctaText: 'Start Team Studio',
    popular: false,
  },
};

export const PLAN_LIST: PlanConfig[] = [PLANS.free, PLANS.pro, PLANS.team];
