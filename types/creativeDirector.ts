export interface CreativeSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionLabel?: string;
  data?: Record<string, any>;
  confidence: number;
  timestamp: number;
}
