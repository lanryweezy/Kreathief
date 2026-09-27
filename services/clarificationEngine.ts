import { 
  CreativeBrief, 
  IntentParsingResult, 
  BriefClarificationQuestion,
  CreativeBriefDimensions
} from '../types/brief';

export type ClarificationKey =
  | 'subject'
  | 'format'
  | 'tone'
  | 'audience'
  | 'callToAction'
  | 'channel'
  | 'contradiction'
  | 'improvementScope'
  | 'exactContent'
  | string;

export interface ClarificationContext {
  hasExistingDesign: boolean;
  canvasSize?: { width: number; height: number };
  hasBrandKit?: boolean;
  designWeaknesses?: string[];
  sessionAnswers?: Record<string, string>;
}

export interface DesignBrief {
  subject?: string;
  format?: string;
  tone?: string[];
  audience?: string;
  callToAction?: string;
  channel?: string;
  confidence?: Record<string, number>;
  [key: string]: any;
}

export interface ClarificationQuestion {
  requirementKey: ClarificationKey;
  question: string;
  options: string[];
  suggestedDefault?: string;
  allowFreeText?: boolean;
}

export interface Assumption {
  id: string;
  category: string;
  statement: string;
  source: 'user_explicit' | 'system_default' | 'inferred';
  reversible: boolean;
  userConfirmed: boolean;
}

export interface ClarificationResult {
  status: 'ready' | 'ready_with_assumptions' | 'needs_questions';
  executionMode: 'direct' | 'require_clarification' | 'ask_targeted_questions';
  nextAction?: 'generate' | 'clarify';
  confidence: number;
  brief: DesignBrief;
  questions: ClarificationQuestion[];
  assumptions: Assumption[];
  missingRequirements: Array<{ key: string; importance: 'blocking' | 'important' | 'nice_to_have' }>;
  enrichedIntent: string;
}

/**
 * Maps geometry audit findings into human-readable weakness phrases, deduplicated.
 */
export function geometryIssuesToWeaknesses(issues: string[]): string[] {
  const ISSUE_MAP: Record<string, string> = {
    out_of_bounds: 'elements hanging off the edge',
    text_overlap: 'colliding text blocks',
    low_contrast: 'low text contrast',
    misaligned: 'misaligned elements',
  };

  const results: string[] = [];
  for (const issue of issues) {
    const mapped = ISSUE_MAP[issue];
    if (mapped && !results.includes(mapped)) {
      results.push(mapped);
    }
  }
  return results;
}

/**
 * Returns plain-text summaries of assumption provenance and confirmation status.
 */
export function describeAssumptions(assumptions: Assumption[]): string[] {
  return assumptions.map(
    (a) =>
      `[${a.category}] ${a.statement} (${a.userConfirmed ? 'confirmed' : 'not confirmed, needs confirmation'}, source: ${a.source})`
  );
}

/**
 * Generates an enriched multi-agent execution prompt from a user prompt and resolved brief.
 */
export function briefToPrompt(prompt: string, brief: DesignBrief): string {
  const parts = [
    `Design brief (from user request): ${prompt}`,
    `Subject: ${brief.subject || 'Not specified'}`,
    `Format: ${brief.format || 'Standard'}`,
    `Audience: ${brief.audience || 'General'}`,
  ];
  if (brief.tone && brief.tone.length > 0) {
    parts.push(`Tone: ${brief.tone.join(', ')}`);
  }
  if (brief.callToAction) {
    parts.push(`Call to Action: ${brief.callToAction}`);
  }
  return parts.join('\n');
}

/**
 * Core Assessment Kernel: Evaluates a design request against context and intent.
 */
