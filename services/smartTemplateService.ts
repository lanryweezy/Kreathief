import { CanvasSize, BrandKit, AspectRatio, Project } from '../types';
import { STARTER_TEMPLATES, StarterTemplate } from '../data/templates';
import { getLevenshteinDistance } from '../utils/search';

export interface SmartTemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'image' | 'color' | 'number';
  defaultValue: string;
  description?: string;
}

export interface SmartTemplateSlot {
  id: string;
  layerId: string;
  layerName: string;
  variable: string;
  contentType: 'headline' | 'subtitle' | 'body' | 'cta' | 'image' | 'tag' | 'stat' | 'logo';
}

export interface SmartTemplateSuggestion {
  id: string;
  templateId: string;
  templateName: string;
  matchScore: number;
  reasoning: string;
  variables: Record<string, string>;
  purpose?: 'social_media' | 'marketing' | 'presentation' | 'personal' | 'ecommerce';
}

export interface TemplateContext {
  brandKit?: BrandKit;
  content?: {
    headline?: string;
    subtitle?: string;
    body?: string;
    cta?: string;
    tag?: string;
  };
  purpose?: string;
  aspectRatio?: AspectRatio;
  industry?: string;
  tone?: 'professional' | 'casual' | 'bold' | 'minimal' | 'luxury';
}

class SmartTemplateService {
  private templateSlots: Map<string, SmartTemplateSlot[]> = new Map();

  constructor() {
    this.initializeTemplateSlots();
  }

  private initializeTemplateSlots() {
    // Map template variables for dynamic content
    this.templateSlots.set('yt_thumbnail_premium', [
      { id: 'tag', layerId: 'yt_tag_text', layerName: 'Tag Text', variable: 'tag', contentType: 'tag' },
      { id: 'title', layerId: 'yt_main_title', layerName: 'Main Title', variable: 'title', contentType: 'headline' },
      { id: 'subtitle', layerId: 'yt_subtitle', layerName: 'Subtitle', variable: 'subtitle', contentType: 'subtitle' },
      { id: 'stat1', layerId: 'yt_stat_1_val', layerName: 'Stat 1 Value', variable: 'stat1', contentType: 'stat' },
      {
        id: 'stat1Label',
        layerId: 'yt_stat_1_label',
        layerName: 'Stat 1 Label',
        variable: 'stat1Label',
        contentType: 'body',
      },
    ]);

    this.templateSlots.set('cyberpunk_flyer_premium', [
      { id: 'kicker', layerId: 'cb_top_kicker', layerName: 'Top Kicker', variable: 'kicker', contentType: 'tag' },
      { id: 'title1', layerId: 'cb_title_1', layerName: 'Title Word 1', variable: 'title1', contentType: 'headline' },
      { id: 'title2', layerId: 'cb_title_2', layerName: 'Title Word 2', variable: 'title2', contentType: 'headline' },
      { id: 'body', layerId: 'cb_body_txt', layerName: 'Body Description', variable: 'body', contentType: 'body' },
      { id: 'cta', layerId: 'cb_ticket_txt', layerName: 'Ticket Text', variable: 'cta', contentType: 'cta' },
    ]);

    this.templateSlots.set('social_instagram_post', [
      { id: 'tag', layerId: 'ig_tag', layerName: 'Tag', variable: 'tag', contentType: 'tag' },
      { id: 'title', layerId: 'ig_title', layerName: 'Title', variable: 'title', contentType: 'headline' },
      { id: 'body', layerId: 'ig_body', layerName: 'Body', variable: 'body', contentType: 'body' },
      { id: 'cta', layerId: 'ig_cta_text', layerName: 'CTA Text', variable: 'cta', contentType: 'cta' },
      { id: 'handle', layerId: 'ig_handle', layerName: 'Handle', variable: 'handle', contentType: 'body' },
    ]);

    this.templateSlots.set('social_story', [
      { id: 'kicker', layerId: 'story_kicker', layerName: 'Kicker', variable: 'kicker', contentType: 'tag' },
      { id: 'title', layerId: 'story_title', layerName: 'Title', variable: 'title', contentType: 'headline' },
      { id: 'cta', layerId: 'story_cta', layerName: 'CTA Button', variable: 'cta', contentType: 'cta' },
    ]);
  }

