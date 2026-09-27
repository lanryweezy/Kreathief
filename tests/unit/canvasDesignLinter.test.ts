import { describe, it, expect } from 'vitest';
import {
  lintArtboardDesign,
  applyLintAutoFix,
  applyAllLintAutoFixes,
  getEffectiveBackgroundColor,
} from '../../services/canvasDesignLinter';
import { Artboard, TextLayer, ShapeLayer } from '../../types';

describe('Canvas Design Linter & Real-Time Health Engine', () => {
  const createArtboardWithDefects = (): Artboard => ({
    id: 'ab_test_linter',
    name: 'Lint Test Artboard',
    width: 1000,
    height: 1000,
    x: 0,
    y: 0,
    backgroundColor: '#0a0a14',
    layers: [
      // 1. Dark Background
      {
        id: 'layer_bg',
        type: 'rectangle',
        name: 'Background Base',
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        color: '#0a0a14',
        visible: true,
      } as ShapeLayer,

      // 2. Yellow Button Container
      {
        id: 'layer_btn_box',
        type: 'rectangle',
        name: 'CTA Button Container',
        x: 350,
        y: 800,
        width: 300,
        height: 60,
        color: '#ffcc00', // Bright Yellow
        visible: true,
      } as ShapeLayer,

      // 3. Contrast Failure on Yellow Button (Light gray text on bright yellow: ~1.4:1 contrast failure!)
      {
        id: 'layer_btn_text',
        type: 'text',
        name: 'CTA Button Label',
        text: 'CLAIM ACCESS NOW',
        fontSize: 18,
        fontWeight: 'bold',
        x: 370,
        y: 818,
        width: 260,
        height: 24,
        color: '#e0e0e0', // Low contrast on #ffcc00!
        visible: true,
      } as TextLayer,

      // 4. Primary Headline
      {
        id: 'layer_headline',
        type: 'text',
        name: 'Hero Headline',
        text: 'THE NEXT GENERATION',
        fontSize: 48,
        fontWeight: 'bold',
        x: 200,
        y: 200,
        width: 600,
        height: 60,
        color: '#ffffff',
        visible: true,
      } as TextLayer,

      // 5. Hierarchy Inversion: Subheadline with 64px font size (larger than headline's 48px!)
      {
        id: 'layer_subheadline',
        type: 'text',
        name: 'Hero Subheadline',
        text: 'A sleek subtitle that should not overpower the title',
        fontSize: 64, // Inverted!
        fontWeight: 'normal',
        x: 150,
        y: 300,
        width: 700,
        height: 80,
        color: '#ffffff',
        visible: true,
      } as TextLayer,

      // 6. Safe Zone Bleed: Positioned at x: 5, bleeding into the 25px safe margin
      {
        id: 'layer_bleed_badge',
        type: 'rectangle',
        name: 'Bleed Badge',
        x: 5, // Bleed!
        y: 100,
        width: 120,
        height: 40,
        color: '#ff0055',
        visible: true,
      } as ShapeLayer,

      // 7. Off-Axis Drift: Center is (1000 - 400)/2 = 300. Layer is at x: 303 (3px drift!)
      {
        id: 'layer_drift_card',
        type: 'rectangle',
        name: 'Drift Card',
        x: 303, // 3px off-center!
        y: 500,
        width: 400,
        height: 200,
        color: '#1a1a2e',
        visible: true,
      } as ShapeLayer,
    ],
  });

  it('accurately resolves effective background color underneath overlapping elements', () => {
    const artboard = createArtboardWithDefects();
    const btnText = artboard.layers.find((l) => l.id === 'layer_btn_text')!;
    const effectiveBg = getEffectiveBackgroundColor(btnText, artboard.layers, artboard.backgroundColor!);

    // Should detect the yellow button color (#ffcc00), NOT the dark artboard background (#0a0a14)!
    expect(effectiveBg).toBe('#ffcc00');
  });

  it('detects WCAG contrast, hierarchy inversion, safe-zone bleed, and off-axis drift defects', () => {
    const artboard = createArtboardWithDefects();
    const report = lintArtboardDesign(artboard);

    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(80);
    expect(report.issues.length).toBeGreaterThanOrEqual(4);

    // Verify WCAG contrast failure on the button label
    const contrastIssue = report.issues.find((i) => i.rule === 'RULE_WCAG_CONTRAST' && i.layerId === 'layer_btn_text');
    expect(contrastIssue).toBeDefined();
    expect(contrastIssue?.severity).toBe('error');
    expect(contrastIssue?.autoFix?.patch.color).toBe('#000000'); // Recommends Black for yellow bg!

    // Verify Hierarchy Inversion
    const hierarchyIssue = report.issues.find((i) => i.rule === 'RULE_HIERARCHY_INVERSION');
    expect(hierarchyIssue).toBeDefined();
    expect(hierarchyIssue?.autoFix?.patch.fontSize).toBeLessThanOrEqual(48);

    // Verify Safe Zone Bleed
    const bleedIssue = report.issues.find((i) => i.rule === 'RULE_SAFE_ZONE_BLEED' && i.layerId === 'layer_bleed_badge');
    expect(bleedIssue).toBeDefined();
    expect(bleedIssue?.autoFix?.patch.x).toBeGreaterThanOrEqual(25);

    // Verify Off-Axis Drift
    const driftIssue = report.issues.find((i) => i.rule === 'RULE_OFF_AXIS_DRIFT' && i.layerId === 'layer_drift_card');
    expect(driftIssue).toBeDefined();
    expect(driftIssue?.autoFix?.patch.x).toBe(300); // Perfectly centered!
  });

  it('applies surgical 1-click auto-fixes to repair canvas defects and restore health score', () => {
    const artboard = createArtboardWithDefects();
    const initialReport = lintArtboardDesign(artboard);
    expect(initialReport.score).toBeLessThan(70);

    // Execute 1-click Auto-Fix All
    const healedArtboard = applyAllLintAutoFixes(artboard, initialReport.issues);
    const postFixReport = lintArtboardDesign(healedArtboard);

    // Health score should jump back up substantially
    expect(postFixReport.score).toBeGreaterThanOrEqual(90);

    // Text on yellow button should now be high-contrast Black
    const fixedText = healedArtboard.layers.find((l) => l.id === 'layer_btn_text') as TextLayer;
    expect(fixedText.color).toBe('#000000');

    // Drift card should now be perfectly centered at x: 300
    const fixedCard = healedArtboard.layers.find((l) => l.id === 'layer_drift_card');
    expect(fixedCard?.x).toBe(300);

    // Bleed badge should be snapped inside safe zone (>= 25)
    const fixedBadge = healedArtboard.layers.find((l) => l.id === 'layer_bleed_badge');
    expect(fixedBadge?.x).toBeGreaterThanOrEqual(25);
  });
});
