# Phase 4 Identity: Ambient Intelligence + Typography + Perceptual Layout

**Feature Name**: phase4-identity  
**Phase**: 4 (Identity - Where Legends Are Made)  
**Status**: Requirements Definition  
**Date**: February 13, 2026

---

## Introduction

Kreathief's identity is not "another design tool." It's a system that thinks about typography and visual balance the way designers do—intuitively, perceptually, without grids or prompts.

**The Positioning**: "Design with ambient intelligence. Typography and balance that feel natural."

**The Philosophy**:

- No chat, no commands, no prompts
- System observes, learns, suggests
- Typography is first-class, not buried
- Optical balance over mathematical grids
- Intelligence that never interrupts

This spec defines the three pillars of Kreathief's identity:

1. **Ambient Intelligence**: AI that's present but never intrusive
2. **Typography Mastery**: Typography controls that feel intuitive, not intimidating
3. **Perceptual Layout**: Visual balance based on optical weight, not grids

---

## Glossary

- **Ambient Intelligence**: System behavior that anticipates needs without explicit user commands
- **Optical Weight**: Perceived visual heaviness of an element (color, size, contrast, position)
- **Typographic Hierarchy**: Relationship between font sizes, weights, and spacing that guides reading
- **Perceptual Balance**: Visual equilibrium based on optical weight, not mathematical symmetry
- **Typography Intent**: User's goal when editing typography (emphasis, hierarchy, readability, mood)
- **Suggestion**: Non-intrusive UI affordance that surfaces relevant controls
- **Scene Graph**: Hierarchical representation of all design elements and their relationships

---

## Requirements

### Requirement 1: Ambient Typography Intelligence

**User Story**: As a designer, I want the system to understand what I'm trying to do with typography, so that it surfaces relevant controls without me having to search for them.

#### Acceptance Criteria

1. WHEN a user selects a text layer, THE System SHALL analyze the typographic context (hierarchy level, current styling, related text layers)

2. WHEN a user edits typography properties, THE System SHALL infer the typographic intent (emphasis, hierarchy, readability, mood) from the edit pattern

3. WHEN typographic intent is inferred, THE System SHALL surface a contextual typography panel with: font size, weight, letter spacing, line height, and related controls

4. WHEN the user is establishing typographic hierarchy (editing multiple text layers with different sizes), THE System SHALL suggest hierarchy ratios (1.2x, 1.5x, 2x scale)

5. WHEN a user adjusts letter spacing or line height, THE System SHALL provide real-time visual feedback showing readability impact

6. WHEN typography changes are made, THE System SHALL automatically adjust related properties (e.g., if font size increases, suggest line height adjustment)

#### Acceptance Criteria Notes

- "Typographic context" includes: font size, weight, color, position, related layers
- "Edit pattern" means sequence of property changes (e.g., size → weight → spacing)
- "Hierarchy ratios" are based on typographic scale (1.2x = minor third, 1.5x = perfect fifth)
- "Real-time feedback" shows readability metrics (contrast, line length, leading)
- "Automatically adjust" is a suggestion, not automatic application

---

### Requirement 2: Optical Weight Analysis

**User Story**: As a designer, I want the system to understand visual balance through optical weight, so that I can create balanced layouts without thinking about grids.

#### Acceptance Criteria

1. WHEN elements are placed on the canvas, THE System SHALL calculate optical weight for each element based on: color, size, contrast, position, and visual density

2. WHEN the user is arranging elements, THE System SHALL display optical weight indicators (visual guides showing weight distribution)

3. WHEN elements are significantly unbalanced (optical weight variance > 30%), THE System SHALL suggest rebalancing options: move, resize, recolor, or adjust contrast

4. WHEN the user accepts a rebalancing suggestion, THE System SHALL apply changes while maintaining the user's design intent

5. WHEN multiple elements are selected, THE System SHALL show collective optical weight and suggest arrangements that balance the group

6. WHEN the user hovers over an element, THE System SHALL show its optical weight contribution to the overall composition

#### Acceptance Criteria Notes

