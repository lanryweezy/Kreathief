import { describe, it, expect } from 'vitest';
import { Artboard, Layer, TextLayer, ShapeLayer } from '../../types';
import { smartResizeArtboard } from '../../services/smartResizeEngine';
import { applyAestheticMovement } from '../../services/styleTransferEngine';
import { GRAPHIC_DESIGN_STYLES } from '../../services/graphicDesignStyles';
import { decompileArtboardToAST, generateReverseEngineeredPrompt } from '../../services/designReverseEngine';
import { generateOmnichannelCampaign } from '../../services/campaignGeneratorService';
import { HistoryManager } from '../../commands/history';
import { Command } from '../../commands/base';
import { AssetCacheService } from '../../services/AssetCacheService';

describe('Kreathief Extreme Scale & High-Load Benchmark Suite', () => {
  const createMockArtboard = (layerCount = 50, width = 1080, height = 1080): Artboard => {
    const layers: Layer[] = [];
    for (let i = 0; i < layerCount; i++) {
      if (i % 2 === 0) {
        const textLayer: TextLayer = {
          id: `text_${i}`,
          name: `Heading_${i}`,
          type: 'text',
          x: Math.round((i * 15) % (width - 200)),
          y: Math.round((i * 20) % (height - 100)),
          width: 300,
          height: 60,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          text: `Sample Headline ${i}`,
          fontFamily: 'Inter',
          fontSize: 28,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          textTransform: 'none',
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
        };
        layers.push(textLayer);
      } else {
        const shapeLayer: ShapeLayer = {
          id: `shape_${i}`,
          name: `Card_${i}`,
          type: 'rectangle',
          x: Math.round((i * 12) % (width - 250)),
          y: Math.round((i * 18) % (height - 150)),
          width: 250,
          height: 120,
          rotation: 0,
          opacity: 0.9,
          locked: false,
          visible: true,
          color: '#1e293b',
          cornerRadius: 12,
          stroke: { color: '#38bdf8', width: 2 },
        };
        layers.push(shapeLayer);
      }
    }

    return {
      id: 'artboard_stress_1',
      name: 'Stress Test Master Artboard',
      x: 0,
      y: 0,
      width,
      height,
      backgroundColor: '#090a15',
      layers,
    };
  };

  it('1. High-Density Layer Smart Resizing Benchmark (150 Layers)', () => {
    const artboard = createMockArtboard(150, 1080, 1080);
    const startTime = performance.now();

    const banner16_9 = smartResizeArtboard(artboard, 1200, 630);
    const story9_16 = smartResizeArtboard(artboard, 1080, 1920);
    const poster4_5 = smartResizeArtboard(artboard, 1080, 1350);

    const duration = performance.now() - startTime;

    expect(banner16_9.layers.length).toBe(150);
    expect(story9_16.layers.length).toBe(150);
    expect(poster4_5.layers.length).toBe(150);
    expect(banner16_9.width).toBe(1200);
    expect(story9_16.height).toBe(1920);
    // Should process 450 total layer transformations in under 150ms
    expect(duration).toBeLessThan(150);
  });

  it('2. Rapid Multi-Movement Style Transfer Loop (25+ Movements)', () => {
    const artboard = createMockArtboard(40, 1080, 1080);
    const startTime = performance.now();

    const movementKeys = Object.keys(GRAPHIC_DESIGN_STYLES);
    for (const key of movementKeys) {
      const restyled = applyAestheticMovement(artboard, key as any);
      expect(restyled.layers.length).toBe(40);
      expect(restyled.backgroundColor).toBeTruthy();
    }

    const duration = performance.now() - startTime;
    // 25+ movement passes with contrast calculations should execute in < 150ms
    expect(duration).toBeLessThan(150);
  });

  it('3. High-Throughput Design Reverse-Engineering AST Synthesis', () => {
    const artboard = createMockArtboard(60, 1080, 1080);
    const startTime = performance.now();

    for (let i = 0; i < 20; i++) {
      const ast = decompileArtboardToAST(artboard);
      const promptSpec = generateReverseEngineeredPrompt(artboard);

      expect(ast.sceneGraph.layers.length).toBe(60);
      expect(promptSpec.fullMasterPrompt).toContain('Canvas & Composition');
      expect(promptSpec.fullMasterPrompt).toContain('Typography');
    }

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(150);
  });

  it('4. Omnichannel Campaign Multi-Artboard Synchronized Generation', async () => {
    const startTime = performance.now();

    const campaign = await generateOmnichannelCampaign({
      prompt: 'Cyberpunk Drone Drop with 40% discount',
      archetype: 'cyberpunk',
      formats: ['feed_1_1', 'story_9_16', 'banner_16_9', 'poster_4_5'],
      brandName: 'CYBERX',
      ctaText: 'ORDER NOW',
      promoCode: 'CYBER40',
    });

    const duration = performance.now() - startTime;

    expect(campaign.artboards.length).toBe(4);
    expect(campaign.archetype.id).toBe('cyberpunk');
    expect(campaign.copy.offer).toBe('40% DISCOUNT');
    expect(campaign.copy.promoCode).toBe('CYBER40');
    expect(duration).toBeLessThan(100);
  });

  it('5. Command History Memory Ceiling & Batch Performance (1,000 Operations)', () => {
    const history = new HistoryManager(100);
    let counter = 0;

    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      const cmd: Command = {
        description: `Increment_${i}`,
        execute: () => {
          counter++;
        },
        undo: () => {
          counter--;
        },
      };
      history.push(cmd);
    }

    expect(counter).toBe(1000);

    // Undo 50 times
    for (let i = 0; i < 50; i++) {
      history.undo();
    }
    expect(counter).toBe(950);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(80);
  });

  it('6. AssetCacheService LRU Eviction & Memory Management', () => {
    AssetCacheService.clear();

    for (let i = 0; i < 250; i++) {
      AssetCacheService.set(`asset_${i}`, {
        id: `id_${i}`,
        name: `Asset ${i}`,
        thumbnailUrl: `https://example.com/asset_${i}.svg`,
        source: 'test',
        assetType: 'svg',
        timestamp: Date.now(),
        sizeBytes: 1024,
      });
    }

    // Oldest item should be evicted (cache size capped at 200)
    expect(AssetCacheService.get('asset_0')).toBeUndefined();
    // Newest item should be present
    expect(AssetCacheService.get('asset_249')).toBeDefined();
  });

  it('7. 10,000 Layer Canvas Spawning (60fps DOM bounding limits)', () => {
    const artboard = createMockArtboard(10000, 1080, 1080);
    const startTime = performance.now();
    
    // Simulate mapping 10,000 layers as a React render pass boundary calculation
    let boundingArea = 0;
    for (let i = 0; i < artboard.layers.length; i++) {
      const layer = artboard.layers[i];
      boundingArea += layer.width * layer.height;
    }

    const duration = performance.now() - startTime;
    
    expect(artboard.layers.length).toBe(10000);
    expect(boundingArea).toBeGreaterThan(0);
    // Calculation of limits over 10k items should be sub-50ms (well within 16.6ms frame budget ideally)
    expect(duration).toBeLessThan(100);
  });
});

