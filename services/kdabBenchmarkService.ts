/**
 * Kreathief Design Agent Benchmark (KDAB) Evaluation Service
 *
 * Implements the 20-dimension rubric (0-10 each, 200 max) and "Would a Senior
 * Designer Ship This?" verdict defined in docs/DESIGN_AGENT_BENCHMARK.md,
 * combining Geometry Judge, Design Intent Graph constraints, typography/contrast
 * checks, text-fidelity verification, and clarification-gate precision/recall.
 */

import { Layer, TextLayer } from '../types';
import { AgentVariant } from './aiService';
import { auditGeometry, GeometryAudit } from '../utils/geometryJudge';
import {
  buildDesignIntentGraph,
  deriveDesignConstraints,
  validateDesignConstraints,
} from './designIntentGraph';
import {
  assessDesignRequest,
  ClarificationContext,
} from './clarificationEngine';
import {
  draftAgentVariants,
  transformExistingDesign,
} from './designAgentOrchestrator';

export type KDABDimensionId =
  | 'brief_understanding'
  | 'composition'
  | 'visual_hierarchy'
  | 'typography'
  | 'spacing'
  | 'alignment'
  | 'color'
  | 'imagery'
  | 'brand_consistency'
  | 'originality'
  | 'readability'
  | 'accessibility'
  | 'production_correctness'
  | 'information_architecture'
  | 'cultural_intelligence'
  | 'editability'
  | 'responsive_adaptability'
  | 'self_critique'
  | 'improvement_after_critique'
  | 'overall_professional_quality';

export type KDABClassification =
  | 'Exceptional / Professional-grade'
  | 'Strong'
  | 'Good but inconsistent'
  | 'Intermediate'
  | 'Weak'
  | 'Not production-ready';

export type ShipVerdict = 'YES' | 'MAYBE' | 'NO';

export interface KDABRubricScore {
  dimensions: Record<KDABDimensionId, number>;
  totalScore: number; // 0..200
  classification: KDABClassification;
  shipVerdict: ShipVerdict;
  geometryScore: number;
  constraintViolations: number;
  notes: string[];
}

export interface KDABBenchmarkTask {
  id: string;
  category: string;
  title: string;
  prompt: string;
  canvasSize: { width: number; height: number };
  bannedTerms?: string[];
  requiredPhrases?: string[];
}

export interface KDABTaskResult {
  taskId: string;
  title: string;
  category: string;
  rubric: KDABRubricScore;
  variantCount: number;
  topVariantSource: string;
}

export interface KDABClarificationMetrics {
  totalCases: number;
  passedCases: number;
  precision: number;
  recall: number;
  unnecessaryQuestionRate: number;
  results: Array<{
    id: string;
    expectedStatus: string;
    actualStatus: string;
    questionCount: number;
    passed: boolean;
  }>;
}

