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
  private isDevelopment = true; // Defaulting to true for now for visibility

  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (this.isDevelopment) {
      console.log(`%c[Analytics] 📊 ${event}`, 'color: #00c4cc; font-weight: bold;', properties);
    }

    // This is where integration with a real provider like Plausible would go:
    // if (typeof window !== 'undefined' && (window as any).plausible) {
    //   (window as any).plausible(event, { props: properties });
    // }
  }

  trackExport(format: string, quality?: number) {
    this.track('export_design', { format, quality });
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
