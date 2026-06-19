# Intent Inference System - Requirements

**Feature Name**: intent-inference  
**Phase**: 2 (Teaching the System to Reason)  
**Status**: Requirements Definition  
**Date**: February 13, 2026

---

## Introduction

The Intent Inference System teaches Kreathief to predict user intent from action sequences and context, enabling the system to suggest relevant controls, adjust behavior, and resist bad outcomes before they happen.

This moves the system from reactive (user acts → system responds) to predictive (system observes pattern → system anticipates → system suggests).

---

## Glossary

- **Intent**: The underlying goal inferred from a sequence of user actions
- **Action Sequence**: A series of related user actions within a time window (typically 30 seconds)
- **Scene Graph**: Hierarchical representation of all design elements and their relationships
- **Semantic Layer**: Layer type information (text, shape, image, group)
- **Context**: Current state including selected elements, recent actions, and layer properties
- **Suggestion**: UI affordance that surfaces relevant controls without modal interruption
- **Pattern Recognition**: Deterministic algorithm that identifies action sequences matching known patterns

---

## Requirements

### Requirement 1: Typographic Tuning Detection

**User Story**: As a designer, I want the system to recognize when I'm tuning typography, so that relevant controls surface automatically without me having to navigate menus.

#### Acceptance Criteria

1. WHEN a user edits three or more typography properties (font size, letter spacing, line height, font weight, line height) on the same text layer within 30 seconds, THE System SHALL detect this as a "typographic tuning" intent

2. WHEN typographic tuning intent is detected, THE System SHALL surface a typographic control panel contextually (not as a modal, not requiring navigation)

3. WHEN the user stops editing typography properties for 30 seconds, THE System SHALL collapse the contextual panel

4. WHEN a user is in typographic tuning mode and selects a different layer type (shape, image), THE System SHALL exit typographic tuning mode

5. WHEN typographic tuning is detected, THE System SHALL log the event with timestamp and properties edited for analytics

#### Acceptance Criteria Notes

- "Three or more properties" means distinct property types, not repeated edits to the same property
- "Within 30 seconds" is measured from first property edit to most recent
- "Contextually" means adjacent to the text layer or in a persistent panel, not a modal
- "Collapse" means hide but retain state for 5 seconds in case user returns

---

### Requirement 2: Context-Aware Snapping Weights

**User Story**: As a designer, I want snapping behavior to understand what I'm aligning, so that text aligns differently than shapes, and the system feels intelligent rather than mechanical.

#### Acceptance Criteria

1. WHEN a text layer is dragged near another text layer and alignment is possible, THE System SHALL apply a "strong" snap weight (magnetic, 20px threshold)

2. WHEN a shape layer is dragged near a text layer and alignment is possible, THE System SHALL apply a "medium" snap weight (15px threshold)

3. WHEN a shape layer is dragged near an image layer and alignment is possible, THE System SHALL apply a "weak" snap weight (10px threshold)

4. WHEN a layer is dragged near a grid constraint and alignment is possible, THE System SHALL apply a "medium" snap weight (15px threshold)

5. WHEN snapping occurs, THE System SHALL provide visual feedback indicating snap weight (stronger visual feedback for strong snaps, subtle for weak snaps)

6. WHEN a user holds Shift while dragging, THE System SHALL disable snapping entirely

#### Acceptance Criteria Notes

- Snap weights are encoded as threshold distances and visual feedback intensity
- "Alignment is possible" means the layers share a common edge or center line
- Visual feedback includes snap line color intensity and animation speed
- Thresholds are measured in pixels from target alignment

---

### Requirement 3: Asset Set Recognition

**User Story**: As a designer, I want the system to recognize when I'm uploading multiple related images, so that it can suggest compositional structures without me having to manually create them.

#### Acceptance Criteria

1. WHEN a user uploads two or more images within 10 seconds, THE System SHALL analyze their metadata (dimensions, aspect ratio, color palette, file size)

