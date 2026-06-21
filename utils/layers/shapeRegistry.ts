export interface ShapePlugin {
  type: string;
  getClipPath: () => string | undefined;
  renderCanvas?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  renderSvg?: (width: number, height: number, color: string) => string;
}

class ShapeRegistry {
  private shapes = new Map<string, ShapePlugin>();

  register(shape: ShapePlugin): void {
    this.shapes.set(shape.type, shape);
  }

  getClipPath(type: string): string | undefined {
    const shape = this.shapes.get(type);
    if (shape) {
      return shape.getClipPath();
    }
    return undefined;
  }

  renderCanvas(type: string, ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
    const shape = this.shapes.get(type);
    if (shape && shape.renderCanvas) {
      shape.renderCanvas(ctx, width, height);
      return true;
    }
    return false;
  }

  renderSvg(type: string, width: number, height: number, color: string): string | undefined {
    const shape = this.shapes.get(type);
    if (shape && shape.renderSvg) {
      return shape.renderSvg(width, height, color);
    }
    return undefined;
  }
}

export const shapeRegistry = new ShapeRegistry();

// Register all standard polygon shapes
shapeRegistry.register({
  type: 'triangle',
  getClipPath: () => 'polygon(50% 0%, 0% 100%, 100% 100%)',
  renderCanvas: (ctx, width, height) => {
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(width / 2, height / 2);
    ctx.lineTo(-width / 2, height / 2);
  },
  renderSvg: (width, height, color) =>
    `<polygon points="0,${-height / 2} ${width / 2},${height / 2} ${-width / 2},${height / 2}" fill="${color}" />`,
});

shapeRegistry.register({
  type: 'star',
  getClipPath: () => 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  renderCanvas: (ctx, width) => {
    const outerR = width / 2;
    const innerR = outerR * 0.4;
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
  },
  renderSvg: (width, _height, color) => {
    const outerR = width / 2;
    const innerR = outerR * 0.4;
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${color}" />`;
  },
});

shapeRegistry.register({
  type: 'hexagon',
  getClipPath: () => 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
});
shapeRegistry.register({ type: 'diamond', getClipPath: () => 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' });
shapeRegistry.register({
  type: 'arrow',
  getClipPath: () => 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
});
shapeRegistry.register({
  type: 'heart',
  getClipPath: () => 'polygon(50% 85%, 15% 50%, 15% 25%, 30% 10%, 50% 25%, 70% 10%, 85% 25%, 85% 50%)',
});
shapeRegistry.register({
  type: 'speech_bubble',
  getClipPath: () => 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
});
shapeRegistry.register({
  type: 'shield',
  getClipPath: () => 'polygon(50% 0, 100% 10%, 100% 80%, 50% 100%, 0 80%, 0 10%)',
});
shapeRegistry.register({
  type: 'ribbon',
  getClipPath: () => 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%, 10% 50%)',
});
shapeRegistry.register({ type: 'banner', getClipPath: () => 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' });
shapeRegistry.register({
  type: 'pentagon',
  getClipPath: () => 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
});
shapeRegistry.register({
  type: 'octagon',
  getClipPath: () => 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
});
shapeRegistry.register({
  type: 'plus',
  getClipPath: () =>
    'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
});
shapeRegistry.register({
  type: 'star_4',
  getClipPath: () => 'polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)',
});
shapeRegistry.register({
  type: 'star_8',
  getClipPath: () =>
    'polygon(50% 0%, 61% 22%, 85% 15%, 72% 35%, 100% 50%, 72% 65%, 85% 85%, 61% 72%, 50% 100%, 39% 72%, 15% 85%, 28% 65%, 0% 50%, 28% 35%, 15% 15%, 39% 22%)',
});
