import { describe, it, expect } from 'vitest';
import { computeSmartAnimatePairs } from '../../../utils/motion/smartAnimate';
import { generateBeatSyncedDelays } from '../../../utils/motion/beatSync';
import { extractPathFromLayer, getMotionPathStyle } from '../../../utils/motion/motionPath';
import { Artboard, ShapeLayer } from '../../../types';

describe('Motion & Animation Engines', () => {
  describe('Smart Animate Engine', () => {
    it('matches layers by ID and calculates interpolation deltas', () => {
      const fromArtboard: Artboard = {
        id: 'ab-1',
        name: 'Slide 1',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        layers: [
          {
            id: 'layer-title',
            name: 'Title',
            type: 'text',
            x: 100,
            y: 100,
            width: 400,
            height: 100,
            rotation: 0,
            opacity: 1,
          } as any,
        ],
      };

      const toArtboard: Artboard = {
        id: 'ab-2',
        name: 'Slide 2',
        x: 1200,
        y: 0,
        width: 1080,
        height: 1080,
        layers: [
          {
            id: 'layer-title',
            name: 'Title',
            type: 'text',
            x: 200,
            y: 300,
            width: 600,
            height: 150,
            rotation: 15,
            opacity: 0.8,
          } as any,
        ],
      };

      const result = computeSmartAnimatePairs(fromArtboard, toArtboard);
      expect(result.matched.length).toBe(1);
      expect(result.matched[0].deltas.dx).toBe(100);
      expect(result.matched[0].deltas.dy).toBe(200);
      expect(result.matched[0].deltas.scaleX).toBe(1.5);
      expect(result.matched[0].deltas.dRotation).toBe(15);
      expect(result.matched[0].deltas.toOpacity).toBe(0.8);
      expect(result.entering.length).toBe(0);
      expect(result.exiting.length).toBe(0);
    });

    it('matches layers by semantic name when IDs differ', () => {
      const fromArtboard: Artboard = {
        id: 'ab-1',
        name: 'Slide 1',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        layers: [
          {
            id: 'old-hero',
            name: 'Hero Image',
            type: 'image',
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            rotation: 0,
            opacity: 1,
          } as any,
        ],
      };

      const toArtboard: Artboard = {
        id: 'ab-2',
        name: 'Slide 2',
        x: 1200,
        y: 0,
        width: 1080,
        height: 1080,
        layers: [
          {
            id: 'new-hero',
            name: 'hero image',
            type: 'image',
            x: 100,
            y: 100,
            width: 400,
            height: 400,
            rotation: 0,
            opacity: 1,
          } as any,
        ],
      };

      const result = computeSmartAnimatePairs(fromArtboard, toArtboard, { matchByName: true });
      expect(result.matched.length).toBe(1);
      expect(result.matched[0].matchType).toBe('name');
      expect(result.matched[0].deltas.dx).toBe(50);
      expect(result.matched[0].deltas.scaleX).toBe(2);
    });
  });

  describe('Beat Sync Engine', () => {
    it('generates quantized beat delays based on BPM and subdivision', () => {
      const delaysQuarter = generateBeatSyncedDelays(4, 120, 'quarter');
      expect(delaysQuarter).toEqual([0, 0.5, 1, 1.5]);

      const delaysEighth = generateBeatSyncedDelays(4, 120, 'eighth');
      expect(delaysEighth).toEqual([0, 0.25, 0.5, 0.75]);
    });
  });

  describe('Motion Path Engine', () => {
    it('extracts path data from shape layer', () => {
      const shapeLayer: ShapeLayer = {
        id: 'path-1',
        type: 'path',
        pathData: 'M 0 0 C 50 100, 150 100, 200 0',
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        color: '#000',
        cornerRadius: 0,
      };

      const pathData = extractPathFromLayer(shapeLayer);
      expect(pathData).toBe('M 0 0 C 50 100, 150 100, 200 0');
    });

    it('generates valid CSS motion-path styles', () => {
      const style = getMotionPathStyle({
        pathData: 'M 0 0 L 100 100',
        duration: 4,
        autoRotate: true,
      });

      expect(style.offsetPath).toBe("path('M 0 0 L 100 100')");
      expect(style.offsetRotate).toBe('auto');
      expect(style.animation).toContain('motion-path-follow');
    });
  });
});