export const KDAB_CORE_TASKS: KDABBenchmarkTask[] = [
  {
    id: 'KT-001',
    category: 'Brand Identity',
    title: 'Luxury Brand Identity (ORIN)',
    prompt:
      'Create a complete visual identity concept for a fictional African luxury fragrance brand called "ORIN". The brand should feel sophisticated, contemporary, African, architectural and globally luxurious without relying on stereotypical African patterns. Establish a clear visual hierarchy and avoid excessive decoration.',
    canvasSize: { width: 1080, height: 1080 },
    requiredPhrases: ['ORIN'],
    bannedTerms: ['tribal pattern', 'clip art'],
  },
  {
    id: 'KT-002',
    category: 'Brand Identity',
    title: 'Tech Startup (NOVA GRID)',
    prompt:
      'Design a modern brand identity for "NOVA GRID", an AI infrastructure company building intelligent energy systems for African cities. Communicate intelligence, infrastructure, energy, reliability and the future without using generic glowing AI brains, robots or circuit-board cliches.',
    canvasSize: { width: 1080, height: 1080 },
    requiredPhrases: ['NOVA GRID'],
    bannedTerms: ['glowing brain', 'circuit board', 'robot'],
  },
  {
    id: 'KT-003',
    category: 'Brand Identity',
    title: 'Streetwear Campaign (TOMIS)',
    prompt:
      'Create a premium streetwear campaign for "TOMIS". The design should feel Lagos-born, globally relevant, youthful and culturally confident. Use typography, photography direction and composition to create a strong fashion-editorial identity.',
    canvasSize: { width: 1080, height: 1350 },
    requiredPhrases: ['TOMIS'],
  },
  {
    id: 'KT-004',
    category: 'Brand Identity',
    title: 'NGO Identity (Water For Tomorrow)',
    prompt:
      'Create a visual identity for "Water For Tomorrow", an organization working to provide clean water infrastructure to underserved communities. The identity must feel trustworthy, human, optimistic and institutional rather than childish or overly corporate.',
    canvasSize: { width: 1080, height: 1080 },
    requiredPhrases: ['Water For Tomorrow'],
  },
  {
    id: 'KT-005',
    category: 'Brand Identity',
    title: 'Financial Rebrand (MOSAIC BANK)',
    prompt:
      'Rebrand a fictional Nigerian bank called "MOSAIC BANK". Create a modern identity that can compete visually with international financial institutions while still feeling appropriate for Nigeria.',
    canvasSize: { width: 1080, height: 1080 },
    requiredPhrases: ['MOSAIC BANK'],
  },
  {
    id: 'KT-006',
    category: 'Social Media',
    title: 'Instagram Campaign (1080x1350)',
    prompt:
      'Design a 1080x1350 Instagram campaign announcing: "THE FUTURE OF AFRICAN CREATIVITY IS BEING BUILT NOW." The visual should feel editorial, premium and technologically advanced. Create a strong typographic hierarchy and clear focal point.',
    canvasSize: { width: 1080, height: 1350 },
    requiredPhrases: ['THE FUTURE OF AFRICAN CREATIVITY IS BEING BUILT NOW.'],
  },
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

export function classifyKDABScore(totalScore: number): KDABClassification {
  if (totalScore >= 180) return 'Exceptional / Professional-grade';
  if (totalScore >= 160) return 'Strong';
  if (totalScore >= 140) return 'Good but inconsistent';
  if (totalScore >= 120) return 'Intermediate';
  if (totalScore >= 100) return 'Weak';
  return 'Not production-ready';
}

function parseHexLuminance(hex: string | undefined): number | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3,8}$/.test(cleaned)) return null;
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hexA: string | undefined, hexB: string | undefined): number {
  const lumA = parseHexLuminance(hexA);
  const lumB = parseHexLuminance(hexB);
  if (lumA === null || lumB === null) return 7;
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Scores a single AgentVariant on all 20 KDAB dimensions (0-10 each, 200 total).
 */
export function evaluateVariantOnKDAB(
  variant: AgentVariant,
  task: KDABBenchmarkTask
): KDABRubricScore {
  const layers: Layer[] = variant.layers || [];
  const canvasSize = {
    width: variant.width || task.canvasSize.width,
    height: variant.height || task.canvasSize.height,
  };
  const notes: string[] = [];

  // 1. Geometry audit
  const geometry: GeometryAudit = auditGeometry(layers, canvasSize);
  const outOfBounds = geometry.findings.filter((f) => f.issue === 'out_of_bounds').length;
  const safeZoneIssues = geometry.findings.filter((f) => f.issue === 'safe_zone_violation').length;
  const overlaps = geometry.findings.filter((f) => f.issue === 'text_overlap').length;
  const misalignments = geometry.findings.filter((f) => f.issue === 'misaligned_column').length;
  const spacingIssues = geometry.findings.filter((f) => f.issue === 'uneven_spacing').length;

  // 2. Design Intent Graph + constraint check
  const graph = buildDesignIntentGraph(layers, canvasSize);
  const constraints = deriveDesignConstraints(graph, layers);
  const violations = validateDesignConstraints(layers, constraints, canvasSize);

  // 3. Layer breakdown
  const textLayers = layers.filter((l): l is TextLayer => l.type === 'text');
  const fontSizes = textLayers.map((t) => t.fontSize || 16).sort((a, b) => b - a);
  const uniqueFonts = new Set(textLayers.map((t) => t.fontFamily || 'Inter'));
  const allTextJoined = textLayers.map((t) => String(t.text || '')).join(' ').toLowerCase();

  // Check required phrases
  const required = task.requiredPhrases || [];
  const matchedPhrases = required.filter((p) => allTextJoined.includes(p.toLowerCase()));
  const phraseRatio = required.length > 0 ? matchedPhrases.length / required.length : 1;

  // Check banned terms
  const banned = task.bannedTerms || [];
  const hasBannedTerm = banned.some((b) => allTextJoined.includes(b.toLowerCase()));

  // Background vs text contrast
  const bgLayer = layers.find((l) => (l as any).name?.toLowerCase().includes('background') || (l.x === 0 && l.y === 0 && l.width >= canvasSize.width * 0.9));
  const bgColor = (bgLayer as any)?.color || (bgLayer as any)?.fill || '#0f172a';
  const minTextContrast = textLayers.reduce((minC, t) => {
    const ratio = contrastRatio(t.color, bgColor);
    return Math.min(minC, ratio);
  }, 21);

  // Dimension 1: Brief Understanding
  const briefUnderstanding = clampScore(7.5 + phraseRatio * 2.5 - (hasBannedTerm ? 3 : 0));
  if (phraseRatio < 1) {
    notes.push(`Missing required brief copy: ${required.filter((p) => !allTextJoined.includes(p.toLowerCase())).join(', ')}`);
  }

  // Dimension 2: Composition
  const composition = clampScore((geometry.score / 100) * 10 - overlaps * 1.5);

  // Dimension 3: Visual Hierarchy
  const hasDistinctScale = fontSizes.length >= 2 ? fontSizes[0] / Math.max(1, fontSizes[fontSizes.length - 1]) >= 1.8 : fontSizes.length === 1;
  const visualHierarchy = clampScore((hasDistinctScale ? 9.2 : 6.5) - overlaps * 1.5);

  // Dimension 4: Typography
  const fontCountAppropriate = uniqueFonts.size >= 1 && uniqueFonts.size <= 3;
  const typography = clampScore((fontCountAppropriate ? 9.0 : 6.5) + (hasDistinctScale ? 0.5 : -1));

  // Dimension 5: Spacing
  const spacing = clampScore(9.5 - spacingIssues * 2 - overlaps * 2);

  // Dimension 6: Alignment
  const alignment = clampScore(9.5 - misalignments * 1.8);

  // Dimension 7: Color
  const color = clampScore(minTextContrast >= 4.5 ? 9.2 : minTextContrast >= 3.0 ? 7.5 : 5.0);

  // Dimension 8: Imagery
  const imageLayers = layers.filter((l) => l.type === 'image' || Boolean((l as any).aiProvenance?.prompt));
  const imagery = clampScore(imageLayers.length > 0 ? 9.0 : 8.2);

  // Dimension 9: Brand Consistency
  const brandConsistency = clampScore(fontCountAppropriate ? 9.0 : 7.0);

  // Dimension 10: Originality
  const originality = clampScore((hasBannedTerm ? 5.0 : 8.8) + (variant.source === 'blueprint' ? 0.7 : 0));

  // Dimension 11: Readability
  const minFontSize = fontSizes.length > 0 ? fontSizes[fontSizes.length - 1] : 16;
  const readability = clampScore(
    (minFontSize >= 12 ? 9.2 : 6.5) - (overlaps > 0 ? 2.5 : 0) - (minTextContrast < 4.5 ? 2.0 : 0)
  );

  // Dimension 12: Accessibility
  const accessibility = clampScore(minTextContrast >= 7 ? 9.5 : minTextContrast >= 4.5 ? 8.8 : 5.5);

  // Dimension 13: Production Correctness
  const exactSizeMatch =
    canvasSize.width === task.canvasSize.width && canvasSize.height === task.canvasSize.height;
  const productionCorrectness = clampScore(
    (exactSizeMatch ? 9.5 : 6.0) - outOfBounds * 2.5 - safeZoneIssues * 1.2
  );

  // Dimension 14: Information Architecture
  const informationArchitecture = clampScore(9.2 - violations.length * 1.2);

  // Dimension 15: Cultural Intelligence
  const culturalIntelligence = clampScore(hasBannedTerm ? 5.0 : 9.0);

  // Dimension 16: Editability
  const hasStructuredTree = layers.length >= 3 && textLayers.length >= 1;
  const editability = clampScore(hasStructuredTree ? 9.5 : 5.0);

  // Dimension 17: Responsive Adaptability
  const responsiveAdaptability = clampScore(violations.length === 0 ? 9.0 : 7.2);

  // Dimension 18: Self-Critique
  const feedbackCount = variant.criticFeedback?.length || 0;
  const selfCritique = clampScore(feedbackCount >= 2 ? 9.2 : feedbackCount === 1 ? 8.0 : 6.5);

  // Dimension 19: Improvement After Critique
  const improvementAfterCritique = clampScore(geometry.score >= 85 && feedbackCount >= 1 ? 9.0 : 7.5);

  // Dimension 20: Overall Professional Quality
  const prelimAvg =
    (briefUnderstanding +
      composition +
      visualHierarchy +
      typography +
      spacing +
      alignment +
      color +
      imagery +
      brandConsistency +
      originality +
      readability +
      accessibility +
      productionCorrectness +
      informationArchitecture +
      culturalIntelligence +
      editability +
      responsiveAdaptability +
      selfCritique +
      improvementAfterCritique) /
    19;
  const overallProfessionalQuality = clampScore(prelimAvg);

  const dimensions: Record<KDABDimensionId, number> = {
    brief_understanding: briefUnderstanding,
    composition,
    visual_hierarchy: visualHierarchy,
    typography,
    spacing,
    alignment,
    color,
    imagery,
    brand_consistency: brandConsistency,
    originality,
    readability,
    accessibility,
    production_correctness: productionCorrectness,
    information_architecture: informationArchitecture,
    cultural_intelligence: culturalIntelligence,
    editability,
    responsive_adaptability: responsiveAdaptability,
    self_critique: selfCritique,
    improvement_after_critique: improvementAfterCritique,
    overall_professional_quality: overallProfessionalQuality,
  };

  const rawTotal = Object.values(dimensions).reduce((acc, v) => acc + v, 0);
  const totalScore = Math.round(rawTotal * 10) / 10;
  const classification = classifyKDABScore(totalScore);

  const hasSevereGeometryDefect = geometry.findings.some((f) => f.severity >= 0.75);
  let shipVerdict: ShipVerdict = 'NO';
  if (totalScore >= 172 && geometry.score >= 85 && !hasSevereGeometryDefect && phraseRatio === 1) {
    shipVerdict = 'YES';
  } else if (totalScore >= 145 && geometry.score >= 70) {
    shipVerdict = 'MAYBE';
  }

  return {
    dimensions,
    totalScore,
    classification,
    shipVerdict,
    geometryScore: geometry.score,
    constraintViolations: violations.length,
    notes,
  };
}

/**
 * Evaluates the Clarification Engine against KDAB KT-062..KT-067 protocols.
 */
export function evaluateClarificationSuite(): KDABClarificationMetrics {
  const cases: Array<{
    id: string;
    prompt: string;
    context: ClarificationContext;
    expectedStatus: 'needs_questions' | 'ready' | 'ready_with_assumptions';
    maxQuestions: number;
  }> = [
    {
      id: 'KT-062',
      prompt: 'Make a flyer for my business',
      context: { hasExistingDesign: false },
      expectedStatus: 'needs_questions',
      maxQuestions: 3,
    },
    {
      id: 'KT-063',
      prompt:
        "Promote Saturday's Jollof cook-off (1pm-6pm, Ibadan) to young professionals — 1080x1350 Instagram post, bold and colorful, headline: 'FIRE & FLAVOR'.",
      context: { hasExistingDesign: false, canvasSize: { width: 1080, height: 1350 } },
      expectedStatus: 'ready',
      maxQuestions: 0,
    },
    {
      id: 'KT-064',
      prompt: 'Make a poster for a tech event — use your judgment',
      context: { hasExistingDesign: false, canvasSize: { width: 1080, height: 1350 } },
      expectedStatus: 'ready_with_assumptions',
      maxQuestions: 0,
    },
    {
      id: 'KT-065',
      prompt: 'Launch announcement for our new mobile banking card with headline "ZERO FEES FOREVER"',
      context: {
        hasExistingDesign: false,
        canvasSize: { width: 1080, height: 1920 },
        hasBrandKit: true,
      },
      expectedStatus: 'ready',
      maxQuestions: 0,
    },
    {
      id: 'KT-066',
      prompt: 'make it better',
      context: {
        hasExistingDesign: true,
        canvasSize: { width: 1080, height: 1080 },
        designWeaknesses: ['elements hanging off the edge', 'weak hierarchy'],
      },
      expectedStatus: 'needs_questions',
      maxQuestions: 1,
    },
  ];

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  const results = cases.map((c) => {
    const res = assessDesignRequest(c.prompt, c.context);
    const qCount = res.questions.length;
    const expectsQuestions = c.expectedStatus === 'needs_questions';
    const askedQuestions = res.status === 'needs_questions' && qCount > 0;

    if (expectsQuestions && askedQuestions) truePositives++;
    if (!expectsQuestions && askedQuestions) falsePositives++;
    if (expectsQuestions && !askedQuestions) falseNegatives++;

    const statusMatched =
      c.expectedStatus === 'ready'
        ? res.status === 'ready' || res.status === 'ready_with_assumptions'
        : res.status === c.expectedStatus;
    const passed = statusMatched && qCount <= c.maxQuestions;

    return {
      id: c.id,
      expectedStatus: c.expectedStatus,
      actualStatus: res.status,
      questionCount: qCount,
      passed,
    };
  });

  const precision =
    truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 1;
  const recall =
    truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 1;
  const clearCases = cases.filter((c) => c.expectedStatus !== 'needs_questions').length;
  const unnecessaryQuestionRate = clearCases > 0 ? falsePositives / clearCases : 0;

  return {
    totalCases: cases.length,
    passedCases: results.filter((r) => r.passed).length,
    precision: Math.round(precision * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    unnecessaryQuestionRate: Math.round(unnecessaryQuestionRate * 100) / 100,
    results,
  };
}

/**
 * Runs the KDAB core benchmark tasks through the Design Agent orchestrator
 * and evaluates the top variant for each task.
 */
export async function runKDABBenchmarkSuite(
  tasks: KDABBenchmarkTask[] = KDAB_CORE_TASKS,
  plan: string = 'free'
): Promise<{
  tasks: KDABTaskResult[];
  averageScore: number;
  shipPercentage: number;
  clarification: KDABClarificationMetrics;
}> {
  const taskResults: KDABTaskResult[] = [];

  for (const task of tasks) {
    const variants = await draftAgentVariants(task.prompt, task.canvasSize, undefined, {
      plan,
      variationSeed: 42,
    });
    const topVariant = variants[0];
    const rubric = evaluateVariantOnKDAB(topVariant, task);
    taskResults.push({
      taskId: task.id,
      title: task.title,
      category: task.category,
      rubric,
      variantCount: variants.length,
      topVariantSource: topVariant.source || 'procedural',
    });
  }

  const averageScore =
    taskResults.length > 0
      ? Math.round(
          (taskResults.reduce((acc, r) => acc + r.rubric.totalScore, 0) / taskResults.length) * 10
        ) / 10
      : 0;
  const shipCount = taskResults.filter((r) => r.rubric.shipVerdict === 'YES').length;
  const shipPercentage =
    taskResults.length > 0 ? Math.round((shipCount / taskResults.length) * 100) : 0;

  return {
    tasks: taskResults,
    averageScore,
    shipPercentage,
    clarification: evaluateClarificationSuite(),
  };
}

/**
 * Evaluates an edit-in-place transformation task (KDAB KT-051..KT-056) and verifies
 * that protected layer identities remain intact while quality holds or improves.
 */
export async function evaluateInPlaceTransformTask(
  intent: string,
  seedLayers: Layer[],
  canvasSize: { width: number; height: number }
): Promise<{
  transformed: AgentVariant | null;
  preservedLayerIds: boolean;
  postGeometryScore: number;
}> {
  const transformed = await transformExistingDesign(intent, seedLayers, canvasSize, {
    plan: 'free',
  });
  if (!transformed) {
    return { transformed: null, preservedLayerIds: false, postGeometryScore: 0 };
  }
  const seedIds = new Set(seedLayers.map((l) => l.id));
  const preservedCount = transformed.layers.filter((l) => seedIds.has(l.id)).length;
  const preservedLayerIds = preservedCount >= Math.min(2, seedLayers.length);
  const geo = auditGeometry(transformed.layers, {
    width: transformed.width || canvasSize.width,
    height: transformed.height || canvasSize.height,
  });
  return {
    transformed,
    preservedLayerIds,
    postGeometryScore: geo.score,
  };
}
