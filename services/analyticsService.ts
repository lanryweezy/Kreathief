import { log } from '../utils/log';
import { config } from '../config';

export type AnalyticsEvent = 
  | 'export_design'
  | 'generate_image'
  | 'apply_template'
  | 'undo'
  | 'redo'
  | 'add_layer'
  | 'delete_layer'
  | 'open_comment_mode'
  | 'share_design'
  | 'feedback_submitted';

class AnalyticsService {
  private isProduction = config.app.isProduction;

  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    // Development logging
    if (config.app.isDevelopment) {
      log.info('[Analytics] Event tracked', { event, properties });
    }

    // Production analytics integration
    if (this.isProduction && typeof window !== 'undefined') {
      // Plausible Analytics (privacy-friendly, GDPR compliant)
      if ((window as any).plausible) {
        (window as any).plausible(event, { props: properties });
      }
      
      // Google Analytics (if using)
      if ((window as any).gtag) {
        (window as any).gtag('event', event, properties);
      }
    }
  }

  trackExport(format: string, quality?: number, properties?: Record<string, any>) {
    this.track('export_design', { format, quality, ...properties });
  }

  trackGeneration(prompt: string, mode: string) {
    this.track('generate_image', { prompt_length: prompt.length, mode });
  }

  trackTemplateApply(templateId: string, templateName: string) {
    this.track('apply_template', { templateId, templateName });
  }

  trackAction(action: 'undo' | 'redo') {
    this.track(action);
  }
}

export const analyticsService = new AnalyticsService();
