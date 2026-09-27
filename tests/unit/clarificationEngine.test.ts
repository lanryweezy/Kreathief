/**
 * Design Clarification Engine tests (KDAB KT-062..KT-067).
 * Pure deterministic coverage of services/clarificationEngine.ts —
 * ask/don't-ask decisions, the Assumption Ledger and answer folding.
 * No network, no DOM, no store.
 */
import { describe, it, expect } from 'vitest';
import {
  assessDesignRequest,
  applyClarificationAnswer,
  briefToPrompt,
  describeAssumptions,
  geometryIssuesToWeaknesses,
  ClarificationContext,
} from '../../services/clarificationEngine';

const EMPTY: ClarificationContext = { hasExistingDesign: false };
const keys = (r: ReturnType<typeof assessDesignRequest>) => r.questions.map((q) => q.requirementKey);

describe('KT-062 — vague prompt asks (recall)', () => {
  it('blocks on a materially vague brief and asks ≤3 worst-gap-first questions', () => {
    const r = assessDesignRequest('Make a flyer for my business', EMPTY);
    expect(r.status).toBe('needs_questions');
    expect(r.executionMode).toBe('require_clarification');
    expect(r.questions.length).toBeGreaterThan(0);
    expect(r.questions.length).toBeLessThanOrEqual(3);
    // The blocking gap (what is this even about?) must lead the round.
    expect(r.questions[0].requirementKey).toBe('subject');
    expect(r.missingRequirements.some((m) => m.key === 'subject' && m.importance === 'blocking')).toBe(true);
  });

  it('every question offers quick-select or free-text — never a dead end', () => {
    const r = assessDesignRequest('Design a poster for our new app', EMPTY);
    for (const q of r.questions) {
      expect(q.allowFreeText || q.options.length > 0).toBe(true);
    }
  });
});

describe('KT-063 — clear prompt fires silently (precision)', () => {
  it('a complete brief gets ZERO questions and executes immediately', () => {
    const r = assessDesignRequest(
      "Promote the Saturday Jollof cook-off (1pm to 6pm, Ibadan) to young professionals — " +
        "1080x1350 Instagram post, bold and colorful, headline: 'FIRE & FLAVOR'",
      EMPTY
    );
    expect(r.status).toBe('ready');
    expect(r.questions).toHaveLength(0);
    expect(r.nextAction).toBe('generate');
    expect(r.confidence).toBeGreaterThan(0.9);
  });

  it('does not interrogate an art-director style brief with a proper subject', () => {
    const r = assessDesignRequest(
      'Launch poster for Nova Africa AI Summit — futuristic, targeting a young developer audience, 1080x1350',
      EMPTY
    );
    expect(r.questions).toHaveLength(0);
    expect(r.status).toBe('ready');
  });
});

describe('KT-064 — judgment escape hatch', () => {
  it('"use your judgment" is never blocked and discloses a reversible ledger', () => {
    const r = assessDesignRequest('Make a poster for my new product — use your judgment.', EMPTY);
    expect(r.status).toBe('ready_with_assumptions');
    expect(r.questions).toHaveLength(0);
    const cats = r.assumptions.map((a) => a.category);
    expect(cats).toContain('Tone');
    expect(cats).toContain('Audience');
    expect(cats).toContain('Call to action');
    // CTA is a marked placeholder — offers and prices are never invented.
    const cta = r.assumptions.find((a) => a.category === 'Call to action');
    expect(cta?.statement).toMatch(/placeholder/i);
    expect(r.assumptions.every((a) => a.reversible)).toBe(true);
    expect(r.assumptions.every((a) => !a.userConfirmed)).toBe(true);
  });

  it('mentioned-but-missing contact facts become an explicit MISSING entry, never a fake number', () => {
    const r = assessDesignRequest(
      'Make a flyer for my bakery, include my phone number and price — you decide.',
      EMPTY
    );
    expect(r.status).toBe('ready_with_assumptions');
    const contact = r.assumptions.find((a) => a.id === 'a_contact');
    expect(contact).toBeDefined();
    expect(contact?.statement).toMatch(/MISSING/);
    expect(contact?.statement).toMatch(/not a made-up value|never/i);
  });

  it('proceeding via the ledger still produces an execution-ready enriched prompt', () => {
    const r = assessDesignRequest('Make a flyer for my business. Just make the first draft.', EMPTY);
    expect(r.status).toBe('ready_with_assumptions');
    expect(r.enrichedIntent.startsWith('Design brief')).toBe(true);
    expect(r.enrichedIntent).toContain('Working assumptions');
  });
});

