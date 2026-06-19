# Phase 4 Identity: Design Document

**Feature Name**: phase4-identity  
**Phase**: 4 (Identity - Where Legends Are Made)  
**Status**: Design Definition  
**Date**: February 13, 2026

---

## Overview

Phase 4 Identity is where Kreathief becomes a medium, not a tool. It combines three pillars:

1. **Ambient Intelligence**: AI that observes, learns, suggests—never interrupts
2. **Typography Mastery**: Typography as the primary interface, not buried in menus
3. **Perceptual Layout**: Visual balance based on optical weight, not grids

**Core Philosophy**: Design the way designers think. Intuitively. Perceptually. Without prompts.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Canvas, Typography Panel, Optical Feedback, Suggestions)
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Phase 4 Identity Layer                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Ambient Intelligence Engine                     │   │
│  │  - Design goal inference                         │   │
│  │  - Flow state detection                          │   │
│  │  - Proactive suggestion generation               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Typography Intelligence System                  │   │
│  │  - Typographic intent detection                  │   │
│  │  - Hierarchy analysis                            │   │
│  │  - Font pairing suggestions                      │   │
│  │  - Readability metrics                           │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Optical Weight Engine                           │   │
│  │  - Weight calculation                            │   │
│  │  - Balance analysis                              │   │
│  │  - Perceptual layout suggestions                 │   │
│  │  - Visual feedback generation                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Learning & Personalization                      │   │
│  │  - User preference tracking                      │   │
│  │  - Pattern recognition                           │   │
│  │  - Suggestion adaptation                         │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Phase 2 Intent Inference Layer                │
│  (Pattern Recognition, Contextual Surfacing)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┘
│            Existing Systems (Unchanged)                  │
│  - Scene Graph                                           │
│  - Canvas Rendering                                      │
│  - Layer Management                                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
Design Goal Inference
    ├─ Analyze: selected elements, recent actions, canvas state
    ├─ Detect: flow state, stuck state, intent
    ↓
Ambient Intelligence Engine
    ├─ Generate suggestions based on design goal
    ├─ Check: is user in flow? (reduce suggestions)
    ├─ Check: is user stuck? (increase suggestions)
    ↓
Typography Intelligence (if text selected)
    ├─ Analyze: typographic context, hierarchy
    ├─ Infer: typographic intent
    ├─ Generate: hierarchy suggestions, font pairings
    ↓
Optical Weight Engine (if layout adjusting)
    ├─ Calculate: optical weight for each element
    ├─ Analyze: overall balance
    ├─ Generate: rebalancing suggestions
    ↓
Learning System
    ├─ Log: user action, suggestion acceptance
    ├─ Update: user preferences, learned patterns
    ├─ Adapt: future suggestions
    ↓
Contextual Surfacing
    ├─ Display suggestions in persistent panels
    ├─ Show optical feedback overlays
    ├─ Real-time preview updates
```

---

## Components and Interfaces

### 1. Ambient Intelligence Engine

**Purpose**: Observe user behavior and proactively suggest next steps

**Interface**:

```typescript
interface DesignGoal {
  type: 'typography' | 'layout' | 'color' | 'emphasis' | 'hierarchy' | 'balance';
  confidence: number; // 0-1
  context: DesignContext;
  suggestedActions: SuggestedAction[];
}

interface FlowState {
  isInFlow: boolean;
  actionFrequency: number; // actions per second
  consistency: number; // 0-1, how consistent are actions
  timeInFlow: number; // milliseconds
}

interface DesignContext {
  selectedLayers: Layer[];
  recentActions: UserAction[];
  canvasState: CanvasState;
  designStage: 'setup' | 'composition' | 'refinement' | 'polish';
  userPreferences: UserPreferences;
}

class AmbientIntelligenceEngine {
  private designGoalHistory: DesignGoal[] = [];
  private flowStateDetector: FlowStateDetector;

  inferDesignGoal(context: DesignContext): DesignGoal;
  detectFlowState(actions: UserAction[]): FlowState;
  generateProactiveSuggestions(goal: DesignGoal, flowState: FlowState): SuggestedAction[];
  shouldSuggest(flowState: FlowState): boolean;
  adaptSuggestionFrequency(flowState: FlowState): number;
}
```

### 2. Typography Intelligence System

**Purpose**: Understand typographic intent and surface relevant controls

**Interface**:

```typescript
interface TypographicContext {
  selectedLayer: TextLayer;
  hierarchy: TypographicHierarchy;
  relatedLayers: TextLayer[];
  currentIntent: TypographicIntent;
}

interface TypographicIntent {
  type: 'emphasis' | 'hierarchy' | 'readability' | 'mood' | 'contrast';
  confidence: number;
  suggestedProperties: TypographicProperty[];
}

