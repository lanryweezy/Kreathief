# Kreathief Design Agent Benchmark (KDAB)

**Version:** 1.0
**Date:** 2026-08-28
**Purpose:** Formal regression benchmark for evaluating the Kreathief Design Agent pipeline across 50 design tasks.

---

## How to Use This Benchmark

### Execution Protocol

1. Run each test **exactly as written** — do not help the agent, pre-select layouts, or manually fix output before evaluation.
2. For each test, capture **4 screenshots** using the naming convention below.
3. Score each output on the 20-dimension rubric.
4. Record the "Would a senior designer ship this?" verdict.
5. Track results in the regression table at the bottom.

### Screenshot Naming Convention

```
KT-{ID}_{A|B|C|D}_{description}.png
```

| Screenshot | Captures |
|-----------|----------|
| `KT-001_A_brief.png` | The prompt and starting canvas |
| `KT-001_B_generation.png` | First output before any correction |
| `KT-001_C_critique.png` | Agent's QA/critique reasoning, scores, feedback |
| `KT-001_D_final.png` | Final result after agent self-improvement |

---

## Scoring Rubric (20 Dimensions, 0-10 each)

| # | Dimension | What to Evaluate |
|---|-----------|-----------------|
| 1 | Brief Understanding | Does the output address the actual brief, not a generic interpretation? |
| 2 | Composition | Is the layout balanced, intentional, and visually structured? |
| 3 | Visual Hierarchy | Is there a clear 1st -> 2nd -> 3rd reading order? |
| 4 | Typography | Is the typographic scale coherent? Are font pairings appropriate? |
| 5 | Spacing | Is spacing systematic (grid-based) or arbitrary? |
| 6 | Alignment | Are elements aligned to consistent axes? |
| 7 | Color | Is the palette cohesive and contextually appropriate? |
| 8 | Imagery | Are image prompts specific and art-directed (not generic)? |
| 9 | Brand Consistency | Does it feel like one coherent visual system? |
| 10 | Originality | Does it avoid template-like or cliche outputs? |
| 11 | Readability | Can all text be read at the specified sizes and contrasts? |
| 12 | Accessibility | Are contrast ratios sufficient? Is the design inclusive? |
| 13 | Production Correctness | Are dimensions, margins, safe zones, and bleed correct? |
| 14 | Information Architecture | Is complex information organized logically? |
| 15 | Cultural Intelligence | Does it avoid stereotypes and demonstrate cultural sophistication? |
| 16 | Editability | Is the layer tree structured (Background -> Hero -> Typography -> UI)? |
| 17 | Responsive Adaptability | Could this design be re-laid out for other formats? |
| 18 | Self-Critique | Did the QA Critic identify real issues (not generic praise)? |
| 19 | Improvement After Critique | Did the design measurably improve after the critic pass? |
| 20 | Overall Professional Quality | Would this pass review at a professional design agency? |

**Maximum Score: 200**

### Classification

| Range | Classification |
|-------|---------------|
| 180-200 | Exceptional / Professional-grade |
| 160-179 | Strong |
| 140-159 | Good but inconsistent |
| 120-139 | Intermediate |
| 100-119 | Weak |
| < 100 | Not production-ready |

### The "Would a Senior Designer Ship This?" Test

After every output, answer:

> **Would I confidently send this to a paying client without manually redesigning it?**

**YES** / **NO** / **MAYBE**

---

## A. BRAND IDENTITY (KT-001 to KT-005)

### KT-001 — Luxury Brand Identity

**Prompt:**
> Create a complete visual identity concept for a fictional African luxury fragrance brand called **ORIN**. The brand should feel sophisticated, contemporary, African, architectural and globally luxurious without relying on stereotypical African patterns. Create a primary logo, wordmark, color palette, typography system, secondary mark and luxury packaging direction. Establish a clear visual hierarchy and make every element feel like part of one coherent identity system. Avoid excessive decoration.

**Tests:** Branding intelligence, cultural sophistication, logo construction, restraint, typography, system thinking.

**Pass criteria:** The identity feels cohesive across all touchpoints. No stereotypical patterns. Typography is restrained and architectural. Color palette is sophisticated (not generic gold/black).

---

### KT-002 — Tech Startup