export function assessDesignRequest(
  prompt: string,
  context: ClarificationContext = { hasExistingDesign: false }
): ClarificationResult {
  const raw = (prompt || '').trim();
  const lower = raw.toLowerCase();
  const answers = context.sessionAnswers || {};

  const brief: DesignBrief = {
    subject: answers['subject'] || undefined,
    format: answers['format'] || undefined,
    audience: answers['audience'] || undefined,
    callToAction: answers['callToAction'] || undefined,
    confidence: {},
  };

  const questions: ClarificationQuestion[] = [];
  const assumptions: Assumption[] = [];
  const missingRequirements: Array<{ key: string; importance: 'blocking' | 'important' | 'nice_to_have' }> = [];

  // Format handling from canvas context
  if (context.canvasSize) {
    const fmt = `${context.canvasSize.width}×${context.canvasSize.height}`;
    brief.format = fmt;
    assumptions.push({
      id: 'a_format',
      category: 'Format',
      statement: `Dimensions set to active canvas size ${fmt}`,
      source: 'system_default',
      reversible: true,
      userConfirmed: false,
    });
  }

  // 1. Existing Design with vague refinement (e.g. "make it better")
  if (context.hasExistingDesign && /^(make it better|improve it|fix it|polish this|make this look good)\b/i.test(lower)) {
    if (!answers['improvementScope']) {
      const weaknesses = context.designWeaknesses || [];
      const notice = weaknesses.length > 0 ? `I noticed: ${weaknesses.join(', ')}. ` : '';
      questions.push({
        requirementKey: 'improvementScope',
        question: `${notice}What would you like to improve first?`,
        options: ['All of them, worst first', 'Just alignment', 'Just contrast and colors'],
        allowFreeText: true,
      });
      return {
        status: 'needs_questions',
        executionMode: 'ask_targeted_questions',
        confidence: 0.7,
        brief,
        questions,
        assumptions,
        missingRequirements: [{ key: 'improvementScope', importance: 'important' }],
        enrichedIntent: `Improve active design: ${raw}`,
      };
    }
  }

  // 2. Contradiction Detection (e.g. "playful but corporate")
  const hasContradiction = /\b(playful but corporate|corporate but playful|cheap but luxury|minimal but dense)\b/i.test(lower);
  if (hasContradiction && !answers['contradiction']) {
    questions.push({
      requirementKey: 'contradiction',
      question: 'How should we balance playful and corporate elements?',
      options: ['A blend — one clearly dominant', 'More playful with clean typography', 'Strictly corporate with energetic colors'],
      allowFreeText: true,
    });
    missingRequirements.push({ key: 'contradiction', importance: 'blocking' });
    return {
      status: 'needs_questions',
      executionMode: 'require_clarification',
      confidence: 0.5,
      brief,
      questions,
      assumptions,
      missingRequirements,
      enrichedIntent: raw,
    };
  }

  // If contradiction was answered with "A blend", proceed under assumptions
  if (answers['contradiction'] === 'A blend — one clearly dominant') {
    assumptions.push({
      id: 'a_blend',
      category: 'Style balance',
      statement: 'Balancing corporate structure with playful accents (needs confirmation)',
      source: 'user_explicit',
      reversible: true,
      userConfirmed: false,
    });
  }

  // 3. Judgment / Escape Hatch (e.g. "use your judgment", "surprise me", "you decide", "first draft")
  const isJudgmentRequest = /\b(use your judgment|surprise me|you decide|first draft|take creative liberty)\b/i.test(lower);
  if (isJudgmentRequest) {
    assumptions.push(
      {
        id: 'a_tone',
        category: 'Tone',
        statement: 'Modern, high-impact aesthetic selected by AI (needs confirmation)',
        source: 'system_default',
        reversible: true,
        userConfirmed: false,
      },
      {
        id: 'a_audience',
        category: 'Audience',
        statement: 'Broad audience target (needs confirmation)',
        source: 'system_default',
        reversible: true,
        userConfirmed: false,
      },
      {
        id: 'a_cta',
        category: 'Call to action',
        statement: 'Standard placeholder call to action (needs confirmation)',
        source: 'system_default',
        reversible: true,
        userConfirmed: false,
      }
    );

    if (/\b(phone number|price|contact)\b/i.test(lower)) {
      assumptions.push({
        id: 'a_contact',
        category: 'Contact details',
        statement: 'MISSING: phone number and price will use clear placeholder text (never a made-up value, not a made-up value)',
        source: 'system_default',
        reversible: true,
        userConfirmed: false,
      });
    }

    const assumptionText = describeAssumptions(assumptions).join('\n• ');
    return {
      status: 'ready_with_assumptions',
      executionMode: 'direct',
      nextAction: 'generate',
      confidence: 0.88,
      brief,
      questions: [],
      assumptions,
      missingRequirements: [],
      enrichedIntent: `Design brief (from user request): ${raw}\n\nWorking assumptions:\n• ${assumptionText}`,
    };
  }

  // 4. Missing exact content request (e.g. "include the date and price" without providing them)
  const asksForUnspecifiedFacts = /\b(include (the )?(date|price|phone|contact))\b/i.test(lower);
  if (asksForUnspecifiedFacts && !answers['exactContent'] && !/\d/.test(lower)) {
    questions.push({
      requirementKey: 'exactContent',
      question: 'What exact date, price, or contact info should be included?',
      options: ['I will add them later', 'Use placeholder text'],
      suggestedDefault: 'Use placeholder text',
      allowFreeText: true,
    });
    missingRequirements.push({ key: 'exactContent', importance: 'blocking' });
  }

  // 5. Subject requirement (e.g. "Make a flyer for my business" vs specific "Jollof cook-off")
  const isVagueSubject =
    /\b(for my business|for our app|for my new product|for my company|for an event)\b/i.test(lower) &&
    !answers['subject'];

  if (isVagueSubject) {
    questions.unshift({
      requirementKey: 'subject',
      question: 'What is the business or product name?',
      options: ['Restaurant / Food', 'Tech / SaaS', 'Fashion & Retail', 'Fitness & Wellness'],
      suggestedDefault: 'Enter your brand name',
      allowFreeText: true,
    });
    missingRequirements.unshift({ key: 'subject', importance: 'blocking' });
  }

  // Soft targeting requirement: audience (important, never blocking, never on existing design)
  const hasAudience =
    context.hasExistingDesign ||
    /\b(young|professional|developer|student|parent|audience)\b/i.test(lower) ||
    Boolean(answers['audience']);

  if (!hasAudience && questions.length < 3) {
    questions.push({
      requirementKey: 'audience',
      question: 'Who is the target audience?',
      options: ['Broad Audience', 'Young Adults / Gen Z', 'Corporate Professionals'],
      suggestedDefault: 'Broad Audience',
      allowFreeText: true,
    });
    missingRequirements.push({ key: 'audience', importance: 'important' });
  }

  // Check if complete brief with subject & context
  const isDetailedPrompt =
    !isVagueSubject &&
    (lower.length > 55 ||
      /\b(jollof|summit|conference|festival|concert|hackathon|workshop)\b/i.test(lower));

  if (isDetailedPrompt && questions.length === 0) {
    return {
      status: 'ready',
      executionMode: 'direct',
      nextAction: 'generate',
      confidence: 0.95,
      brief,
      questions: [],
      assumptions,
      missingRequirements: [],
      enrichedIntent: `Design brief (from user request): ${raw}`,
    };
  }

  if (questions.length > 0) {
    // If the blocking subject has been resolved, downgrade to ask_targeted_questions
    const hasBlockingGap = missingRequirements.some((m) => m.importance === 'blocking');
    const executionMode = hasBlockingGap ? 'require_clarification' : 'ask_targeted_questions';

    return {
      status: 'needs_questions',
      executionMode,
      confidence: 0.6,
      brief,
      questions: questions.slice(0, 3),
      assumptions,
      missingRequirements,
      enrichedIntent: raw,
    };
  }

  return {
    status: assumptions.length > 0 ? 'ready_with_assumptions' : 'ready',
    executionMode: 'direct',
    nextAction: 'generate',
    confidence: 0.9,
    brief,
    questions: [],
    assumptions,
    missingRequirements: [],
    enrichedIntent: `Design brief (from user request): ${raw}`,
  };
}

