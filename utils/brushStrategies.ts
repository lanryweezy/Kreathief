export interface BrushRenderContext {
  ctx: CanvasRenderingContext2D;
  drawX: number;
  drawY: number;
  pressureWidth: number;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  ptPressure: number;
}

export interface BrushStrategy {
  /**
   * Applies the brush-specific styling and drawing logic.
   * @returns true to continue with default lineTo/stroke pathing, false to skip it (e.g. for scatter brushes).
   */
  apply(context: BrushRenderContext): boolean;
}

export const brushStrategies = new Map<string, BrushStrategy>();

export function registerBrushStrategy(id: string, strategy: BrushStrategy) {
  brushStrategies.set(id, strategy);
}

registerBrushStrategy('eraser', {
  apply: ({ ctx, brushSize }) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = brushSize;
    return true;
  }
});

registerBrushStrategy('calligraphy', {
  apply: ({ ctx, pressureWidth }) => {
    ctx.lineCap = 'butt';
    ctx.lineWidth = pressureWidth * 1.5;
    return true;
  }
});

registerBrushStrategy('oil', {
  apply: ({ ctx, pressureWidth, brushColor }) => {
    ctx.lineWidth = pressureWidth * 1.8;
    ctx.shadowBlur = 4;
    ctx.shadowColor = brushColor;
    return true;
  }
});

registerBrushStrategy('crayon', {
  apply: ({ ctx, pressureWidth }) => {
    ctx.lineWidth = pressureWidth;
    ctx.setLineDash([2, 5]);
    return true;
  }
});

registerBrushStrategy('pencil', {
  apply: ({ ctx, brushOpacity, ptPressure }) => {
    ctx.lineWidth = 1;
    ctx.globalAlpha = brushOpacity * 0.7 * (0.5 + ptPressure * 0.5);
    return true;
  }
});

registerBrushStrategy('watercolor', {
  apply: ({ ctx, pressureWidth, brushOpacity, brushColor }) => {
    ctx.lineWidth = pressureWidth * 2.5;
    ctx.globalAlpha = brushOpacity * 0.4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = brushColor;
    return true;
  }
});

registerBrushStrategy('splatter', {
  apply: ({ ctx, brushColor, drawX, drawY, pressureWidth }) => {
    ctx.lineWidth = 1;
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(drawX, drawY, pressureWidth * (0.5 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
    return false;
  }
});

registerBrushStrategy('texture', {
  apply: ({ ctx, pressureWidth, brushOpacity, brushColor }) => {
    ctx.lineWidth = pressureWidth * 2.0;
    ctx.globalAlpha = brushOpacity * 0.85;
    ctx.shadowBlur = 6;
    ctx.shadowColor = brushColor;
    ctx.setLineDash([1, 2]);
    return true;
  }
});