**Prompt:**
> Design a modern brand identity for **NOVA GRID**, an AI infrastructure company building intelligent energy systems for African cities. The identity should communicate intelligence, infrastructure, energy, reliability and the future without using generic glowing AI brains, robots or circuit-board cliches.

**Tests:** Cliche avoidance, technical visual language, brand reasoning.

**Pass criteria:** No AI brain imagery, no circuit boards, no generic blue glow. The identity communicates infrastructure through form, geometry, or spatial metaphor.

---

### KT-003 — Streetwear

**Prompt:**
> Create a premium streetwear campaign for **TOMIS**. The design should feel Lagos-born, globally relevant, youthful and culturally confident. Use typography, photography direction and composition to create a strong fashion-editorial identity. Do not make it look like a generic clothing advertisement.

**Tests:** Cultural confidence, fashion-editorial art direction, typographic identity.

**Pass criteria:** Feels like a real fashion editorial, not a Canva template. Typography drives the identity. Cultural grounding is evident without being stereotypical.

---

### KT-004 — NGO

**Prompt:**
> Create a visual identity for **Water For Tomorrow**, an organization working to provide clean water infrastructure to underserved communities. The identity must feel trustworthy, human, optimistic and institutional rather than childish or overly corporate.

**Tests:** Tone calibration, institutional design, emotional register.

**Pass criteria:** Neither childish nor corporate. Feels trustworthy and human. Color palette communicates hope without being saccharine.

---

### KT-005 — Rebrand

**Prompt:**
> Rebrand a fictional Nigerian bank called **MOSAIC BANK**. Create a modern identity that can compete visually with international financial institutions while still feeling appropriate for Nigeria. Produce the logo direction, color system, typography and a sample banking advertisement.

**Tests:** Financial sector visual language, global competitiveness, cultural appropriateness.

**Pass criteria:** Could sit alongside Revolut, Monzo, or Kuda without looking inferior. Typography is institutional. The sample ad demonstrates the system in use.

---

## B. SOCIAL MEDIA (KT-006 to KT-010)

### KT-006 — Instagram Campaign (1080x1350)

**Prompt:**
> Design a 1080x1350 Instagram campaign announcing: **"THE FUTURE OF AFRICAN CREATIVITY IS BEING BUILT NOW."** The visual should feel editorial, premium and technologically advanced. Create a strong typographic hierarchy and clear focal point.

**Tests:** Exact dimensions, typographic hierarchy, editorial art direction, text fidelity.

**Pass criteria:** Canvas is exactly 1080x1350. The headline is rendered character-for-character. Clear focal point exists. Feels editorial, not like a social template.

---

### KT-007 — Instagram Carousel (5 slides)

**Prompt:**
> Create a 5-slide Instagram carousel explaining **5 Ways AI Is Changing Graphic Design**. Each slide should feel like part of the same visual system while remaining individually readable.

**Tests:** Multi-slide consistency, visual system thinking, information hierarchy per slide.

**Pass criteria:** All 5 slides share typography, color, and layout DNA. Each slide is individually readable. Slide numbering/progression is clear.

---

### KT-008 — LinkedIn

**Prompt:**
> Create a professional LinkedIn announcement for a technology company launching an AI product. The design should feel credible and executive-level, not like a flashy social-media advertisement.

**Tests:** Professional tone, executive visual language, platform-appropriate design.

**Pass criteria:** Would not look out of place on a Fortune 500 LinkedIn feed. No neon colors or excessive gradients.

---

### KT-009 — X/Twitter

**Prompt:**
> Create a square social graphic announcing: **"WE JUST SHIPPED IT."** Make it exciting, minimal and technologically sophisticated.

**Tests:** Minimalism, text fidelity, excitement through restraint.

**Pass criteria:** The design communicates excitement through typography and composition, not through decoration. Exact text preserved. Canvas is square.

---

### KT-010 — Social Campaign System

**Prompt:**
> Design three coordinated social-media graphics for the same fictional brand. The three designs must clearly belong to the same campaign but must not look like duplicates.

**Tests:** Campaign coherence, variation within a system, brand consistency.

**Pass criteria:** All three share clear visual DNA (color, type, spacing patterns) but each has distinct composition. Not three copies with different text.

---

## C. ADVERTISING (KT-011 to KT-015)

### KT-011 — Product Advertisement

