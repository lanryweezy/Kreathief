import { describe, it, expect } from 'vitest';
import {
  decompileArtboardToAST,
  decompileArtboardToHierarchicalAST,
  reconstructLayersFromAST,
  generateReverseEngineeredPrompt,
} from '../../services/designReverseEngine';
import { Artboard, TextLayer, ShapeLayer } from '../../types';

describe('Design Reverse-Engineering & AST Prompt Synthesis Engine', () => {
  const sampleArtboard: Artboard = {
    id: 'ab_spade',
    name: 'Spade Gaming Promo',
    width: 1080,
    height: 1080,
    x: 0,
    y: 0,
    backgroundColor: '#00E050',
    layers: [
      {
        id: 'l_bg',
        type: 'rectangle',
        name: 'Background Radial',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        color: '#00E050',
        gradient: 'radial-gradient(circle, #00E050 0%, #004D1B 100%)',
      } as any,
      {
        id: 'l_badge_pill',
        type: 'rectangle',
        name: 'Badge Pill Shape',
        x: 390,
        y: 345,
        width: 300,
        height: 50,
        color: '#000000',
        cornerRadius: 25,
      } as any,
      {
        id: 'l_badge',
        type: 'text',
        name: 'Get Up To Badge',
        text: 'GET UP TO',
        fontSize: 28,
        fontFamily: 'Inter',
        x: 400,
        y: 350,
        width: 280,
        height: 40,
      } as any,
      {
        id: 'l_headline',
        type: 'text',
        name: 'Main Reward',
        text: '₦300,000',
        fontSize: 88,
        fontFamily: 'Kreathief001',
        x: 200,
        y: 420,
        width: 680,
        height: 100,
      } as any,
      {
        id: 'l_cta_btn',
        type: 'rectangle',
        name: 'CTA Button',
        x: 140,
        y: 790,
        width: 800,
        height: 50,
        color: '#ffcc00',
        cornerRadius: 12,
        shadow: { blur: 10, color: 'rgba(0,0,0,0.4)', offsetX: 0, offsetY: 4 },
      } as any,
      {
        id: 'l_cta',
        type: 'text',
        name: 'CTA Subtext',
        text: 'JOIN SPADE.NG NOW',
        fontSize: 20,
        fontFamily: 'Inter',
        x: 150,
        y: 800,
        width: 780,
        height: 30,
      } as any,
    ],
  };

  it('decompiles an Artboard into a validated KreathiefSceneGraph AST with rich style extraction', () => {
    const ast = decompileArtboardToAST(sampleArtboard);

    expect(ast.schemaVersion).toBe('1.0.0');
    expect(ast.document.canvas.width).toBe(1080);
    expect(ast.document.canvas.height).toBe(1080);
    expect(ast.sceneGraph.layers).toHaveLength(6);

    // Verify coordinate normalization
    const headlineNode = ast.sceneGraph.layers.find((l) => l.name === 'Main Reward');
    expect(headlineNode).toBeDefined();
    expect(headlineNode?.transform.bounds.x).toBeCloseTo(200 / 1080, 2);
    expect(headlineNode?.style.content).toBe('₦300,000');

    // Verify gradient extraction
    const bgNode = ast.sceneGraph.layers.find((l) => l.name === 'Background Radial');
    expect(bgNode?.style.gradient).toContain('radial-gradient');
  });

  it('hierarchically groups CTA button clusters and Badge clusters into compound components', () => {
    const ast = decompileArtboardToHierarchicalAST(sampleArtboard);

    // Should group (l_cta_btn + l_cta) into a CTA cluster and (l_badge_pill + l_badge) into a Badge cluster
    const ctaCluster = ast.sceneGraph.layers.find((l) => l.role === 'cta_cluster');
    expect(ctaCluster).toBeDefined();
    expect(ctaCluster?.type).toBe('container');
    expect(ctaCluster?.children).toHaveLength(2);

    const badgeCluster = ast.sceneGraph.layers.find((l) => l.role === 'badge_cluster');
    expect(badgeCluster).toBeDefined();
    expect(badgeCluster?.type).toBe('container');
    expect(badgeCluster?.children).toHaveLength(2);
  });

  it('accurately reconstructs editable canvas layers from a hierarchical AST with group mappings', () => {
    const ast = decompileArtboardToHierarchicalAST(sampleArtboard);
    const reconstructedLayers = reconstructLayersFromAST(ast);

    expect(reconstructedLayers.length).toBeGreaterThanOrEqual(6);

    // Verify text layers are restored with verbatim content
    const headline = reconstructedLayers.find((l) => l.type === 'text' && (l as TextLayer).text === '₦300,000');
    expect(headline).toBeDefined();
    expect((headline as TextLayer).fontFamily).toBe('Kreathief001');

    // Verify compound group parent exists and children have groupId
    const groupLayer = reconstructedLayers.find((l) => (l as any).isGroup);
    expect(groupLayer).toBeDefined();

    const childInGroup = reconstructedLayers.find((l) => l.groupId === groupLayer?.id);
    expect(childInGroup).toBeDefined();
  });

  it('synthesizes an exhaustive 7-section master prompt with strict verbatim text preservation', () => {
    const promptSpec = generateReverseEngineeredPrompt(sampleArtboard);

    expect(promptSpec.canvasAndComposition).toContain('1080:1080');
    expect(promptSpec.typography).toContain('₦300,000');
    expect(promptSpec.typography).toContain('GET UP TO');
    expect(promptSpec.textAccuracy).toContain('₦300,000');
    expect(promptSpec.negativePrompt).toBeTruthy();
    expect(promptSpec.fullMasterPrompt).toContain('Canvas & Composition:');
    expect(promptSpec.fullMasterPrompt).toContain('Visual Hierarchy:');
  });
});