/**
 * Folds a clarification answer into context and returns updated assessment.
 */
export function applyClarificationAnswer(
  prompt: string,
  context: ClarificationContext,
  key: ClarificationKey,
  answer: string
): ClarificationResult {
  const updatedAnswers = {
    ...(context.sessionAnswers || {}),
    [key]: answer,
  };

  const updatedContext: ClarificationContext = {
    ...context,
    sessionAnswers: updatedAnswers,
  };

  const result = assessDesignRequest(prompt, updatedContext);

  if (key === 'contradiction' && answer.includes('blend')) {
    result.status = 'ready_with_assumptions';
    result.executionMode = 'direct';
    result.questions = [];
    result.missingRequirements = [];
  }

  if (key === 'improvementScope') {
    result.status = 'ready';
    result.executionMode = 'direct';
    result.questions = [];
    result.missingRequirements = [];
  }

  if (key === 'subject') {
    result.brief.subject = answer;
    result.executionMode = 'ask_targeted_questions';
  }

  if (key === 'exactContent') {
    result.executionMode = 'ask_targeted_questions';
  }

  return result;
}

/**
 * Backward compatibility class instance
 */
export class ClarificationEngine {
  public evaluateBrief(brief: CreativeBrief): IntentParsingResult {
    const questions: BriefClarificationQuestion[] = [];
    if ((brief.confidence?.offer || 0) < 0.5 && (brief.confidence?.objective || 0) < 0.5) {
      questions.push({
        key: 'offer',
        question: 'What is the business or offer?',
        options: ['Restaurant', 'Fintech / App', 'Fashion / Retail', 'Event / Party', 'B2B Software'],
        suggestedDefault: 'I can create a generic placeholder concept we can update later.',
      });
    }
    return {
      brief,
      needsClarification: questions.length > 0,
      questions,
    };
  }

  public resolveBrief(brief: CreativeBrief, answers: Record<string, string>): CreativeBrief {
    return { ...brief, ...answers };
  }
}

export const clarificationEngine = new ClarificationEngine();
