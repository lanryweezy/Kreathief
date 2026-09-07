export interface BrushStrategy {
  apply(
    ctx: CanvasRenderingContext2D,
    pressureWidth: number,
    brushOpacity: number,
    ptPressure: number,
    brushColor: string,
    brushSize: number,
    drawX: number,
    drawY: number
  ): boolean;
}

export const brushStrategies = new Map<string, BrushStrategy>();

export function registerBrushStrategy(type: string, strategy: BrushStrategy) {
  brushStrategies.set(type, strategy);
}