interface TypographicHierarchy {
  levels: HierarchyLevel[];
  ratios: number[]; // e.g., [1.2, 1.5, 2.0]
  consistency: number; // 0-1
}

interface HierarchyLevel {
  role: 'heading' | 'subheading' | 'body' | 'caption';
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

interface ReadabilityMetrics {
  contrastRatio: number; // WCAG standard
  lineLength: number; // characters per line
  leading: number; // line height / font size
  letterSpacing: number;
  score: number; // 0-100
}

class TypographyIntelligenceSystem {
  private hierarchyAnalyzer: HierarchyAnalyzer;
  private readabilityCalculator: ReadabilityCalculator;

  analyzeTypographicContext(layer: TextLayer): TypographicContext;
  inferTypographicIntent(actions: UserAction[]): TypographicIntent;
  suggestHierarchyRatios(hierarchy: TypographicHierarchy): number[];
  suggestFontPairings(selectedFont: string): FontPairing[];
  calculateReadabilityMetrics(layer: TextLayer): ReadabilityMetrics;
  suggestReadabilityImprovements(metrics: ReadabilityMetrics): TypographicProperty[];
  autoAdjustRelatedProperties(property: TypographicProperty): TypographicProperty[];
}

interface FontPairing {
  heading: string;
  body: string;
  compatibility: number; // 0-1
  contrast: number; // 0-1
  commonUsage: number; // 0-1
}
```

### 3. Optical Weight Engine

**Purpose**: Calculate visual balance and suggest perceptual layouts

**Interface**:

```typescript
interface OpticalWeight {
  elementId: string;
  luminance: number; // 0-1
  size: number; // pixels
  contrast: number; // 0-1
  position: Vector2; // x, y
  weight: number; // 0-100
  contribution: number; // 0-1, contribution to overall balance
}

interface BalanceAnalysis {
  totalWeight: number;
  distribution: BalanceDistribution;
  variance: number; // 0-1, 0 = perfectly balanced
  isBalanced: boolean; // variance < 0.2
  suggestions: LayoutSuggestion[];
}

interface BalanceDistribution {
  left: number;
  right: number;
  top: number;
  bottom: number;
  center: number;
}

interface LayoutSuggestion {
  type: 'reposition' | 'resize' | 'recolor' | 'adjust_contrast';
  elementId: string;
  currentValue: any;
  suggestedValue: any;
  impact: number; // 0-1, how much this improves balance
  preservesIntent: boolean;
}

class OpticalWeightEngine {
  private weightCalculator: WeightCalculator;
  private balanceAnalyzer: BalanceAnalyzer;

  calculateOpticalWeight(element: Layer): OpticalWeight;
  analyzeBalance(elements: Layer[]): BalanceAnalysis;
  suggestRebalancing(elements: Layer[]): LayoutSuggestion[];
  suggestStartingLayouts(elements: Layer[]): LayoutSuggestion[][];
  getWeightDistribution(elements: Layer[]): BalanceDistribution;
  visualizeWeight(element: Layer): VisualGuide;
}

interface VisualGuide {
  type: 'weight_indicator' | 'balance_line' | 'distribution_map';
  position: Vector2;
  size: Vector2;
  color: string;
  opacity: number;
  label: string;
}
```

### 4. Learning & Personalization System

**Purpose**: Learn from user behavior and adapt suggestions

**Interface**:

```typescript
interface UserPreferences {
  fontPreferences: FontPreference[];
  colorPreferences: ColorPreference[];
  spacingPreferences: SpacingPreference[];
  hierarchyRatios: number[];
  layoutPatterns: LayoutPattern[];
  suggestionFrequency: number; // 0-1
  flowStateThreshold: number; // action frequency threshold
}

interface FontPreference {
  font: string;
  frequency: number; // times used
  acceptance: number; // 0-1, user acceptance rate
  contexts: string[]; // where used (heading, body, etc.)
}

interface LearnedPattern {
  type: 'hierarchy_ratio' | 'color_palette' | 'spacing_grid' | 'font_pairing';
  pattern: any;
  frequency: number;
  confidence: number; // 0-1
  lastUsed: number; // timestamp
}

class LearningSystem {
  private preferences: UserPreferences;
  private learnedPatterns: LearnedPattern[] = [];

