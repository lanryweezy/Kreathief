export interface ShapeDefinition {
  clipPath: string;
  defaultColor?: string;
}

/**
 * A central registry for layer shape definitions.
 * This makes it possible to add new shapes without touching core rendering and export code.
 */
export const ShapeRegistry: Record<string, ShapeDefinition> = {
  triangle: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', defaultColor: '#6366f1' },
  star: {
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    defaultColor: '#6366f1',
  },
  hexagon: { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', defaultColor: '#334155' },
  diamond: { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', defaultColor: '#334155' },
  arrow: { clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)', defaultColor: '#334155' },
  heart: {
    clipPath: 'polygon(50% 85%, 15% 50%, 15% 25%, 30% 10%, 50% 25%, 70% 10%, 85% 25%, 85% 50%)',
    defaultColor: '#334155',
  },
  speech_bubble: {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
    defaultColor: '#334155',
  },
  shield: { clipPath: 'polygon(50% 0, 100% 10%, 100% 80%, 50% 100%, 0 80%, 0 10%)', defaultColor: '#334155' },
  ribbon: { clipPath: 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)', defaultColor: '#334155' },
  banner: { clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)', defaultColor: '#334155' },
  pentagon: { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', defaultColor: '#334155' },
  octagon: {
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    defaultColor: '#334155',
  },
  plus: {
    clipPath:
      'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
    defaultColor: '#334155',
  },
  star_4: {
    clipPath: 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
    defaultColor: '#334155',
  },
  star_8: {
    clipPath:
      'polygon(50% 0%, 61% 22%, 85% 15%, 72% 35%, 100% 50%, 72% 65%, 85% 85%, 61% 72%, 50% 100%, 39% 72%, 15% 85%, 28% 65%, 0% 50%, 28% 35%, 15% 15%, 39% 22%)',
    defaultColor: '#334155',
  },
  circle: { clipPath: 'circle(50% at 50% 50%)', defaultColor: '#334155' },
  rectangle: { clipPath: '', defaultColor: '#334155' },
};

export const registerShape = (name: string, definition: ShapeDefinition) => {
  ShapeRegistry[name] = definition;
};

export const getShapeDefinition = (type: string): string | undefined => {
  return ShapeRegistry[type]?.clipPath;
};

export const getShapeDefaultColor = (type: string): string => {
  return ShapeRegistry[type]?.defaultColor || '#00c4cc';
};
