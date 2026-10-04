/**
 * 🔩 Hinge Extension Point
 *
 * Evidence of extension pressure: The `useDrawingMode` hook contained a growing switch statement
 * with 8 hardcoded brush types (`eraser`, `calligraphy`, `oil`, etc.) that all modified the
 * canvas context differently. Any new brush type required modifying the core drawing loop.
 *
 * Interface Contract: Implementors must provide an `apply` method that receives the canvas context
 * and current stroke properties. The method should modify the context as needed and return `true`
 * if it handles its own pathing/drawing (e.g., splatter) and default `lineTo`/`stroke` should be skipped,
 * or `false` to let the core loop perform the standard `lineTo` and `stroke`.
 */
export interface BrushStrategyContext {
  ctx: CanvasRenderingContext2D;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  pressureWidth: number;
  ptPressure: number;
  drawX: number;
  drawY: number;
}

export interface BrushStrategy {
  apply: (context: BrushStrategyContext) => boolean;
}

export const brushStrategies = new Map<string, BrushStrategy>();

export function registerBrushStrategy(type: string, strategy: BrushStrategy) {
  brushStrategies.set(type, strategy);
}

// Register basic strategies
registerBrushStrategy('eraser', {
  apply: ({ ctx, brushSize }) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = brushSize;
    return false;
  },
});

registerBrushStrategy('calligraphy', {
  apply: ({ ctx, pressureWidth }) => {
    ctx.lineCap = 'butt';
    ctx.lineWidth = pressureWidth * 1.5;
    return false;
  },
});

registerBrushStrategy('oil', {
  apply: ({ ctx, pressureWidth, brushColor }) => {
    ctx.lineWidth = pressureWidth * 1.8;
    ctx.shadowBlur = 4;
    ctx.shadowColor = brushColor;
    return false;
  },
});

registerBrushStrategy('crayon', {
  apply: ({ ctx, pressureWidth }) => {
    ctx.lineWidth = pressureWidth;
    ctx.setLineDash([2, 5]);
    return false;
  },
});

registerBrushStrategy('pencil', {
  apply: ({ ctx, brushOpacity, ptPressure }) => {
    ctx.lineWidth = 1;
    ctx.globalAlpha = brushOpacity * 0.7 * (0.5 + ptPressure * 0.5);
    return false;
  },
});

registerBrushStrategy('watercolor', {
  apply: ({ ctx, pressureWidth, brushOpacity, brushColor }) => {
    ctx.lineWidth = pressureWidth * 2.5;
    ctx.globalAlpha = brushOpacity * 0.4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = brushColor;
    return false;
  },
});

registerBrushStrategy('splatter', {
  apply: ({ ctx, pressureWidth, brushColor, drawX, drawY }) => {
    ctx.lineWidth = 1;
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(drawX, drawY, pressureWidth * (0.5 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
    return true; // Skip default lineTo and stroke
  },
});

registerBrushStrategy('texture', {
  apply: ({ ctx, pressureWidth, brushOpacity, brushColor }) => {
    ctx.lineWidth = pressureWidth * 2.0;
    ctx.globalAlpha = brushOpacity * 0.85;
    ctx.shadowBlur = 6;
    ctx.shadowColor = brushColor;
    ctx.setLineDash([1, 2]);
    return false;
  },
});
