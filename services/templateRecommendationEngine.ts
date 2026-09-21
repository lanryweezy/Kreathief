/**
 * Template Recommendation Engine
 * Tracks user behavior and recommends templates using collaborative filtering
 * and content-based matching. Like Netflix for design templates.
 */

import { log } from '../utils/log';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateInteraction {
  templateId: string;
  action: 'view' | 'use' | 'favorite' | 'share' | 'skip';
  timestamp: number;
  context?: {
    styleId?: string;
    industry?: string;
    format?: string;
  };
}

export interface TemplateRecommendation {
  templateId: string;
  score: number;
  reason: string;
  source: 'collaborative' | 'content' | 'trending' | 'personal';
}

export interface UserPreferences {
  favoriteStyles: string[]; // style IDs
  favoriteIndustries: string[];
  favoriteFormats: string[]; // instagram, story, presentation, etc.
  colorPreferences: string[]; // hex colors
  fontPreferences: string[]; // font family names
  interactionHistory: TemplateInteraction[];
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kreathief_template_interactions';
const PREFERENCES_KEY = 'kreathief_user_preferences';

// ─── Interaction Tracking ────────────────────────────────────────────────────

function getInteractions(): TemplateInteraction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveInteractions(interactions: TemplateInteraction[]): void {
  try {
    // Keep last 500 interactions
    const trimmed = interactions.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full, clear old data
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Track a user interaction with a template.
 */
export function trackInteraction(interaction: TemplateInteraction): void {
  const interactions = getInteractions();
  interactions.push({
    ...interaction,
    timestamp: interaction.timestamp || Date.now(),
  });
  saveInteractions(interactions);
  log.debug('[TemplateRec] Tracked interaction', { templateId: interaction.templateId, action: interaction.action });
}

/**
 * Get user preferences derived from interaction history.
 */
export function getUserPreferences(): UserPreferences {
  const interactions = getInteractions();

  // Count style preferences
  const styleCounts: Record<string, number> = {};
  const industryCounts: Record<string, number> = {};
  const formatCounts: Record<string, number> = {};

  for (const interaction of interactions) {
    const weight = interaction.action === 'use' ? 3 : interaction.action === 'favorite' ? 5 : interaction.action === 'share' ? 4 : 1;

    if (interaction.context?.styleId) {
      styleCounts[interaction.context.styleId] = (styleCounts[interaction.context.styleId] || 0) + weight;
    }
    if (interaction.context?.industry) {
      industryCounts[interaction.context.industry] = (industryCounts[interaction.context.industry] || 0) + weight;
    }
    if (interaction.context?.format) {
      formatCounts[interaction.context.format] = (formatCounts[interaction.context.format] || 0) + weight;
    }
  }

  // Get top preferences
  const sortByCount = (counts: Record<string, number>) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key]) => key);

  return {
    favoriteStyles: sortByCount(styleCounts),
    favoriteIndustries: sortByCount(industryCounts),
    favoriteFormats: sortByCount(formatCounts),
    colorPreferences: [], // Would need color extraction from templates
    fontPreferences: [], // Would need font extraction from templates
    interactionHistory: interactions,
  };
}

// ─── Template Metadata ───────────────────────────────────────────────────────

interface TemplateMeta {
  id: string;
  name: string;
  styleId: string;
  industry: string;
  format: string;
  tags: string[];
  popularity: number; // 0-100, based on global usage
  colors: string[];
  createdAt: number;
}

// In-memory template store (populated from the app's template data)
const templateStore = new Map<string, TemplateMeta>();

/**
 * Register a template in the recommendation engine.
 */
export function registerTemplate(template: TemplateMeta): void {
  templateStore.set(template.id, template);
}

/**
 * Register multiple templates at once.
 */
export function registerTemplates(templates: TemplateMeta[]): void {
  for (const t of templates) {
    templateStore.set(t.id, t);
  }
}

// ─── Recommendation Algorithms ───────────────────────────────────────────────

/**
 * Content-based filtering: recommend templates similar to what the user has used.
 */