  /**
   * Get template slots for dynamic content.
   * Falls back to deriving slots from the template's text layers, so every
   * template supports variables — not just the four with hand-mapped slots.
   */
  getTemplateSlots(templateId: string): SmartTemplateSlot[] {
    const preset = this.templateSlots.get(templateId);
    if (preset && preset.length > 0) {
      return preset;
    }
    const derived = this.deriveSlotsFromTemplate(templateId);
    if (derived.length > 0) {
      this.templateSlots.set(templateId, derived); // cache for future lookups
    }
    return derived;
  }

  /**
   * Heuristically derive content slots from a template's text layers:
   * layer-name keywords classify the slot, largest font size marks the headline.
   */
  private deriveSlotsFromTemplate(templateId: string): SmartTemplateSlot[] {
    const template = STARTER_TEMPLATES.find((t) => t.id === templateId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: any[] = template?.state?.artboards?.flatMap((a: any) => a.layers || []) || [];
    const textLayers = layers.filter((l) => l.type === 'text' && typeof l.text === 'string' && l.id);
    if (textLayers.length === 0) {
      return [];
    }

    const headlineId = [...textLayers].sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0]?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classify = (l: any): SmartTemplateSlot['contentType'] => {
      const name = `${l.name || ''}`.toLowerCase();
      if (/cta|button|ticket|shop|buy|link/.test(name)) {
        return 'cta';
      }
      if (/tag|kicker|label|badge|category/.test(name)) {
        return 'tag';
      }
      if (/sub|caption/.test(name)) {
        return 'subtitle';
      }
      if (/stat|number|price/.test(name)) {
        return 'stat';
      }
      if (l.id === headlineId || /title|headline|heading/.test(name)) {
        return 'headline';
      }
      return 'body';
    };

    const usedVariables = new Set<string>();
    return textLayers.map((l, i) => {
      const contentType = classify(l);
      let variable = contentType === 'headline' ? 'title' : contentType;
      if (usedVariables.has(variable)) {
        variable = `${variable}${i + 1}`;
      }
      usedVariables.add(variable);
      return {
        id: variable,
        layerId: l.id,
        layerName: l.name || `Text ${i + 1}`,
        variable,
        contentType,
      };
    });
  }

