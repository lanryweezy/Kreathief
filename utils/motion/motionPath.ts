/**
 * Motion Path & Vector Trajectory Engine
 * Generates CSS offset-path and Web Animations for guided motion trajectories
 */

import { Layer, ShapeLayer } from '../../types';

export interface MotionPathConfig {
  pathData: string;
  duration?: number;
  easing?: string;
  autoRotate?: boolean;
  loop?: boolean | 'infinite';
}

/**
 * Extracts SVG path data from any path, draw, or shape layer.
 */
export function extractPathFromLayer(layer: Layer): string | null {
  if (layer.type === 'path' || (layer as any).shapeType === 'path') {
    const shape = layer as ShapeLayer;
    if (shape.pathData) {
      return shape.pathData;
    }
    if ((layer as any).vectorPath?.points) {
      const pts = (layer as any).vectorPath.points;
      if (pts.length > 1) {
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
          d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        return d;
      }
    }
  }
  return null;
}

/**
 * Returns CSS properties for motion path following.
 */
export function getMotionPathStyle(config?: MotionPathConfig): React.CSSProperties {
  if (!config || !config.pathData) {
    return {};
  }

  const duration = config.duration || 3;
  const easing = config.easing || 'ease-in-out';
  const rotate = config.autoRotate !== false ? 'auto' : '0deg';

  return {
    offsetPath: `path('${config.pathData}')`,
    offsetRotate: rotate,
    animation: `motion-path-follow ${duration}s ${easing} infinite`,
  } as React.CSSProperties;
}