function contentBasedRecommendations(preferences: UserPreferences, count: number): TemplateRecommendation[] {
  const results: TemplateRecommendation[] = [];

  for (const [id, template] of templateStore) {
    // Skip already used templates
    const wasUsed = preferences.interactionHistory.some(
      i => i.templateId === id && (i.action === 'use' || i.action === 'skip')
    );
    if (wasUsed) continue;

    let score = 0;
    const reasons: string[] = [];

    // Style match
    if (preferences.favoriteStyles.includes(template.styleId)) {
      score += 30;
      reasons.push(`matches your ${template.styleId} style preference`);
    }

    // Industry match
    if (preferences.favoriteIndustries.includes(template.industry)) {
      score += 20;
      reasons.push(`fits your ${template.industry} industry`);
    }

    // Format match
    if (preferences.favoriteFormats.includes(template.format)) {
      score += 15;
      reasons.push(`matches your preferred ${template.format} format`);
    }

    // Popularity bonus
    score += template.popularity * 0.2;

    // Recency bonus (newer templates get a small boost)
    const ageInDays = (Date.now() - template.createdAt) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score += 5;
    if (ageInDays < 30) score += 2;

    if (score > 0) {
      results.push({
        templateId: id,
        score,
        reason: reasons.length > 0 ? reasons[0] : 'popular template',
        source: 'content',
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, count);
}

/**
 * Trending templates: popular templates the user hasn't seen yet.
 */
function trendingRecommendations(preferences: UserPreferences, count: number): TemplateRecommendation[] {
  const seenIds = new Set(preferences.interactionHistory.map(i => i.templateId));

  const results: TemplateRecommendation[] = [];
  for (const [id, template] of templateStore) {
    if (seenIds.has(id)) continue;
    results.push({
      templateId: id,
      score: template.popularity,
      reason: 'trending now',
      source: 'trending',
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, count);
}

/**
 * Personal recommendations: based on what similar users liked.
 * This is a simplified collaborative filtering — in production, you'd use
 * user-user or item-item similarity with a proper ML model.
 */
function collaborativeRecommendations(preferences: UserPreferences, count: number): TemplateRecommendation[] {
  // Simplified: find templates that share tags with user's favorites
  const userTags = new Set<string>();
  for (const interaction of preferences.interactionHistory) {
    if (interaction.action === 'use' || interaction.action === 'favorite') {
      const template = templateStore.get(interaction.templateId);
      if (template) {
        template.tags.forEach(t => userTags.add(t));
      }
    }
  }

  const seenIds = new Set(preferences.interactionHistory.map(i => i.templateId));
  const results: TemplateRecommendation[] = [];

  for (const [id, template] of templateStore) {
    if (seenIds.has(id)) continue;

    let tagOverlap = 0;
    for (const tag of template.tags) {
      if (userTags.has(tag)) tagOverlap++;
    }

    if (tagOverlap > 0) {
      results.push({
        templateId: id,
        score: tagOverlap * 15,
        reason: `similar to designs you've used`,
        source: 'collaborative',
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, count);
}

// ─── Main Recommendation Function ────────────────────────────────────────────

/**
 * Get personalized template recommendations.
 * Combines content-based, trending, and collaborative filtering.
 */
export function getRecommendations(count: number = 6): TemplateRecommendation[] {
  const preferences = getUserPreferences();

  // If no history, return trending
  if (preferences.interactionHistory.length === 0) {
    return trendingRecommendations(preferences, count);
  }

  // Mix recommendation sources
  const content = contentBasedRecommendations(preferences, Math.ceil(count * 0.5));
  const trending = trendingRecommendations(preferences, Math.ceil(count * 0.25));
  const collaborative = collaborativeRecommendations(preferences, Math.ceil(count * 0.25));

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: TemplateRecommendation[] = [];

  for (const rec of [...content, ...collaborative, ...trending]) {
    if (!seen.has(rec.templateId)) {
      seen.add(rec.templateId);
      merged.push(rec);
    }
  }

  return merged.slice(0, count);
}

/**
 * Get recommendations filtered by a specific style.
 */
export function getRecommendationsByStyle(styleId: string, count: number = 3): TemplateRecommendation[] {
  const results: TemplateRecommendation[] = [];

  for (const [id, template] of templateStore) {
    if (template.styleId === styleId) {
      results.push({
        templateId: id,
        score: template.popularity + (template.styleId === styleId ? 50 : 0),
        reason: `${styleId} style`,
        source: 'content',
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, count);
}

/**
 * Clear all interaction history (for privacy/reset).
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PREFERENCES_KEY);
}