**Prompt:**
> Create a premium advertisement for a fictional wireless headphone called **AURA ONE**. The advertisement should communicate premium sound, comfort and technology without overcrowding the composition.

**Tests:** Product-centric composition, negative space, premium restraint.

---

### KT-012 — Food Advertisement

**Prompt:**
> Design an advertising poster for a Nigerian food brand launching a new jollof rice product. Make the food visually appetizing while maintaining premium commercial-art direction.

**Tests:** Food photography direction, appetizing art direction, commercial quality.

---

### KT-013 — Financial Advertisement

**Prompt:**
> Create an advertisement for a digital banking product offering instant international payments. The design must communicate speed, trust and simplicity without using cliche flying money imagery.

**Tests:** Cliche avoidance, abstract concept visualization, trust communication.

---

### KT-014 — Billboard

**Prompt:**
> Design a highway billboard for a telecommunications company launching a new 5G network. The message must be understandable in approximately three seconds from a moving vehicle.

**Tests:** Information compression, 3-second readability, billboard-appropriate typography.

**Pass criteria:** Maximum 7 words visible. Headline fontSize is massive. Logo is visible. No body copy. Clear from a distance.

---

### KT-015 — Minimal Advertisement

**Prompt:**
> Create a luxury advertisement using extremely limited visual elements. Use only a product, headline, logo and one supporting line. Make the composition feel expensive through proportion, spacing, typography and art direction rather than decoration.

**Tests:** Premium restraint, negative space mastery, typography-driven luxury.

**Pass criteria:** 5 or fewer elements on canvas. 40%+ negative space. Feels expensive through proportion, not decoration.

---

## D. PRINT DESIGN (KT-016 to KT-020)

### KT-016 — Conference Flyer (A5)

**Prompt:**
> Design an A5 promotional flyer for a professional technology conference in Lagos. Include: AFRICAN AI SUMMIT 2026 / Lagos, Nigeria / September 18-20 / Speakers, workshops, networking and exhibitions. Establish clear hierarchy and production-ready margins.

### KT-017 — Business Card

**Prompt:**
> Create a premium business card for an architecture firm called **FORM / AFRICA**. Use restraint and strong typography.

### KT-018 — Tri-fold Brochure

**Prompt:**
> Design a tri-fold brochure for a renewable-energy company. Organize the information into clear sections while maintaining a consistent visual language.

### KT-019 — Restaurant Menu

**Prompt:**
> Design a premium restaurant menu for a Lagos contemporary Nigerian restaurant. The menu must prioritize readability and elegant hierarchy over decoration.

### KT-020 — Event Poster

**Prompt:**
> Create a large-format poster for an experimental electronic music festival called **NIGHT FREQUENCY**. The visual identity should feel underground, artistic and contemporary.

---

## E. EDITORIAL (KT-021 to KT-025)

### KT-021 — Magazine Cover

**Prompt:**
> Design a contemporary magazine cover titled **THE NEW AFRICA**. Create an editorial art direction that avoids stereotypical representations of Africa.

### KT-022 — Magazine Spread

**Prompt:**
> Design a two-page editorial spread about the future of artificial intelligence. Use typography, imagery, whitespace and grid structure to create sophisticated editorial composition.

### KT-023 — Newspaper Front Page

**Prompt:**
> Design a front page for a fictional technology newspaper covering a major African technology breakthrough.

### KT-024 — Annual Report

**Prompt:**
> Design the cover and first interior spread of an annual report for an African investment company.

### KT-025 — Long-form Information

**Prompt:**
> Design a visually sophisticated two-page educational article explaining how large language models work.

---

## F. INFORMATION DESIGN (KT-026 to KT-030)

### KT-026 — Infographic

**Prompt:**
> Create an infographic showing how money moves through a modern digital economy.

### KT-027 — Timeline

**Prompt:**
> Create a visual timeline showing the evolution of computing from early mechanical computers to modern AI systems.

### KT-028 — Data Visualization

**Prompt:**
> Create a clean business infographic comparing five fictional African technology markets. Use charts, numbers, labels, hierarchy and legends.

### KT-029 — Process Diagram

**Prompt:**
> Visually explain a seven-step AI product development lifecycle.

### KT-030 — Dashboard

**Prompt:**
> Design a sophisticated financial analytics dashboard showing revenue, expenses, cash flow, customer growth and profitability.

---

