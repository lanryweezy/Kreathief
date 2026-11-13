import { describe, it, expect } from 'vitest';
import {
  KDAB_CORE_TASKS,
  classifyKDABScore,
  evaluateVariantOnKDAB,
  evaluateClarificationSuite,
  evaluateInPlaceTransformTask,
} from '../../services/kdabBenchmarkService';
import { Layer } from '../../types';

describe('KDAB Benchmark Evaluation Suite', () => {
  it('classifies 200-point rubric scores into the official KDAB tiers', () => {
    expect(classifyKDABScore(188)).toBe('Exceptional / Professional-grade');
    expect(classifyKDABScore(168)).toBe('Strong');
    expect(classifyKDABScore(148)).toBe('Good but inconsistent');
    expect(classifyKDABScore(125)).toBe('Intermediate');
    expect(classifyKDABScore(105)).toBe('Weak');
    expect(classifyKDABScore(82)).toBe('Not production-ready');
  });

  it('scores a clean, brief-faithful multi-layer design in the Strong/Exceptional tier with Ship=YES', () => {
    const task = KDAB_CORE_TASKS[5]; // KT-006 (1080x1350 Instagram campaign)
    const cleanLayers: Layer[] = [
      {
        id: 'bg-1',
        type: 'rectangle',
        name: 'Background Stage',
        x: 0,
        y: 0,
        width: 1080,
        height: 1350,
        color: '#090d16',
        cornerRadius: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 'hero-1',
        type: 'image',
        name: 'Editorial Hero Subject',
        x: 140,
        y: 160,
        width: 800,
        height: 540,
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
        naturalWidth: 800,
        naturalHeight: 540,
        flipX: false,
        flipY: false,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 'headline-1',
        type: 'text',
        name: 'Headline',
        x: 120,
        y: 780,
        width: 840,
        height: 180,
        text: 'THE FUTURE OF AFRICAN CREATIVITY IS BEING BUILT NOW.',
        fontFamily: 'Syne',
        fontSize: 64,
        fontWeight: '800',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#f8fafc',
        textAlign: 'left',
        letterSpacing: -1,
        lineHeight: 1.1,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 'subhead-1',
        type: 'text',
        name: 'Subheadline',
        x: 120,
        y: 1000,
        width: 720,
        height: 80,
        text: 'Lagos Design Week 2026 — Curated Studios & Spatial Architecture',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: '500',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#cbd5e1',
        textAlign: 'left',
        letterSpacing: 0,
        lineHeight: 1.4,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
    ];

    const result = evaluateVariantOnKDAB(
      {
        id: 'var-clean',
        themeIdea: 'Editorial Tech Direction',
        layers: cleanLayers,
        width: 1080,
        height: 1350,
        source: 'blueprint',
        criticFeedback: [
          'Geometry judge: 100/100, no structural findings',
          'Visual critic score: 91/100',
        ],
      },
      task
    );

    expect(result.totalScore).toBeGreaterThanOrEqual(175);
    expect(result.geometryScore).toBeGreaterThanOrEqual(85);
    expect(result.shipVerdict).toBe('YES');
  });

  it('penalizes designs that drop required brief copy or introduce text overlap', () => {
    const task = KDAB_CORE_TASKS[5]; // KT-006
    const brokenLayers: Layer[] = [
      {
        id: 'bg-1',
        type: 'rectangle',
        name: 'Background',
        x: 0,
        y: 0,
        width: 1080,
        height: 1350,
        color: '#ffffff',
        cornerRadius: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 't1',
        type: 'text',
        name: 'Headline',
        x: 100,
        y: 200,
        width: 800,
        height: 140,
        text: 'Generic Paraphrased Headline',
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: '700',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#f1f5f9', // terrible contrast on white bg
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 't2',
        type: 'text',
        name: 'Body colliding',
        x: 100,
        y: 220, // overlaps t1
        width: 800,
        height: 120,
        text: 'Colliding subtitle layer',
        fontFamily: 'Inter',
        fontSize: 36,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#e2e8f0',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
    ];

    const result = evaluateVariantOnKDAB(
      {
        id: 'var-broken',
        themeIdea: 'Broken draft',
        layers: brokenLayers,
        width: 1080,
        height: 1350,
        source: 'procedural',
      },
      task
    );

    expect(result.shipVerdict).toBe('NO');
    expect(result.notes.some((n) => n.includes('Missing required brief copy'))).toBe(true);
  });

  it('meets KDAB clarification precision (>= 0.9) and recall (>= 0.85) targets on KT-062..KT-066', () => {
    const metrics = evaluateClarificationSuite();
    expect(metrics.precision).toBeGreaterThanOrEqual(0.9);
    expect(metrics.recall).toBeGreaterThanOrEqual(0.85);
    expect(metrics.unnecessaryQuestionRate).toBeLessThanOrEqual(0.1);
  });

  it('preserves layer identities during edit-in-place transformations (KT-051..KT-056)', async () => {
    const seedLayers: Layer[] = [
      {
        id: 'keep-bg',
        type: 'rectangle',
        name: 'Background',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        color: '#111827',
        cornerRadius: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 'keep-headline',
        type: 'text',
        name: 'Headline',
        x: 100,
        y: 240,
        width: 880,
        height: 160,
        text: 'ORIN FRAGRANCE',
        fontFamily: 'Syne',
        fontSize: 64,
        fontWeight: '700',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#ffffff',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
      {
        id: 'keep-sub',
        type: 'text',
        name: 'Subheadline',
        x: 160,
        y: 460,
        width: 760,
        height: 80,
        text: 'Architectural Luxury from Lagos',
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#d1d5db',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
      },
    ];

    const res = await evaluateInPlaceTransformTask(
      'Make this design feel more minimal and luxury while keeping the headline',
      seedLayers,
      { width: 1080, height: 1080 }
    );

    expect(res.transformed).not.toBeNull();
    expect(res.preservedLayerIds).toBe(true);
    expect(res.postGeometryScore).toBeGreaterThanOrEqual(75);
  });
});