- "Optical weight" is calculated from: luminance (0-1), size (pixels), contrast (0-1), position (distance from center)
- "Visual guides" are overlay indicators showing weight distribution
- "Variance > 30%" means one element is significantly heavier than others
- "Rebalancing options" preserve design intent (don't change content, only presentation)
- "Collective weight" is sum of individual weights

---

### Requirement 3: Perceptual Layout Suggestions

**User Story**: As a designer, I want the system to suggest layouts based on visual balance, so that I can create harmonious compositions without manual adjustment.

#### Acceptance Criteria

1. WHEN a user has multiple elements on the canvas, THE System SHALL analyze their arrangement and calculate overall balance

2. WHEN the arrangement is unbalanced, THE System SHALL suggest layout adjustments: reposition, resize, or recolor elements

3. WHEN the user is creating a new composition, THE System SHALL suggest starting layouts based on: optical weight, visual hierarchy, and balance principles

4. WHEN elements are moved, THE System SHALL provide real-time feedback showing balance impact (visual weight distribution)

5. WHEN the user accepts a layout suggestion, THE System SHALL apply changes with smooth animation showing the transformation

6. WHEN the user manually adjusts layout after a suggestion, THE System SHALL learn the user's preference and adjust future suggestions

#### Acceptance Criteria Notes

- "Balance" is measured by optical weight distribution (target: < 20% variance)
- "Layout adjustments" include: position, size, color, contrast
- "Starting layouts" are based on common compositional principles (rule of thirds, golden ratio, symmetry)
- "Real-time feedback" shows weight distribution visualization
- "Learn preference" means adjusting suggestion parameters based on user acceptance/rejection

---

### Requirement 4: No-Prompt AI Integration

**User Story**: As a designer, I want AI to help me without asking for prompts, so that I can stay in flow and let the system anticipate my needs.

#### Acceptance Criteria

1. WHEN the user is working on a design, THE System SHALL observe their actions and infer their design goals

2. WHEN the system infers a design goal, THE System SHALL surface relevant AI suggestions (image generation, text suggestions, layout ideas) contextually

3. WHEN the user is stuck (no actions for 30 seconds), THE System SHALL proactively suggest next steps based on design context

4. WHEN the user accepts an AI suggestion, THE System SHALL apply it and continue observing for next steps

5. WHEN the user rejects an AI suggestion, THE System SHALL adjust future suggestions based on the rejection

6. WHEN the user is in "flow state" (rapid, consistent actions), THE System SHALL reduce suggestions to avoid interruption

#### Acceptance Criteria Notes

- "Infer design goals" means analyzing: selected elements, recent actions, canvas state
- "Surface contextually" means in persistent panels, not modals or notifications
- "Stuck" is defined as no user actions for 30 seconds
- "Proactive suggestions" are based on: design stage, common next steps, user history
- "Flow state" is detected by: action frequency, consistency, and user preferences
- "Adjust suggestions" means changing suggestion type, frequency, or priority

---

### Requirement 5: Typography-First Interface

**User Story**: As a designer, I want typography to be the primary interface, so that I can control type without navigating menus.

#### Acceptance Criteria

1. WHEN a text layer is selected, THE System SHALL display typography controls prominently (not in a collapsed panel)

2. WHEN typography controls are visible, THE System SHALL show: font selector, size slider, weight selector, letter spacing, line height, and color picker

3. WHEN the user adjusts typography, THE System SHALL show real-time preview on the canvas with: readability metrics, hierarchy impact, and balance impact

4. WHEN the user is establishing typographic hierarchy, THE System SHALL suggest font pairings and size ratios

5. WHEN typography is adjusted, THE System SHALL automatically suggest related adjustments (e.g., if size increases, suggest line height increase)

6. WHEN the user is done with typography, THE System SHALL collapse the panel but retain state for quick re-access

#### Acceptance Criteria Notes

- "Prominently" means visible without scrolling or expanding
- "Real-time preview" updates within 100ms
- "Readability metrics" include: contrast ratio, line length, leading
- "Hierarchy impact" shows how change affects overall hierarchy
- "Balance impact" shows how change affects optical weight
- "Font pairings" are based on: style compatibility, contrast, and common usage

---

### Requirement 6: Optical Feedback System

**User Story**: As a designer, I want visual feedback that helps me understand balance and hierarchy, so that I can make informed design decisions.

#### Acceptance Criteria

1. WHEN elements are on the canvas, THE System SHALL display optical weight indicators (visual guides showing weight distribution)

2. WHEN the user hovers over an element, THE System SHALL highlight its optical weight contribution and show related elements

3. WHEN the user is adjusting layout, THE System SHALL show real-time balance feedback (weight distribution visualization)

4. WHEN the user is adjusting typography, THE System SHALL show hierarchy impact (how change affects overall hierarchy)

5. WHEN the user is adjusting colors, THE System SHALL show contrast impact (readability, visual weight change)

6. WHEN the user toggles feedback on/off, THE System SHALL remember their preference

#### Acceptance Criteria Notes

- "Optical weight indicators" are overlay guides (toggleable)
- "Highlight" means visual emphasis (color, outline, glow)
- "Related elements" are elements with similar weight or hierarchy level
- "Balance feedback" is a visualization showing weight distribution
- "Hierarchy impact" shows how change affects reading order
- "Contrast impact" shows readability metrics (WCAG compliance)

---

### Requirement 7: Intelligent Constraint Propagation

**User Story**: As a designer, I want the system to understand my design rules and apply them automatically, so that I can maintain consistency without manual effort.

#### Acceptance Criteria

1. WHEN the user establishes a typographic hierarchy (e.g., heading = 32px, subheading = 24px, body = 16px), THE System SHALL infer the hierarchy rule

2. WHEN the user adds a new text layer, THE System SHALL suggest applying the hierarchy rule based on the layer's role

3. WHEN the user establishes a color palette (e.g., primary, secondary, accent), THE System SHALL infer the palette rule

4. WHEN the user applies a color, THE System SHALL suggest palette colors and show contrast impact

5. WHEN the user establishes a spacing pattern (e.g., 8px grid), THE System SHALL infer the spacing rule

6. WHEN the user moves elements, THE System SHALL suggest snapping to the spacing rule

#### Acceptance Criteria Notes

- "Infer hierarchy rule" means analyzing font sizes and weights
- "Infer palette rule" means analyzing colors and their usage
- "Infer spacing rule" means analyzing distances between elements
- "Suggest applying" means non-modal suggestion in contextual panel
- "Show contrast impact" means WCAG compliance and readability metrics
- "Suggest snapping" means visual guides and optional snap

---

### Requirement 8: Learning from User Behavior

**User Story**: As a system architect, I want the system to learn from user behavior, so that suggestions improve over time and become more personalized.

#### Acceptance Criteria

1. WHEN the user accepts or rejects suggestions, THE System SHALL log the action and adjust future suggestions

2. WHEN the user establishes design patterns (e.g., always uses 1.5x hierarchy ratio), THE System SHALL recognize the pattern and suggest it proactively

3. WHEN the user has design preferences (e.g., prefers sans-serif fonts), THE System SHALL remember and suggest accordingly

4. WHEN the user's behavior changes (e.g., starts using serif fonts), THE System SHALL adapt suggestions

5. WHEN the system has learned user preferences, THE System SHALL surface them in a "My Preferences" panel

6. WHEN the user reviews their preferences, THE System SHALL allow editing and resetting

#### Acceptance Criteria Notes

- "Log the action" means storing: suggestion type, user action, outcome
- "Adjust future suggestions" means changing: suggestion type, frequency, priority
- "Recognize pattern" means detecting: repeated values, consistent choices
- "Remember preferences" means storing: font choices, color choices, spacing choices
- "Adapt suggestions" means updating: suggestion parameters, recommendation weights
- "My Preferences" panel shows: learned patterns, user-set preferences, reset options

---

## Non-Functional Requirements

### Performance

- Optical weight calculation: < 50ms for 100 elements
- Typography suggestion generation: < 100ms
- Real-time feedback updates: < 100ms
- No frame drops during layout adjustments (maintain 60fps)

### Reliability

- Optical weight calculations must be consistent (same input → same output)
- Suggestions must not corrupt design state
- Learning system must gracefully handle edge cases

### Debuggability

- All optical weight calculations must be explainable (show formula)
- All suggestions must be traceable (show reasoning)
- Learning system must be inspectable (show learned patterns)

### Privacy

- User behavior learning is opt-in
- Learned preferences are stored locally
- No data sent to external servers for learning

---

## Success Metrics

### Phase 4 Completion

- Users report "system understands my design intent" in feedback
- Typography controls are used 3x more than before
- Optical weight suggestions accepted in 50%+ of cases
- Users establish design patterns that system learns and suggests
- No users report AI suggestions as intrusive or annoying
- Perceptual layout suggestions feel natural and helpful
- Users spend 30% less time on manual layout adjustments

---

## Out of Scope

- Collaborative ambient intelligence (single-user only)
- Mobile-specific ambient features
- Voice commands or natural language
- External API calls for learning (local only)
- Real-time multiplayer suggestions

---

## Dependencies

- Intent Inference System (Phase 2) - must be complete
- Scene graph extraction - must be complete
- Optical weight calculation engine - must be built
- User preference storage - must be implemented
- Real-time feedback system - must be implemented

---

## Notes

This is Phase 4: Identity. This is where Kreathief stops being a tool and becomes a medium.

The key insight: Ambient intelligence + typography mastery + perceptual layout = a system that thinks like a designer.

Not "another design tool." A tool that teaches you to think differently while you create.

That's the identity. That's the legend.