  logUserAction(action: UserAction, suggestion: SuggestedAction, accepted: boolean): void;
  recognizePattern(actions: UserAction[]): LearnedPattern | null;
  updatePreferences(feedback: UserFeedback): void;
  adaptSuggestions(suggestions: SuggestedAction[]): SuggestedAction[];
  getLearnedPatterns(): LearnedPattern[];
  resetPreferences(): void;
  exportPreferences(): UserPreferences;
  importPreferences(prefs: UserPreferences): void;
}
```

---

## Data Models

### Optical Weight Calculation

```typescript
// Optical weight formula
function calculateOpticalWeight(element: Layer): number {
  const luminance = calculateLuminance(element.color);
  const sizeNormalized = (element.width * element.height) / (canvasWidth * canvasHeight);
  const contrast = calculateContrast(element.color, backgroundColor);
  const positionWeight = calculatePositionWeight(element.x, element.y);

  // Weighted combination
  const weight = luminance * 0.3 + sizeNormalized * 0.3 + contrast * 0.2 + positionWeight * 0.2;

  return weight * 100; // 0-100 scale
}

// Luminance calculation (relative brightness)
function calculateLuminance(color: string): number {
  const rgb = hexToRgb(color);
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

// Contrast calculation (WCAG)
function calculateContrast(foreground: string, background: string): number {
  const l1 = calculateRelativeLuminance(foreground);
  const l2 = calculateRelativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Position weight (elements closer to center have more weight)
function calculatePositionWeight(x: number, y: number): number {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
  return 1 - distance / maxDistance;
}
```

### Typographic Intent Detection

```typescript
// Detect typographic intent from action sequence
function inferTypographicIntent(actions: UserAction[]): TypographicIntent {
  const propertyChanges = actions
    .filter((a) => a.type === 'property_change' && isTypographicProperty(a.property))
    .map((a) => a.property);

  // Analyze pattern
  if (propertyChanges.includes('fontSize') && propertyChanges.includes('fontWeight')) {
    return { type: 'emphasis', confidence: 0.9 };
  }

  if (propertyChanges.includes('fontSize') && propertyChanges.includes('lineHeight')) {
    return { type: 'readability', confidence: 0.85 };
  }

  if (propertyChanges.includes('letterSpacing') && propertyChanges.includes('lineHeight')) {
    return { type: 'mood', confidence: 0.8 };
  }

  if (propertyChanges.length >= 3) {
    return { type: 'hierarchy', confidence: 0.75 };
  }

  return { type: 'contrast', confidence: 0.5 };
}
```

### Flow State Detection

```typescript
// Detect if user is in flow state
function detectFlowState(actions: UserAction[], timeWindow: number = 60000): FlowState {
  const recentActions = actions.filter((a) => Date.now() - a.timestamp < timeWindow);

  if (recentActions.length === 0) {
    return { isInFlow: false, actionFrequency: 0, consistency: 0, timeInFlow: 0 };
  }

  // Calculate action frequency
  const actionFrequency = recentActions.length / (timeWindow / 1000);

  // Calculate consistency (how similar are consecutive actions)
  let consistency = 0;
  for (let i = 1; i < recentActions.length; i++) {
    const prev = recentActions[i - 1];
    const curr = recentActions[i];
    const similarity = calculateActionSimilarity(prev, curr);
    consistency += similarity;
  }
  consistency /= recentActions.length;

  // Flow state: high frequency + high consistency
  const isInFlow = actionFrequency > 2 && consistency > 0.7;

  return {
    isInFlow,
    actionFrequency,
    consistency,
    timeInFlow: recentActions[recentActions.length - 1].timestamp - recentActions[0].timestamp,
  };
}

function calculateActionSimilarity(action1: UserAction, action2: UserAction): number {
  if (action1.type !== action2.type) return 0;
  if (action1.layerId !== action2.layerId) return 0.5;
  return 0.8; // Same type, same layer = high similarity
}
```

---

## Correctness Properties

### Property 1: Optical Weight Consistency

**For any** element and canvas state, calculating optical weight twice should produce identical results.

**Validates: Requirements 2.1**

### Property 2: Balance Variance Calculation

**For any** set of elements, the balance variance should be between 0 and 1, where 0 = perfectly balanced and 1 = completely unbalanced.

**Validates: Requirements 2.2**

### Property 3: Typography Intent Determinism

**For any** action sequence, inferring typographic intent twice should produce identical intent type and confidence score.

**Validates: Requirements 1.2**

### Property 4: Readability Metrics Validity

**For any** text layer, readability metrics should be within valid ranges (contrast ratio > 1, line length > 0, leading > 0).

**Validates: Requirements 1.5**

### Property 5: Flow State Stability

**For any** action sequence, flow state detection should be stable (small changes in action timing shouldn't drastically change flow state).

**Validates: Requirements 4.6**

### Property 6: Suggestion Prioritization Consistency

**For any** set of suggestions, when ranked by priority, the highest-priority suggestion should always appear first.

**Validates: Requirements 1.3, 2.3**

### Property 7: Learning System Monotonicity

**For any** pattern, when a user accepts a suggestion, the pattern's confidence should increase (or stay the same), never decrease.

**Validates: Requirements 8.2**

### Property 8: Preference Persistence

**For any** user preference, after being set, it should persist across sessions and be retrievable in the same state.

**Validates: Requirements 8.5**

---

## Error Handling

### Optical Weight Calculation Failures

- **Scenario**: Color parsing fails or element has invalid dimensions
- **Handling**: Use default weight (50), log error
- **User Impact**: Element treated as neutral weight

### Typography Intent Detection Failures

- **Scenario**: Action sequence is ambiguous or empty
- **Handling**: Default to 'contrast' intent with low confidence
- **User Impact**: Generic typography suggestions appear

### Flow State Detection Failures

- **Scenario**: Action history is corrupted or missing
- **Handling**: Assume not in flow state, show suggestions
- **User Impact**: More suggestions appear (conservative approach)

### Learning System Failures

- **Scenario**: Preference storage fails or becomes corrupted
- **Handling**: Continue with default preferences, log error
- **User Impact**: Personalization doesn't work, but system continues

### Readability Calculation Failures

- **Scenario**: Font metrics unavailable or text layer has no content
- **Handling**: Use default metrics, log warning
- **User Impact**: Readability feedback unavailable

---

## Testing Strategy

### Unit Tests

- Optical weight calculation (luminance, contrast, position)
- Typography intent detection (action pattern analysis)
- Flow state detection (action frequency, consistency)
- Readability metrics (contrast, line length, leading)
- Balance analysis (variance calculation)
- Preference persistence (storage, retrieval)

### Property-Based Tests

- **Property 1**: Optical weight consistency (same input → same output)
- **Property 2**: Balance variance validity (0-1 range)
- **Property 3**: Typography intent determinism (consistent results)
- **Property 4**: Readability metrics validity (valid ranges)
- **Property 5**: Flow state stability (small changes don't drastically change state)
- **Property 6**: Suggestion prioritization consistency (stable ordering)
- **Property 7**: Learning system monotonicity (acceptance increases confidence)
- **Property 8**: Preference persistence (survives sessions)

### Integration Tests

- End-to-end ambient intelligence (action → goal inference → suggestion)
- Typography workflow (select text → infer intent → surface controls)
- Layout workflow (arrange elements → calculate balance → suggest rebalancing)
- Learning workflow (accept suggestion → update preferences → adapt future suggestions)

### Performance Tests

- Optical weight calculation < 50ms for 100 elements
- Typography suggestion generation < 100ms
- Flow state detection < 50ms
- Real-time feedback updates < 100ms
- No frame drops during layout adjustments (60fps maintained)

---

## Implementation Notes

### Key Design Decisions

1. **Ambient Over Intrusive**: All suggestions appear in persistent panels, never as modals or notifications. System respects flow state.

2. **Optical Over Mathematical**: Balance is based on visual perception (luminance, contrast, position), not mathematical grids.

3. **Typography First**: Typography controls are always visible and prominent, not buried in menus.

4. **Learning Local**: All learning happens locally, no external API calls. User data stays on device.

5. **Deterministic Over Probabilistic**: All calculations are explicit and debuggable, not black-box ML.

### Future Extensions

- **Collaborative Ambient Intelligence**: Detect intent across multiple users (Phase 5+)
- **Motion-First Design**: Extend to animation and motion design (Phase 5+)
- **AR Export**: Render designs in AR with optical weight preserved (Phase 5+)
- **Advanced Constraint Propagation**: Automatically apply constraints to related elements (Phase 5+)

---

## Success Criteria

### Phase 4 Completion

- ✅ Users report "system understands my design intent" in feedback
- ✅ Typography controls used 3x more than before
- ✅ Optical weight suggestions accepted in 50%+ of cases
- ✅ Users establish design patterns that system learns and suggests
- ✅ No users report AI suggestions as intrusive or annoying
- ✅ Perceptual layout suggestions feel natural and helpful
- ✅ Users spend 30% less time on manual layout adjustments
- ✅ All properties pass with 100+ iterations
- ✅ Optical weight calculation < 50ms for 100 elements
- ✅ No frame drops during layout adjustments

---

## Conclusion

Phase 4 Identity is where Kreathief becomes a legend.

Not by copying Canva or Figma. Not by chasing feature parity. But by choosing one axis and owning it completely.

**Ambient Intelligence + Typography Mastery + Perceptual Layout = A system that thinks like a designer.**

This is the medium. This is the philosophy. This is the identity.

And it all starts with understanding that design is not about grids. It's about balance. It's about type. It's about intention.

Kreathief gets that. And that's why it will be different.