2. WHEN uploaded images share similar aspect ratios (within 10% variance), THE System SHALL detect this as a "set" and suggest grid layouts

3. WHEN a set is detected, THE System SHALL surface suggestions for: grid arrangement, rhythm patterns, and visual dominance hierarchy

4. WHEN the user accepts a suggestion, THE System SHALL apply the layout and create constraint rules for consistency

5. WHEN the user rejects a suggestion, THE System SHALL not repeat that suggestion for the same asset set

6. WHEN a user uploads images with significantly different aspect ratios, THE System SHALL suggest masking or cropping options instead of grids

#### Acceptance Criteria Notes

- "Within 10 seconds" is measured from first upload to last upload
- "Similar aspect ratios" means ratio variance < 10% (e.g., 16:9 and 16:10 are similar)
- "Set" requires minimum 2 images, maximum 12 (beyond 12, treat as gallery)
- Suggestions are non-modal, appear in a persistent panel
- Constraint rules are stored and can be edited or deleted

---

### Requirement 4: Constraint Inference

**User Story**: As a designer, I want the system to recognize when I'm establishing a grid or spacing pattern, so that it can apply those rules to new elements automatically.

#### Acceptance Criteria

1. WHEN a user manually aligns three or more elements to the same spacing (within 2px tolerance) within 60 seconds, THE System SHALL detect this as "constraint establishment"

2. WHEN constraint establishment is detected, THE System SHALL propose a constraint rule with the inferred spacing value

3. WHEN the user accepts a constraint rule, THE System SHALL apply it to all currently aligned elements and offer to apply it to future elements

4. WHEN a new element is added to the canvas while a constraint is active, THE System SHALL suggest applying the constraint to the new element

5. WHEN a user manually overrides a constraint (moves element outside constraint), THE System SHALL ask if they want to disable the constraint or create an exception

6. WHEN constraints are active, THE System SHALL display visual indicators (guides, labels) showing constraint boundaries

#### Acceptance Criteria Notes

- "Same spacing" means distance between elements, measured edge-to-edge
- "Within 2px tolerance" accounts for manual imprecision
- "Constraint rule" includes spacing value, axis (horizontal/vertical), and affected layers
- "Apply to future elements" is opt-in, not automatic
- Visual indicators are toggleable in preferences

---

### Requirement 5: Pattern Recognition Engine

**User Story**: As a system architect, I want a deterministic pattern recognition engine, so that intent inference is predictable, debuggable, and doesn't rely on black-box AI.

#### Acceptance Criteria

1. THE Pattern_Recognition_Engine SHALL maintain a registry of known patterns (typographic tuning, asset sets, constraint establishment, etc.)

2. WHEN an action sequence occurs, THE Pattern_Recognition_Engine SHALL evaluate it against all registered patterns using deterministic rules

3. WHEN a pattern matches, THE Pattern_Recognition_Engine SHALL return: pattern name, confidence score (0-1), and suggested action

4. WHEN multiple patterns match, THE Pattern_Recognition_Engine SHALL rank them by confidence and recency

5. THE Pattern_Recognition_Engine SHALL log all pattern matches with: timestamp, pattern name, confidence, user action, and system suggestion

6. WHEN a user rejects a suggestion, THE Pattern_Recognition_Engine SHALL reduce confidence for that pattern in future similar contexts

#### Acceptance Criteria Notes

- Confidence score is calculated from: number of matching criteria, time window adherence, and historical accuracy
- "Deterministic rules" means no neural networks, no probabilistic models—pure logic
- Logging enables analysis of pattern effectiveness and user preferences
- Confidence adjustment is persistent across sessions

---

### Requirement 6: Contextual Control Surfacing

**User Story**: As a designer, I want relevant controls to appear contextually without modals or navigation, so that I can stay in flow.

#### Acceptance Criteria

