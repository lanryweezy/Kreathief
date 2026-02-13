# Intent Inference System - Design Document

**Feature Name**: intent-inference  
**Phase**: 2 (Teaching the System to Reason)  
**Status**: Design Definition  
**Date**: February 13, 2026

---

## Overview

The Intent Inference System is a deterministic pattern recognition layer that sits above the scene graph and action history, enabling Kreathief to predict user intent and surface relevant controls contextually.

**Core Philosophy**: This is not AI. This is explicit pattern matching with transparent logic. Every pattern is debuggable, every suggestion is traceable, every decision is explainable.

**Architecture Principle**: Layered on top of existing systems (scene graph, action history, UI state) without modifying core rendering or interaction logic.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Canvas, Properties Panel, Contextual Suggestions)     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Intent Inference Layer                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pattern Recognition Engine                      │   │
│  │  - Pattern Registry                              │   │
│  │  - Deterministic Matching                        │   │
│  │  - Confidence Scoring                            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Intent Detector                                 │   │
│  │  - Action Sequence Analyzer                      │   │
│  │  - Context Evaluator                             │   │
│  │  - Suggestion Generator                          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Analytics & Learning                            │   │
│  │  - Event Logger                                  │   │
│  │  - Confidence Adjuster                           │   │
│  │  - Pattern Effectiveness Tracker                 │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Existing Systems (Unchanged)                  │
│  - Scene Graph                                           │
│  - Action History                                        │
│  - Canvas Rendering                                      │
│  - Layer Management                                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
Action History (existing)
    ↓
Intent Detector
    ├─ Analyze action sequence
    ├─ Evaluate context
    ├─ Match against patterns
    ↓
Pattern Recognition Engine
    ├─ Deterministic matching
    ├─ Confidence scoring
    ├─ Ranking
    ↓
Suggestion Generator
    ├─ Create UI affordances
    ├─ Prioritize suggestions
    ↓
Contextual Control Surfacing
    ├─ Display in persistent panel
    ├─ Real-time updates
    ↓
Analytics Logger
    ├─ Log intent detection
    ├─ Log user action
    ├─ Adjust confidence
```

---

## Components and Interfaces

### 1. Pattern Recognition Engine

**Purpose**: Deterministic pattern matching with transparent logic

**Interface**:
```typescript
interface Pattern {
  id: string;
  name: string;
  description: string;
  criteria: PatternCriterion[];
  action: SuggestedAction;
  baseConfidence: number; // 0-1
  enabled: boolean;
}

interface PatternCriterion {
  type: 'action' | 'timing' | 'context' | 'state';
  operator: 'equals' | 'contains' | 'within' | 'count_gte';
  value: any;
  weight: number; // 0-1, contributes to confidence
}

interface PatternMatch {
  patternId: string;
  patternName: string;
  confidence: number; // 0-1
  matchedCriteria: string[];
  suggestedAction: SuggestedAction;
  timestamp: number;
}

class PatternRecognitionEngine {
  private patterns: Map<string, Pattern> = new Map();
  private confidenceHistory: Map<string, number[]> = new Map();
  
  registerPattern(pattern: Pattern): void
  evaluateActionSequence(actions: UserAction[]): PatternMatch[]
  calculateConfidence(pattern: Pattern, matchedCriteria: string[]): number
  adjustConfidence(patternId: string, feedback: 'accept' | 'reject'): void
  getPatternRegistry(): Pattern[]
  updatePattern(patternId: string, updates: Partial<Pattern>): void
}
```

**Built-in Patterns**:
1. Typographic Tuning
2. Context-Aware Snapping
3. Asset Set Recognition
4. Constraint Establishment

### 2. Intent Detector

**Purpose**: Analyze action sequences and detect user intent

**Interface**:
```typescript
interface ActionSequence {
  actions: UserAction[];
  timeWindow: number; // milliseconds
  context: DesignContext;
}

interface DesignContext {
  selectedLayers: Layer[];
  recentActions: UserAction[];
  canvasState: CanvasState;
  userPreferences: UserPreferences;
}

interface SuggestedAction {
  type: 'surface_controls' | 'apply_constraint' | 'suggest_layout' | 'adjust_behavior';
  target: 'panel' | 'canvas' | 'properties';
  controls?: UIControl[];
  message?: string;
  priority: number; // 1-10
}

