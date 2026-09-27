export interface CreativeBriefDimensions {
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'in';
}

export interface CreativeBriefBrand {
  colors?: string[];
  typography?: string[];
  logoAssetId?: string;
  visualReferences?: string[];
}

export interface CreativeBrief {
  objective: string;
  offer?: string;
  audience?: string;
  channel?: 'instagram' | 'whatsapp' | 'print' | 'web' | 'video' | 'unknown';
  dimensions?: CreativeBriefDimensions;
  brand?: CreativeBriefBrand;
  tone?: string[];
  callToAction?: string;
  deadline?: string;
  
  /**
   * Confidence tracking ledger.
   * Key matches the top-level property name.
   * Value is 0.0 to 1.0.
   * 1.0 = Explicitly provided by user
   * 0.8 = Inferred from brand kit or high-confidence context
   * 0.5 = System default / educated guess
   * 0.0 = Unknown / Missing
   */
  confidence: Record<string, number>;
}

export interface BriefClarificationQuestion {
  key: keyof CreativeBrief;
  question: string;
  options: string[];
  suggestedDefault?: string;
}

export interface IntentParsingResult {
  brief: CreativeBrief;
  needsClarification: boolean;
  questions: BriefClarificationQuestion[];
}