  /**
   * Suggest smart templates based on context
   */
  suggestTemplates(context: TemplateContext): SmartTemplateSuggestion[] {
    const suggestions: SmartTemplateSuggestion[] = [];

    for (const template of STARTER_TEMPLATES) {
      const score = this.calculateMatchScore(template, context);
      if (score > 30) {
        suggestions.push({
          id: `suggestion_${template.id}_${Date.now()}`,
          templateId: template.id,
          templateName: template.name,
          matchScore: score,
          reasoning: this.generateReasoning(template, context),
          variables: this.suggestVariables(template.id, context),
          purpose: this.inferPurpose(template) as any,
        });
      }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  /**
   * Calculate match score between template and context
   */
  private calculateMatchScore(template: StarterTemplate, context: TemplateContext): number {
    let score = 50; // Base score

    // Aspect ratio matching
    if (context.aspectRatio) {
      const templateRatio = this.getAspectRatioFromSize(template.size);
      if (templateRatio === context.aspectRatio) {
        score += 25;
      }
    }

    // Purpose matching
    const templatePurpose = this.inferPurpose(template);
    if (context.purpose && templatePurpose === context.purpose) {
      score += 20;
    }

    // Tone matching (based on color analysis)
    if (context.tone) {
      const templateTone = this.inferTone(template);
      if (templateTone === context.tone) {
        score += 15;
      }
    }

    // Industry context
    if (context.industry) {
      const templateIndustry = this.inferIndustry(template);
      if (templateIndustry.toLowerCase() === context.industry.toLowerCase()) {
        score += 10;
      }
    }

    // Brand colors matching
    if (context.brandKit && context.brandKit.colors.length > 0) {
      // Check if template uses similar color family
      const templateColors = this.extractTemplateColors(template);
      const brandColors = context.brandKit.colors;

      for (const tColor of templateColors.slice(0, 3)) {
        for (const bColor of brandColors) {
          if (this.colorsMatch(tColor, bColor)) {
            score += 5;
            break;
          }
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * Generate human-readable reasoning for suggestion
   */
  private generateReasoning(template: StarterTemplate, context: TemplateContext): string {
    const reasons: string[] = [];

    if (context.aspectRatio) {
      const ratio = this.getAspectRatioFromSize(template.size);
      if (ratio === context.aspectRatio) {
        reasons.push(`Perfect ${context.aspectRatio} aspect ratio`);
      }
    }

    if (context.purpose) {
      reasons.push(`Designed for ${context.purpose}`);
    }

    if (context.brandKit) {
      reasons.push('Matches your brand colors');
    }

    if (context.tone) {
      const templateTone = this.inferTone(template);
      if (templateTone === context.tone) {
        reasons.push(`${context.tone} visual style`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('High-quality professional design');
    }

    return reasons.join('. ');
  }

  /**
   * Suggest variable values based on context
   */
  suggestVariables(templateId: string, context: TemplateContext): Record<string, string> {
    const variables: Record<string, string> = {};
    const slots = this.getTemplateSlots(templateId);

    for (const slot of slots) {
      variables[slot.variable] = this.suggestValueForSlot(slot, context);
    }

    // Apply brand overrides if available
    if (context.brandKit && context.brandKit.colors.length > 0) {
      variables['brandColor'] = context.brandKit.colors[0];
      variables['brandSecondary'] = context.brandKit.colors[1] || context.brandKit.colors[0];
    }

    return variables;
  }

  /**
   * Suggest value for a specific slot
   */
  private suggestValueForSlot(slot: SmartTemplateSlot, context: TemplateContext): string {
    const content = context.content || {};

    // Use provided content first
    switch (slot.contentType) {
      case 'headline':
        return content.headline || this.generateDefaultHeadline(slot.variable, context);
      case 'subtitle':
        return content.subtitle || this.generateDefaultSubtitle(slot.variable, context);
      case 'body':
        return content.body || this.generateDefaultBody(slot.variable, context);
      case 'cta':
        return content.cta || this.generateDefaultCTA(context);
      case 'tag':
        return content.tag || this.generateDefaultTag(context);
      case 'stat':
        return this.generateDefaultStat(slot.variable);
      default:
        return this.generateDefaultGeneric(slot.variable, context);
    }
  }

  // Content generation helpers
  private generateDefaultHeadline(variable: string, context: TemplateContext): string {
    const headlines: Record<string, string[]> = {
      title: ['YOUR HEADLINE HERE', 'Make an Impact', 'Start Creating Today'],
      title1: ['YOUR BRAND', 'NEW LAUNCH', 'LIMITED'],
      title2: ['HEADLINE', 'EVENT', 'EXPERIENCE'],
      subtitle: ['IS IT WORTH THE HYPE?', 'FINALLY ARRIVES', 'YOU NEED THIS'],
    };
    return (headlines[variable] || headlines['title'])[Math.floor(Math.random() * 3)];
  }

  private generateDefaultSubtitle(variable: string, context: TemplateContext): string {
    return 'Your subtitle text goes here';
  }

  private generateDefaultBody(variable: string, context: TemplateContext): string {
    if (variable === 'body' || variable === 'stat1Label') {
      return 'Engaging description that captures attention';
    }
    return 'Learn more details about your content';
  }

  private generateDefaultCTA(context: TemplateContext): string {
    const ctas = ['Shop Now →', 'Learn More', 'Get Started →', 'Start Free Trial', 'Download Now', 'RSVP NOW'];
    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  private generateDefaultTag(context: TemplateContext): string {
    const tags = ['✦ NEW', '✦ EXCLUSIVE', '✦ LIMITED', '✦ HOT', '✦ TRENDING'];
    return tags[Math.floor(Math.random() * tags.length)];
  }

  private generateDefaultStat(variable: string): string {
    if (variable.includes('stat1')) {
      const stats = ['40%', '2X', '99%', '50+', '10K'];
      return stats[Math.floor(Math.random() * stats.length)];
    }
    return '0';
  }

  private generateDefaultGeneric(variable: string, context: TemplateContext): string {
    if (variable === 'handle') {
      return '@yourbrand';
    }
    if (variable === 'kicker') {
      return '// SYSTEM_READY';
    }
    return 'Placeholder';
  }

  // Helper methods
  private getAspectRatioFromSize(size: CanvasSize): AspectRatio {
    const ratio = size.width / size.height;
    if (ratio === 1) {
      return AspectRatio.SQUARE;
    }
    if (ratio > 1.7) {
      return AspectRatio.LANDSCAPE;
    }
    if (ratio < 0.7) {
      return AspectRatio.PORTRAIT;
    }
    if (ratio > 1.3) {
      return AspectRatio.WIDE;
    }
    return AspectRatio.TALL;
  }

  inferPurpose(template: StarterTemplate): string {
    const name = template.name.toLowerCase();
    const category = template.category.toLowerCase();

    if (name.includes('youtube') || name.includes('thumbnail') || name.includes('video')) {
      return 'social_media';
    }
    if (name.includes('instagram') || name.includes('story') || name.includes('reel') || name.includes('social')) {
      return 'social_media';
    }
    if (name.includes('flyer') || name.includes('event')) {
      return 'marketing';
    }
    if (name.includes('business') || name.includes('presentation')) {
      return 'presentation';
    }
    if (category === 'business') {
      return 'marketing';
    }
    return 'personal';
  }

  private inferTone(template: StarterTemplate): string {
    const name = template.name.toLowerCase();
    const state = template.state as any;
    const bgColor = state?.canvasBackgroundColor?.toLowerCase() || '';

    if (name.includes('cyberpunk') || name.includes('neon')) {
      return 'bold';
    }
    if (bgColor.includes('0f172a') || bgColor.includes('0a0a0a')) {
      return 'professional';
    }
    if (bgColor.includes('fff') || bgColor.includes('ffffff')) {
      return 'minimal';
    }
    if (name.includes('luxury') || name.includes('premium')) {
      return 'luxury';
    }
    return 'casual';
  }

  private inferIndustry(template: StarterTemplate): string {
    const name = template.name.toLowerCase();
    const category = template.category.toLowerCase();

    if (name.includes('tech') || name.includes('m4') || name.includes('laptop')) {
      return 'Technology';
    }
    if (name.includes('fashion') || name.includes('style')) {
      return 'Fashion';
    }
    if (name.includes('food') || name.includes('restaurant')) {
      return 'Food';
    }
    if (name.includes('event') || name.includes('party')) {
      return 'Events';
    }
    if (category === 'business') {
      return 'Business';
    }
    return 'General';
  }

  private extractTemplateColors(template: StarterTemplate): string[] {
    const state = template.state as any;
    const layers = state?.layers || [];
    const colors: string[] = [];

    for (const layer of layers.slice(0, 10)) {
      if (layer.color && typeof layer.color === 'string') {
        colors.push(layer.color);
      }
    }

    return [...new Set(colors)];
  }

  private colorsMatch(color1: string, color2: string): boolean {
    // Simple hex comparison with tolerance
    const normalize = (c: string) => c.toLowerCase().replace('#', '').slice(0, 6);
    return normalize(color1) === normalize(color2);
  }

  /**
   * Apply variables to template state
   */
  applyVariables(templateId: string, variables: Record<string, string>): Partial<Project> {
    const template = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return {};
    }

    const state = JSON.parse(JSON.stringify(template.state));
    const slots = this.getTemplateSlots(templateId);

    for (const slot of slots) {
      const value = variables[slot.variable];
      if (value) {
        // Find and update the layer
        const layerIndex = state.layers.findIndex((l: any) => l.id === slot.layerId);
        if (layerIndex !== -1) {
          if (slot.contentType === 'tag') {
            // Add emoji prefix for tags
            state.layers[layerIndex].text = value.includes('✦') ? value : `✦ ${value}`;
          } else {
            state.layers[layerIndex].text = value;
          }
        }
      }
    }

    // Apply brand colors if provided
    if (variables['brandColor']) {
      // Update accent colors in template
      for (const layer of state.layers) {
        if (layer.color && typeof layer.color === 'string') {
          // Only update template's purple accent color
          if (layer.color === '#7d2ae8' || layer.color === '#d946ef' || layer.color === '#22c55e') {
            layer.color = variables['brandColor'];
          }
        }
        if (layer.shadow?.color === '#7d2ae8') {
          layer.shadow.color = variables['brandColor'];
        }
      }
    }

    return state;
  }

  /**
   * Generate preview thumbnails for suggestions
   */
  generatePreviewData(templateId: string): { placeholder: string; layers: string[] } {
    const slots = this.getTemplateSlots(templateId);
    return {
      placeholder: templateId,
      layers: slots.map((s) => s.layerName),
    };
  }

  /**
   * Get all available templates with smart metadata
   */
  getAllTemplatesWithMetadata(): Array<
    StarterTemplate & {
      purpose: string;
      tone: string;
      industry: string;
      aspectRatio: AspectRatio;
      isPopular: boolean;
    }
  > {
    return STARTER_TEMPLATES.map((template) => ({
      ...template,
      purpose: this.inferPurpose(template),
      tone: this.inferTone(template),
      industry: this.inferIndustry(template),
      aspectRatio: this.getAspectRatioFromSize(template.size),
      isPopular: ['yt_thumbnail_premium', 'cyberpunk_flyer_premium', 'social_instagram_post'].includes(template.id),
    }));
  }

  /**
   * Search templates with natural language and typo tolerance
   */
  searchTemplates(query: string): StarterTemplate[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return STARTER_TEMPLATES;
    }

    const keywords = q.split(/\s+/).filter((k) => k.length > 0);

    return STARTER_TEMPLATES.filter((template) => {
      const searchable = `${template.name} ${template.category} ${template.description}`.toLowerCase();
      const words = searchable.split(/[\s\W]+/);

      return keywords.every((keyword) => {
        if (searchable.includes(keyword)) {
          return true;
        }
        // Allow 1 typo for words > 3 chars, 2 typos for words > 5 chars
        const maxDist = keyword.length > 5 ? 2 : keyword.length > 3 ? 1 : 0;
        return words.some(
          (word) =>
            Math.abs(word.length - keyword.length) <= maxDist && getLevenshteinDistance(word, keyword) <= maxDist
        );
      });
    });
  }

  /**
   * Get templates by aspect ratio
   */
  getTemplatesByAspectRatio(ratio: AspectRatio): StarterTemplate[] {
    return STARTER_TEMPLATES.filter((template) => {
      const templateRatio = this.getAspectRatioFromSize(template.size);
      return templateRatio === ratio;
    });
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): StarterTemplate[] {
    return STARTER_TEMPLATES.filter((t) => t.category === category);
  }
}

export const smartTemplateService = new SmartTemplateService();