class IntentDetector {
  private engine: PatternRecognitionEngine;
  private actionHistory: UserAction[] = [];
  
  analyzeActionSequence(actions: UserAction[], context: DesignContext): Intent[]
  detectIntent(action: UserAction, context: DesignContext): Intent | null
  evaluateContext(context: DesignContext): ContextFactors
  generateSuggestions(intents: Intent[]): SuggestedAction[]
  prioritizeSuggestions(suggestions: SuggestedAction[]): SuggestedAction[]
}

interface Intent {
  type: string;
  confidence: number;
  patterns: PatternMatch[];
  suggestedActions: SuggestedAction[];
  metadata: Record<string, any>;
}
```

### 3. Contextual Control Surfacing

**Purpose**: Display suggestions without interrupting flow

**Interface**:
```typescript
interface ContextualPanel {
  id: string;
  title: string;
  suggestions: SuggestedControl[];
  isVisible: boolean;
  position: 'right' | 'bottom' | 'floating';
  collapsedState: 'expanded' | 'collapsed' | 'hidden';
}

interface SuggestedControl {
  id: string;
  label: string;
  type: 'slider' | 'toggle' | 'button' | 'select' | 'color_picker';
  value: any;
  onChange: (value: any) => void;
  icon?: string;
  tooltip?: string;
  priority: number;
}

class ContextualPanelManager {
  private panels: Map<string, ContextualPanel> = new Map();
  private collapseTimer: NodeJS.Timeout | null = null;
  
  surfaceSuggestions(suggestions: SuggestedAction[]): void
  updatePanel(panelId: string, controls: SuggestedControl[]): void
  collapsePanelAfterInactivity(panelId: string, delay: number): void
  expandPanel(panelId: string): void
  hidePanelTemporarily(panelId: string, duration: number): void
  clearAllPanels(): void
}
```

### 4. Analytics & Learning

**Purpose**: Track pattern effectiveness and improve confidence scoring

**Interface**:
```typescript
interface IntentLog {
  timestamp: number;
  intentType: string;
  confidence: number;
  context: DesignContext;
  suggestedActions: SuggestedAction[];
  userAction: 'accept' | 'reject' | 'ignore';
  outcome: 'success' | 'failure' | 'neutral';
}

interface PatternAnalytics {
  patternId: string;
  detectionCount: number;
  acceptanceRate: number; // 0-1
  averageConfidence: number;
  lastDetected: number;
  effectiveness: number; // 0-1
}

class AnalyticsEngine {
  private logs: IntentLog[] = [];
  private analytics: Map<string, PatternAnalytics> = new Map();
  
  logIntent(log: IntentLog): void
  logUserAction(intentId: string, action: 'accept' | 'reject' | 'ignore'): void
  getPatternAnalytics(patternId: string): PatternAnalytics
  getAllAnalytics(): PatternAnalytics[]
  adjustConfidenceFromFeedback(patternId: string, feedback: 'accept' | 'reject'): void
  identifyLowPerformingPatterns(): Pattern[]
  exportAnalytics(format: 'json' | 'csv'): string
}
```

---

## Data Models

### Pattern Definition

```typescript
// Typographic Tuning Pattern
const typographicTuningPattern: Pattern = {
  id: 'typo-tuning',
  name: 'Typographic Tuning',
  description: 'User is adjusting typography properties',
  criteria: [
    {
      type: 'action',
      operator: 'count_gte',
      value: { propertyTypes: ['fontSize', 'letterSpacing', 'lineHeight', 'fontWeight'], count: 3 },
      weight: 0.8
    },
    {
      type: 'timing',
      operator: 'within',
      value: { milliseconds: 30000 },
      weight: 0.6
    },
    {
      type: 'context',
      operator: 'equals',
      value: { selectedLayerType: 'text' },
      weight: 0.7
    }
  ],
  action: {
    type: 'surface_controls',
    target: 'panel',
    controls: [
      { id: 'font-size', label: 'Font Size', type: 'slider' },
      { id: 'letter-spacing', label: 'Letter Spacing', type: 'slider' },
      { id: 'line-height', label: 'Line Height', type: 'slider' },
      { id: 'font-weight', label: 'Font Weight', type: 'select' }
    ],
    priority: 9
  },
  baseConfidence: 0.75,
  enabled: true
};