## G. UI / DIGITAL PRODUCT (KT-031 to KT-035)

### KT-031 — SaaS Landing Page

**Prompt:**
> Design a landing page for an AI productivity platform called **MINDSPACE**.

### KT-032 — Mobile Banking App

**Prompt:**
> Design the main dashboard of a modern mobile banking application.

### KT-033 — E-commerce Checkout

**Prompt:**
> Design a clean e-commerce checkout experience optimized for clarity and trust.

### KT-034 — Onboarding Flow

**Prompt:**
> Design a 4-screen onboarding flow for an AI creative application.

### KT-035 — Design System

**Prompt:**
> Create a small design system for a modern SaaS product including: colors, typography, buttons, cards, inputs, spacing and component states.

---

## H. PACKAGING (KT-036 to KT-040)

### KT-036 — Perfume Packaging

**Prompt:**
> Design the visual direction for a luxury perfume bottle and packaging called **ORIN NOIR**.

### KT-037 — Beverage Packaging

**Prompt:**
> Design packaging for a premium African botanical beverage.

### KT-038 — Food Packaging

**Prompt:**
> Design packaging for a premium Nigerian snack brand targeting international consumers.

### KT-039 — Cosmetics Packaging

**Prompt:**
> Design a skincare product package targeted at young professionals.

### KT-040 — Consumer Electronics Packaging

**Prompt:**
> Design the packaging system for a premium wireless audio product.

---

## I. CULTURAL / CREATIVE ART DIRECTION (KT-041 to KT-045)

### KT-041 — African Futurism

**Prompt:**
> Create a poster exploring African cities in the year 2075. Avoid cliche sci-fi imagery. The result should feel technologically advanced but culturally grounded.

### KT-042 — Cultural Festival

**Prompt:**
> Create the identity for a fictional Nigerian cultural festival celebrating music, food, technology and contemporary art.

### KT-043 — Museum Exhibition

**Prompt:**
> Design a museum exhibition identity exploring the relationship between traditional African craftsmanship and modern technology.

### KT-044 — Album Cover

**Prompt:**
> Design an album cover for a fictional Afrofuturist electronic music artist. No need for excessive text.

### KT-045 — Experimental Art Direction

**Prompt:**
> Create an experimental visual artwork exploring the relationship between humans and artificial intelligence. Treat this as contemporary art direction rather than advertising.

---

## J. ADVANCED DESIGN-AGENT TESTS (KT-046 to KT-050)

### KT-046 — Ambiguous Brief

**Prompt:**
> I need a campaign for a new product launch. The audience is young professionals and the brand wants to feel premium, modern and different. Create the design direction.

**Pass criteria:** The agent establishes a clear direction despite minimal input. It makes and states assumptions. Output is coherent, not random.

---

### KT-047 — Constraint Conflict

**Prompt:**
> Create a promotional poster containing: "50% OFF" / "LIMITED TIME" / "SHOP NOW" / product photography / brand logo / website URL / legal disclaimer. Make it visually exciting while maintaining strong hierarchy and readability.

**Pass criteria:** All 7 elements are present. Clear hierarchy exists. Design is not a cluttered mess.

---

### KT-048 — Redesign Existing Work (Analyze -> Critique -> Improve)

**Protocol:**
1. Create any intentionally mediocre poster in Kreathief.
2. Tell the agent: "Analyze this design as a senior art director. Identify the five most important weaknesses, explain why they weaken the design, then redesign the composition while preserving the brand, message and essential information."

**Pass criteria:** The agent identifies SPECIFIC weaknesses. The redesign preserves the original message while measurably improving the composition.

---

### KT-049 — Responsive Transformation

**Protocol:**
1. Create a 1080x1350 campaign design.
2. Ask: "Convert this design into: 1080x1080 / 1920x1080 / 1080x1920 / A4 portrait. Preserve the campaign's visual identity but intelligently recompose the layout for each format rather than simply scaling the original."

**Pass criteria:** Each format has a distinct composition adapted to its proportions. Elements are repositioned, not just scaled. Visual DNA is preserved.

> **CRITICAL:** This is the defining test for Kreathief's Canvas/AST architecture. A weak agent will scale. A strong agent will re-layout.

---

### KT-050 — Art Director Challenge (Gold Standard Test)