describe('KT-065 — context resolves, agent stays quiet', () => {
  it('an open canvas answers the format question; no canvas-ask, no format noise', () => {
    const r = assessDesignRequest('Create a flyer for my business', {
      hasExistingDesign: false,
      canvasSize: { width: 1080, height: 1920 },
      hasBrandKit: true,
    });
    expect(keys(r)).not.toContain('format');
    expect(r.brief.format).toBe('1080×1920');
    const formatAssumption = r.assumptions.find((a) => a.id === 'a_format');
    expect(formatAssumption?.source).toBe('system_default');
    expect(formatAssumption?.statement).toContain('1080×1920');
  });
});

describe('KT-066 — design-by-inspection (vague edit on an open canvas)', () => {
  const boardCtx: ClarificationContext = {
    hasExistingDesign: true,
    designWeaknesses: ['elements hanging off the edge', 'colliding text blocks'],
  };

  it('"make it better" asks ONE scope question built from real geometry findings', () => {
    const r = assessDesignRequest('make it better', boardCtx);
    expect(r.questions).toHaveLength(1);
    expect(r.questions[0].requirementKey).toBe('improvementScope');
    expect(r.questions[0].question).toContain('I noticed: elements hanging off the edge');
    expect(r.questions[0].options).toContain('All of them, worst first');
    // Not blocking — the agent could already start; this is a targeting question.
    expect(r.executionMode).toBe('ask_targeted_questions');
  });

  it('answering the scope question never re-asks it', () => {
    const next = applyClarificationAnswer(
      'make it better',
      boardCtx,
      'improvementScope',
      'All of them, worst first'
    );
    expect(keys(next)).not.toContain('improvementScope');
    expect(next.status).not.toBe('needs_questions');
  });
});

describe('KT-067 — no interrogation loops', () => {
  it('a contradictory brief gets exactly ONE resolution question, not three', () => {
    const r = assessDesignRequest('Make a poster that is playful but corporate', EMPTY);
    expect(r.questions.filter((q) => q.requirementKey === 'contradiction')).toHaveLength(1);
    expect(r.missingRequirements.some((m) => m.key === 'contradiction' && m.importance === 'blocking')).toBe(true);
  });

  it('an answered contradiction is never resurrected', () => {
    const next = applyClarificationAnswer(
      'Make a poster that is playful but corporate',
      EMPTY,
      'contradiction',
      'A blend — one clearly dominant'
    );
    expect(keys(next)).not.toContain('contradiction');
    // "A blend" grants judgment → proceed on disclosed assumptions, not blocked.
    expect(next.status).toBe('ready_with_assumptions');
  });

  it('an answered subject is never re-asked; remaining gaps downgrade to targeted', () => {
    const next = applyClarificationAnswer(
      'Make a flyer for my business',
      EMPTY,
      'subject',
      'Kreathief — an AI creative studio'
    );
    expect(keys(next)).not.toContain('subject');
    expect(next.brief.subject).toBe('Kreathief — an AI creative studio');
    // The blocking gap is gone — the round is now sharpening, not gatekeeping.
    expect(next.executionMode).toBe('ask_targeted_questions');
  });

  it('business facts arrive via free text and retire the blocking question', () => {
    const first = assessDesignRequest(
      'Promote Zenith Bakery next week — include the date and price',
      EMPTY
    );
    expect(keys(first)).toContain('exactContent');
    const answered = applyClarificationAnswer(
      'Promote Zenith Bakery next week — include the date and price',
      EMPTY,
      'exactContent',
      'Saturday 10am-4pm, ₦2,500 — 08012345678'
    );
    expect(keys(answered)).not.toContain('exactContent');
    // The blocking facts gap is gone; only soft targeting questions remain.
    expect(answered.executionMode).toBe('ask_targeted_questions');
  });
});

describe('brief + ledger helpers', () => {
  it('briefToPrompt folds facts and marks assumption provenance', () => {
    const r = assessDesignRequest('Use your judgment: launch banner for Zenith Fitness, premium look', EMPTY);
    const p = briefToPrompt('launch banner for Zenith Fitness', r.brief);
    expect(p.startsWith('Design brief (from user request):')).toBe(true);
    expect(p).toContain('Subject:');
  });

  it('describeAssumptions flags unconfirmed entries', () => {
    const r = assessDesignRequest('Make a poster for my new product — surprise me', EMPTY);
    const lines = describeAssumptions(r.assumptions);
    expect(lines.length).toBe(r.assumptions.length);
    expect(lines.every((l) => /not confirmed|needs confirmation/.test(l))).toBe(true);
  });

  it('geometry issue codes map to human weaknesses, deduplicated', () => {
    expect(
      geometryIssuesToWeaknesses([
        'out_of_bounds',
        'text_overlap',
        'out_of_bounds',
        'unknown_future_issue',
      ])
    ).toEqual(['elements hanging off the edge', 'colliding text blocks']);
  });
});
