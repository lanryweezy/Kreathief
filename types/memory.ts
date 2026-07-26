export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface DesignStyle {
  minimalism: number;
  boldness: number;
  complexity: number;
  colorfulness: number;
  symmetry: number;
}

export interface UserPreferences {
  fonts: string[];
  colors: string[];
  layouts: string[];
  spacing: {
    preferredGap: number;
    consistentSpacing: boolean;
    usesGrid: boolean;
  };
  alignment: {
    defaultAlign: string;
    usesSnap: boolean;
    usesGrid: boolean;
  };
  toolFrequency: Record<string, number>;
  aiAcceptanceRate: number;
  avgSessionDuration: number;
  skillLevel: SkillLevel;
  designStyle: DesignStyle;
}

export interface DesignPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  confidence: number;
  examples: string[];
}

export interface BrandGuideline {
  id: string;
  name: string;
  projectId?: string;
  colors: string[];
  fonts: string[];
  spacing?: number[];
  logoUrl?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any;
}

export interface DesignAction {
  id: string;
  type: string;
  data: Record<string, any>;
  context?: Record<string, any>;
  timestamp: number;
}