// Context-Aware Snapping Pattern
const contextAwareSnappingPattern: Pattern = {
  id: 'context-snap',
  name: 'Context-Aware Snapping',
  description: 'Adjust snap behavior based on layer types',
  criteria: [
    {
      type: 'action',
      operator: 'equals',
      value: { actionType: 'drag' },
      weight: 1.0
    },
    {
      type: 'context',
      operator: 'contains',
      value: { nearbyLayers: true },
      weight: 0.8
    }
  ],
  action: {
    type: 'adjust_behavior',
    target: 'canvas',
    message: 'Snap weight adjusted based on layer types',
    priority: 8
  },
  baseConfidence: 0.9,
  enabled: true
};

// Asset Set Recognition Pattern
const assetSetPattern: Pattern = {
  id: 'asset-set',
  name: 'Asset Set Recognition',
  description: 'Multiple images uploaded rapidly',
  criteria: [
    {
      type: 'action',
      operator: 'count_gte',
      value: { actionType: 'upload', count: 2 },
      weight: 0.9
    },
    {
      type: 'timing',
      operator: 'within',
      value: { milliseconds: 10000 },
      weight: 0.8
    },
    {
      type: 'context',
      operator: 'equals',
      value: { aspectRatioVariance: 0.1 },
      weight: 0.7
    }
  ],
  action: {
    type: 'suggest_layout',
    target: 'panel',
    message: 'Suggest grid layouts for image set',
    priority: 7
  },
  baseConfidence: 0.7,
  enabled: true
};