1. WHEN an intent is detected, THE System SHALL surface relevant controls in a persistent panel adjacent to the canvas (not a modal)

2. WHEN the user interacts with surfaced controls, THE System SHALL apply changes in real-time with visual feedback

3. WHEN the user stops interacting with surfaced controls for 30 seconds, THE System SHALL collapse the panel but retain state

4. WHEN the user selects a different element or changes context, THE System SHALL update surfaced controls to match new context

5. WHEN multiple intents are detected simultaneously, THE System SHALL prioritize by: recency, confidence score, and user history

6. WHEN a user disables a suggestion, THE System SHALL remember this preference and not surface similar suggestions for 24 hours

#### Acceptance Criteria Notes

- "Persistent panel" means it stays visible until explicitly closed or context changes
- "Real-time" means changes appear within 100ms
- "Collapse" means hide but keep state for quick re-expansion
- "Prioritize" means only show top 3 suggestions, with others available via scroll
- Preference memory is per-user, stored in local settings

---

### Requirement 7: Intent Logging and Analytics

**User Story**: As a product manager, I want to understand which intents are detected most frequently and which suggestions users accept, so that I can improve the system.

#### Acceptance Criteria

1. WHEN an intent is detected, THE System SHALL log: timestamp, intent type, confidence score, context (selected layers, recent actions)

2. WHEN a suggestion is surfaced, THE System SHALL log: suggestion type, intent that triggered it, user action (accept/reject/ignore)

3. WHEN a user accepts a suggestion, THE System SHALL log: which suggestion, what changed, time to completion

4. WHEN a user rejects a suggestion, THE System SHALL log: which suggestion, why (if provided), alternative action taken

5. THE System SHALL aggregate logs into analytics: detection frequency, acceptance rate, confidence distribution

6. WHEN analytics are reviewed, THE System SHALL identify: high-confidence patterns, low-acceptance suggestions, emerging user behaviors

#### Acceptance Criteria Notes

- Logging is opt-in, respects privacy settings
- "Context" includes layer types, properties edited, time since last action
- "Why" is optional user feedback, not required
- Analytics are available in admin dashboard
- Logs are retained for 90 days, then archived

---

## Non-Functional Requirements

### Performance

- Pattern matching must complete in < 50ms
- Suggestion surfacing must appear within 100ms of intent detection
- No frame drops during pattern evaluation (maintain 60fps)

### Reliability

- Pattern recognition must be deterministic (same input → same output)
- Logging must not block user interactions
- System must gracefully degrade if pattern engine fails

### Debuggability

- All pattern matches must be loggable with full context
- Confidence scores must be explainable (show which criteria matched)
- Pattern registry must be inspectable and editable

---

## Success Metrics

### Phase 2 Completion

- Typographic tuning detected in 80%+ of typography editing sessions
- Context-aware snapping feels noticeably different (user feedback)
- Asset set recognition suggests layouts in 70%+ of multi-image uploads
- Constraint inference proposed in 60%+ of manual alignment sequences
- Suggestion acceptance rate > 40%
- Users report "system anticipates my next action" in feedback

---

## Out of Scope

- Machine learning or neural networks (deterministic only)
- Voice commands or natural language
- Collaborative intent inference (single-user only)
- Mobile-specific intent patterns
- Undo/redo integration (handled separately)

---

## Dependencies

- Scene graph extraction (must be complete)
- Semantic layer typing (must be complete)
- Action history tracking (must be complete)
- Real-time logging infrastructure (must be complete)

---

## Notes

This is the bridge between Phase 1 (competence) and Phase 3 (active canvas). Intent inference is where the system stops being reactive and starts being predictive. It's deterministic, debuggable, and philosophically aligned with "teaching the system to reason."

The key insight: This is not AI hype. This is pattern recognition layered on top of your scene graph. Every pattern is explicit, every suggestion is traceable, every decision is explainable.