**Prompt:**
> Act as the senior creative director for this project. Develop a complete visual concept from the brief. Before generating the final composition, determine: 1. visual objective / 2. audience / 3. emotional direction / 4. hierarchy / 5. typography strategy / 6. color strategy / 7. imagery strategy / 8. composition strategy / 9. accessibility considerations / 10. production constraints. Then create the design. After creating it, critically evaluate your own work and identify anything that should be improved. Make those improvements before delivering the final design.

**Pass criteria:** Reasoning is visible and specific. The design reflects the stated strategy. Self-critique identifies real issues. Improvements are targeted and measurable.

---

## K. DESIGN INTELLIGENCE TESTS (KT-051 to KT-056)

> Added September 2026 after the competitive research update. These test the
> Design Intent Graph subsystem (`services/designIntentGraph.ts`,
> `services/semanticTransformation.ts`) — whether the agent manipulates a
> design as a *structured semantic object* rather than a bag of pixels.
> Canva AI 2.0, Lovart and Figma Weave now cover generation + layers; intent
> reasoning is the differentiated territory.

### KT-051 — Intent Preservation Under Stylistic Pressure

**Protocol:** Create any competent design. Then: "Make this design more premium."

**Pass criteria:** The edit is a *multi-variable transformation* (tracking, breathing space, hierarchy sharpening, noise reduction) executed on the existing layers. The underlying concept, copy and layer identities survive. Scored by the ΔQ gate: visual-critic score must rise while the Design Intent Graph hierarchy is unchanged.

---

### KT-052 — Local Edit Invariance

**Protocol:** "Change only the headline."

**Pass criteria:** Every non-headline layer is byte-identical before/after (position, size, color, opacity). Diff-based: automated, no judgment needed.

---

### KT-053 — Semantic Transformation Correctness

**Protocol:** "Make this feel more youthful." Then "Now make it minimal."

**Pass criteria:** The system changes *appropriate* design variables (youthful: saturation, energy, scale; minimal: decoration opacity, margins) rather than randomly mutating objects. Every change must appear in the rationale log (`criticFeedback`) — no unexplained edits.

---

### KT-054 — Constraint Preservation (BizGenEval-style)

**Protocol:** "Make this more minimal, but preserve the logo, headline, CTA and brand colors."