// Constraint Establishment Pattern
const constraintPattern: Pattern = {
  id: 'constraint-establish',
  name: 'Constraint Establishment',
  description: 'User establishing spacing or alignment pattern',
  criteria: [
    {
      type: 'action',
      operator: 'count_gte',
      value: { actionType: 'move', count: 3 },
      weight: 0.8
    },
    {
      type: 'context',
      operator: 'equals',
      value: { spacingConsistency: 0.98 },
      weight: 0.9
    },
    {
      type: 'timing',
      operator: 'within',
      value: { milliseconds: 60000 },
      weight: 0.6
    }
  ],
  action: {
    type: 'surface_controls',
    target: 'panel',
    message: 'Create constraint rule from pattern',
    priority: 8
  },
  baseConfidence: 0.8,
  enabled: true
};
```

---

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Pattern Matching Determinism
**For any** action sequence and context, evaluating the same sequence twice should produce identical pattern matches and confidence scores.

**Validates: Requirements 5.2**

### Property 2: Confidence Score Validity
**For any** pattern match, the confidence score should be between 0 and 1, and should be the weighted average of matched criteria weights.

**Validates: Requirements 5.3**

### Property 3: Suggestion Prioritization Consistency
**For any** set of suggestions, when ranked by priority, the highest-priority suggestion should always appear first, and suggestions should maintain stable ordering when priorities are equal.

**Validates: Requirements 6.5**

### Property 4: Intent Detection Completeness
**For any** action sequence matching a registered pattern, the intent detector should identify at least one matching pattern with confidence > 0.5.

**Validates: Requirements 1.1, 2.1, 3.1, 4.1**

### Property 5: Contextual Panel State Consistency
**For any** contextual panel, if it's in "collapsed" state, it should retain its control state and be able to expand to the same state without data loss.

**Validates: Requirements 6.3**

### Property 6: Analytics Logging Completeness
**For any** intent detection event, if logging is enabled, the system should create a log entry with all required fields (timestamp, intent type, confidence, context).

**Validates: Requirements 7.1, 7.2**

### Property 7: Confidence Adjustment Monotonicity
**For any** pattern, when a user rejects a suggestion, the confidence score should decrease (or stay the same), never increase.

**Validates: Requirements 5.6**

### Property 8: Pattern Registry Immutability During Matching
**For any** pattern matching operation, the pattern registry should not be modified during evaluation, ensuring consistent results.

**Validates: Requirements 5.1, 5.2**

---

## Error Handling

### Pattern Matching Failures
- **Scenario**: Pattern matching takes > 50ms
- **Handling**: Log warning, skip pattern, continue with other patterns
- **User Impact**: Suggestion may be delayed or not appear

### Confidence Calculation Errors
- **Scenario**: Confidence calculation produces NaN or invalid value
- **Handling**: Default to 0.5 confidence, log error
- **User Impact**: Suggestion appears with neutral priority

### Analytics Logging Failures
- **Scenario**: Analytics write fails (storage full, permission denied)
- **Handling**: Queue logs in memory, retry on next opportunity
- **User Impact**: No user-facing impact, logs may be lost

### Contextual Panel Rendering Failures
- **Scenario**: Panel fails to render (DOM error, React error)
- **Handling**: Gracefully hide panel, log error, continue without suggestions
- **User Impact**: Suggestions don't appear, but system continues working

### Pattern Registry Corruption
- **Scenario**: Pattern registry becomes inconsistent
- **Handling**: Reload from backup, disable affected patterns
- **User Impact**: Some suggestions may not appear until restart

---

## Testing Strategy

### Unit Tests
- Pattern matching logic (determinism, confidence calculation)
- Action sequence analysis (timing, context evaluation)
- Suggestion prioritization (ranking, filtering)
- Analytics aggregation (counting, averaging)
- Confidence adjustment (monotonicity, persistence)

### Property-Based Tests
- **Property 1**: Pattern matching determinism (same input → same output)
- **Property 2**: Confidence score validity (0-1 range, weighted average)
- **Property 3**: Suggestion prioritization consistency (stable ordering)
- **Property 4**: Intent detection completeness (matches registered patterns)
- **Property 5**: Panel state consistency (collapse/expand preserves state)
- **Property 6**: Analytics logging completeness (all fields present)
- **Property 7**: Confidence adjustment monotonicity (reject decreases confidence)
- **Property 8**: Pattern registry immutability (no modifications during matching)

### Integration Tests
- End-to-end intent detection (action → pattern match → suggestion → user action)
- Multi-pattern scenarios (multiple patterns matching simultaneously)
- Context switching (user changes context, suggestions update)
- Analytics pipeline (detection → logging → aggregation)

### Performance Tests
- Pattern matching < 50ms (100+ patterns)
- Suggestion surfacing < 100ms (UI responsiveness)
- No frame drops during pattern evaluation (60fps maintained)
- Memory usage with large action history (1000+ actions)

---

## Implementation Notes

### Key Design Decisions

1. **Deterministic Over Probabilistic**: All pattern matching uses explicit rules, not neural networks or probabilistic models. This ensures debuggability and explainability.

2. **Layered Architecture**: Intent inference sits above existing systems without modifying core rendering or interaction logic. This minimizes risk and enables independent testing.

3. **Confidence Scoring**: Confidence is calculated from weighted criteria, not from black-box models. Each criterion's contribution is explicit and adjustable.

4. **Contextual Surfacing**: Suggestions appear in persistent panels, not modals. This respects user flow and doesn't interrupt work.

5. **Analytics-Driven Learning**: Pattern effectiveness is tracked through user feedback and analytics. Low-performing patterns can be disabled or adjusted.

### Future Extensions

- **Pattern Learning**: Automatically generate new patterns from user behavior
- **Collaborative Intent**: Detect intent across multiple users (Phase 3+)
- **Predictive Throttling**: Anticipate performance needs based on detected intent
- **Constraint Propagation**: Automatically apply constraints to related elements
- **Undo/Redo Integration**: Intent-aware branching history (Phase 3)

---

## Success Criteria

### Phase 2 Completion
- ✅ Typographic tuning detected in 80%+ of typography editing sessions
- ✅ Context-aware snapping feels noticeably different (user feedback)
- ✅ Asset set recognition suggests layouts in 70%+ of multi-image uploads
- ✅ Constraint inference proposed in 60%+ of manual alignment sequences
- ✅ Suggestion acceptance rate > 40%
- ✅ Users report "system anticipates my next action" in feedback
- ✅ All properties pass with 100+ iterations
- ✅ Pattern matching completes in < 50ms
- ✅ No frame drops during pattern evaluation

---

## Conclusion

The Intent Inference System is the bridge between Phase 1 (competence) and Phase 3 (active canvas). It's where Kreathief stops being reactive and starts being predictive.

By encoding philosophy in math—making every pattern explicit, every suggestion traceable, every decision explainable—we create a system that teaches users how to think while they create.

This is not AI hype. This is deterministic pattern recognition layered on top of your scene graph. And it's the foundation for everything that comes next.