**Pass criteria:** Protected roles are untouched (verified against the intent graph's `protected_` nodes and locked flags) while unprotected variables visibly move. This is constraint satisfaction, not aesthetics.

---

### KT-055 — Causal Design Reasoning

**Protocol:** "Why does this design feel unbalanced?"

**Pass criteria:** The answer names specific relationships from the intent graph ("the subheadline competes with the product because both sit at importance 0.6", "CTA crowds the hero's edge at region x,y") — never generic aesthetic language. Localized critic issues (region + severity + suggested_action) are the machine-checkable form of this.

---

### KT-056 — Cross-Format Intent Preservation (KT-049 elevated)

**Protocol:** Take one 1080×1350 design through 1080×1080 → 1920×1080 → 1080×1920 via edit commands ("make it work as a banner").

**Pass criteria:** Measure whether *design intent survives*, not merely whether objects fit: the hierarchy order (headline > media > CTA), campaign message, brand palette and layer identities must persist across all formats while composition, geometry, spacing and grouping change. Scaling-only fails.

---

## Temporal Evaluation Protocol (ΔQ)

KDAB dimensions 18–19 (Self-Critique, Improvement After Critique) are measured
as a *temporal loop*, per VFLM ("Seeing is Improving", CVPR 2026):

```text
Design₀ → Critic₀ → Repair₁ → Design₁ → Critic₁ → Repair₂ → Design₂
```

- \(\Delta Q_1 = Q(D_1) - Q(D_0)\), \(\Delta Q_2 = Q(D_2) - Q(D_1)\), …
- The critique loop **must stop when marginal improvement → 0** (ΔQ ≤ 2 plateau
  or score ≥ target); burning passes past the plateau is a scoring penalty.
- Recorded per variant in `CritiquePassResult.history` and surfaced in
  `criticFeedback` as `Visual critic score: NN (ΔQ: +a → +b)`.
- A design system whose ΔQ curve is flat from pass 1 is *not self-critiquing*;
  one whose ΔQ goes negative is *making things worse* — both are distinct fails.

---

## External Benchmark Mapping

| External suite | What it validates | KDAB counterpart |
|---|---|---|
| PosterIQ (CVPR 2026) | composition, typographic hierarchy, text-image correspondence | A/C/G categories, dims 3–5 |
| GraphicDesignBench | manipulating designs as structured objects (SVG, templates, layer ops) | K section, KT-049/052/056 |
| BizGenEval (Microsoft) | dense commercial constraint satisfaction | KT-047, KT-054, S-02 |
| AesEval-Bench (Microsoft) | localized aesthetic defect detection | dims 18–19 + localized critic issues (region/severity/action) |
| STRICT | rendered-text fidelity under stress | S-04 + `enforceTextFidelity` gate |
| VFLM | visual feedback loop value | Temporal ΔQ protocol |

---

## The Judge Stack Contract (KT-057 to KT-061)

> Added September 2026 (Research Round 2 — "The Architecture War", §22–§25).
> Critique is no longer one model with one number. Kreathief runs a stack of
> specialized judges whose output is an *executes-into-repair contract*, not
> a review comment.

### Judges

| # | Judge | Implementation | Answers | Cost |
|---|-------|----------------|---------|------|
| 1 | Geometry | `utils/geometryJudge.ts` — pure math | overlap, clipping, safe zones, alignment, spacing rhythm | free, deterministic |
| 2 | Semantic | intent graph digest in `services/designIntentGraph.ts` + brief | does the design still *say* what the brief said | prompt fragment |
| 3 | Aesthetic | `services/visualCriticService.ts` (VLM looking at the render) | hierarchy feel, balance, color, premium-ness | vision tokens |
| 4 | Production | `solveDesignLayers` under the constraint gate | would this ship at export size | free, deterministic |

### Judge Output Contract

Every finding from every judge MUST have all five fields. A finding missing
evidence, location or a proposed operation is treated as noise and dropped:

```json
{
  "issue": "text_overlap",
  "severity": 0.74,
  "region": { "x": 120, "y": 880, "width": 640, "height": 140 },
  "targetIds": ["layer_18", "layer_22"],
  "evidence": ["'SUMMER' collides with 'drops june 1'", "overlap covers 31% of the smaller block"],
  "repair": { "type": "separate", "targetId": "layer_22", "awayFromId": "layer_18", "minGap": 24 }
}
```

Bare scores (`{"score": 72}`) are almost useless for repair — the score is a
rollup of findings, never a substitute for them.

### LLM Proposes, Compiler Decides

```text
Judge ──► RepairOperation ──► RepairEngine.runRepair()
                                    │  candidate = execute(op, layers)
                                    │  violations = validateDesignConstraints(candidate)
                                    ▼
                        accept ONLY if violations do not increase
                                    │
                                    ▼
                    deterministic solver as FINAL gate —
        and the solver itself can be rejected (constraint graph outranks the grid)
```

Code: `services/repairEngine.ts`. No judge, VLM patch or solver clamp reaches
the canvas without passing this gate — the Adobe warning ("never allow the
critic to blindly overwrite the design") as an executable invariant.

### Disagreement Is the Signal

Judges are correlated with different things — geometry with correctness,
vision with human taste. Their *delta* routes the next intervention:

| Geometry | Vision | Diagnosis | Action |
|---|---|---|---|
| ≥ 85 | ≥ 75 | healthy | ship |
| ≥ 85 | < 60 | technically clean, aesthetically weak | escalate to artistic pass (strategy/color/type), **not** repair |
| < 70 | ≥ 70 | pretty but structurally broken | run repair batch, suppress style churn |
| < 70 | < 70 | both agree it's bad | full loop: repair → critique → re-repair |

Surfaced per variant as `Judges: geometry NN/100, vision NN/100 — …` in
`criticFeedback` (`judgesSummary()` in the orchestrator).

### HIR — Human Intervention Rate

The metric that separates a design *compiler* from an image generator on
free-form "make it better" requests (Research Round 2 §14):

\[ \text{HIR} = \frac{\text{manual modifications}}{\text{total meaningful modifications}} \]

- A system that ships a 72-scoring design needing 12 manual edits is *worse*
than one needing 2 edits, even at equal aesthetic score — the pipeline didn't
finish the job, the human did.
- **We want HIR to decrease.** Every accepted repair operation, every
constraint violation prevented and every disagreement correctly routed is one
manual edit the human no longer has to make.
- Machine-checkable proxy used today: post-gate `remainingViolations` count +
rejected-op explanations (below); product-grade measurement (edits per
accepted variant in real sessions) lands with the auto-KDAB telemetry harness.
- Pair with **Time-to-Client-Ready**: prompt → AI generation → AI refinement
→ human refinement → shipped. Shrinking the last stage is the whole point.

### Repair Efficiency

- A repair batch is efficient when ≥ 1 operation is accepted **and** the
post-repair geometry score strictly increases.
- Accepted/rejected op counts ship in `criticFeedback
` (`Geometry judge: NN/100 after repair (N op(s) accepted, M rejected by constraints)`).
- KDAB acceptance requires the rejected ops to be *explainable* from the
constraint list — an unexplained rejection is a compiler bug.

### Tests

### KT-057 — Clean-Design Convergence
**Protocol:** Generate a design, run the full polish gate.
**Pass criteria:** post-repair geometry ≥ 85, zero remaining constraint
violations, ΔQ plateau reached within the pass budget (no wasted vision calls).

### KT-058 — Artistic Escalation on Disagreement
**Protocol:** Intentionally feed a visually mediocre but geometrically clean
design (aligned, in-bounds, but flat palette / timid hierarchy).
**Pass criteria:** `judgesSummary` reports DISAGREEMENT (geometry ≥ 85,
vision < 60) and the next intervention is stylistic (strategy/type/color),
not positional — layer x/y must not change.

### KT-059 — Structural Repair on Inverse Disagreement
**Protocol:** Feed a beautiful design with overlapping text and a
headline escaping the safe zone.
**Pass criteria:** geometry < 70 with vision ≥ 70; repair batch accepts a
`separate` + `contain` operation; post-repair copy is byte-identical (KT-052
diff) — fixed without regenerating.

### KT-060 — Localized Edit Discipline (zero-collateral HIR)
**Protocol:** "Make the headline more impactful."
**Pass criteria:** only headline-bearing layers change; every other layer
byte-identical — a repair that needs the human to undo collateral damage
registers as manual modifications in the numerator of HIR.

### KT-061 — Constraint Precedence Over the Solver
**Protocol:** Design where the grid snap would push a protected layer out of
its `protected_immutable` snapshot position.
**Pass criteria:** `runRepair` logs the solver output as rejected
("constraint graph outranks the grid") and the protected layer is untouched.

---

## The Clarification Gate (KT-062 to KT-067)

> Added September 2026 (Design Clarification Engine research). A generation
> harness that answers every vague prompt instantly is confident, not helpful.
> The gate lives in `services/clarificationEngine.ts`, wired into
> `runAgenticWorkflow` (`store/slices/agentSlice.ts`) — it gates *execution*,
> not a chat sidebar. Core rule from the research: **clarify only when
> uncertainty materially affects the outcome; never interrogate.**

### The Decision Machine

```text
prompt ─► intent extraction (deterministic: artifact / purpose / audience /
         format / mood / quoted text / contact facts / contradictions)
      ─► context inspection FIRST (canvas size, geometry judge findings,
         brand kit, answers already given this session)
      ─► requirements scored blocking / important / optional
      ─► ready ──────────────► execute
         ready_with_assumptions ► execute + disclose the Assumption Ledger
         needs_questions ──────► ask ≤3 questions, worst-gap first
         blocked ──────────────► one resolution question (contradictions,
                                 missing business facts)
```

Answers arrive as option chips, free text or the composer (natural language);
`"use your judgment"` is always available and routes to
`ready_with_assumptions` — never blocked. Business facts (prices, dates,
phones, addresses, claims) are **never invented**: missing → ask, or mark the
ledger entry as an explicit placeholder.

### Metrics (research §14)

| Metric | Definition | Target |
|---|---|---|
| Clarification precision | questions asked that were materially needed | ≥ 0.9 |
| Clarification recall | materially-underspecified briefs that received questions | ≥ 0.85 |
| Question efficiency | answered questions ÷ questions asked | ≥ 0.7 (low = annoying) |
| Unnecessary-question rate | gaps resolvable from context yet asked about | ≤ 0.1 |
| Assumption transparency | executed runs whose ledger was shown before/at delivery | 100% |
| Human Intervention Rate (HIR) | manual ÷ total meaningful edits — must keep falling | ↓ trend |

Precision and unnecessary-question rate are the same failure watched from two
sides: **every question the agent could have answered by looking is noise.**

### Tests

### KT-062 — Vague Prompt Asks (Recall)
**Protocol:** "Make a flyer for my business" on an empty canvas.
**Pass criteria:** status `needs_questions`; ≤3 questions; first question
targets the subject/objective gap; zero layers generated yet.

### KT-063 — Clear Prompt Fires Silently (Precision)
**Protocol:** "Promote Saturday's Jollof cook-off (1pm-6pm, Ibadan) to young
professionals — 1080×1350 Instagram post, bold and colorful, headline:
'FIRE & FLAVOR'."
**Pass criteria:** status `ready`, **zero** questions, immediate execution —
an agent that asks here has failed the precision metric.

### KT-064 — Judgment Escape Hatch
**Protocol:** Any vague prompt + "use your judgment" (or clicking the card
button).
**Pass criteria:** never blocked; execution proceeds and every inferred gap
appears as a labeled, reversible Assumption Ledger entry — including an
explicit *MISSING* note where business facts were absent (no invented
phone numbers, no invented prices).

### KT-065 — Context Resolves, Agent Stays Quiet
**Protocol:** With a 1080×1920 canvas open and a brand kit active, prompt
that omits format and audience.
**Pass criteria:** no format/audience question — the context inspector
resolved both; ledger shows `system_default`/`brand_context` sources.

### KT-066 — Design-by-Inspection (Example C flow)
**Protocol:** Existing design on canvas, then "make it better."
**Pass criteria:** exactly one scope question built from *real* geometry
judge findings ("I noticed: elements hanging off the edge…"), not a generic
decoration menu; answering re-runs without re-asking.

### KT-067 — No Interrogation Loops
**Protocol:** (a) prompt with both "playful" and "corporate"; (b) answer one
chip, then let the workflow re-assess.
**Pass criteria:** (a) exactly one contradiction-resolution question, not
three; (b) answered keys never re-asked (sessionAnswers), and an enriched
("Design brief …") prompt never re-triggers assessment at all.

---

## Supplementary Tests

### S-01 — Iterative Criticism Reception

After KT-011 generation, sequentially apply:
1. "This feels generic. Diagnose exactly why and make three targeted improvements."
2. "Better, but the typography still feels weak. Improve only the typography and spacing."
3. "Now make the design feel 30% more premium while preserving the existing concept."
4. "Now make a mobile version without simply scaling the desktop design."

### S-02 — Design Intent Preservation

Create a good design manually, then: "Improve this design, but preserve: logo, brand colors, headline, product image, overall concept. Only change elements that genuinely improve the composition."

### S-03 — Negative Space Mastery

1. "Create a premium announcement using only typography. No images, illustrations, gradients, icons or decorative graphics."
2. "Create a premium advertisement using only one image, one headline and one CTA."
3. "Create a design where 60% of the canvas remains negative space."

### S-04 — Text Fidelity

> The poster must contain exactly: **KREATHIEF** / **CREATE WITHOUT LIMITS** / **AI NATIVE CREATIVE STUDIO** / **Kreathief.com** — Do not alter, paraphrase, misspell or add words.

### S-05 — QA Critic Isolation Test

Feed intentionally broken designs. Verify the critic identifies OBJECTIVE defects, not subjective preferences.

---

## Regression Tracking

| Test ID | Date | Model Version | Prompt Version | Score (/200) | Ship? | Notes |
|---------|------|---------------|----------------|-------------|-------|-------|
| KT-001 | | | | | | |
| KT-002 | | | | | | |
| KT-003 | | | | | | |
| ... | | | | | | |
| KT-050 | | | | | | |
| KT-051 | | | | | | |
| ... | | | | | | |
| KT-056 | | | | | | |
| KT-057 | | | | | | |
| ... | | | | | | |
| KT-061 | | | | | | |
| KT-062 | | | | | | |
| ... | | | | | | |
| KT-067 | | | | | | |

**Aggregate Metrics:**
- Average score across all 67 tests: __ / 200
- "Would ship" percentage: __%
- Weakest category: __
- Strongest category: __
- HIR trend (manual edits per accepted variant, must fall): __
