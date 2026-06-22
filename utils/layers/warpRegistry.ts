export interface WarpPlugin {
  type: string;
  applyTransform: (ctx: CanvasRenderingContext2D, progress: number, intensity: number, angle: number) => void;
}

class WarpRegistry {
  private warps = new Map<string, WarpPlugin>();

  register(warp: WarpPlugin): void {
    this.warps.set(warp.type, warp);
  }

  applyTransform(
    type: string,
    ctx: CanvasRenderingContext2D,
    progress: number,
    intensity: number,
    angle: number
  ): boolean {
    const warp = this.warps.get(type);
    if (warp) {
      warp.applyTransform(ctx, progress, intensity, angle);
      return true;
    }
    return false;
  }
}

export const warpRegistry = new WarpRegistry();

// Register standard warp effects
warpRegistry.register({
  type: 'arch',
  applyTransform: (ctx, progress, intensity) => {
    const archOffset = Math.sin(progress * Math.PI) * intensity * 50;
    ctx.translate(0, archOffset);
  },
});

warpRegistry.register({
  type: 'arc',
  applyTransform: (ctx, progress, intensity) => {
    const archOffset = Math.sin(progress * Math.PI) * intensity * 50;
    ctx.translate(0, archOffset);
  },
});

warpRegistry.register({
  type: 'wave',
  applyTransform: (ctx, progress, intensity) => {
    const waveOffset = Math.sin(progress * Math.PI * 4) * intensity * 20;
    ctx.translate(0, waveOffset);
    ctx.rotate(Math.cos(progress * Math.PI * 4) * intensity * 0.3);
  },
});

warpRegistry.register({
  type: 'rise',
  applyTransform: (ctx, progress, intensity) => {
    const riseOffset = progress * intensity * 50;
    ctx.translate(0, -riseOffset);
  },
});

warpRegistry.register({
  type: 'flag',
  applyTransform: (ctx, progress, intensity) => {
    const flagOffset = Math.sin(progress * Math.PI * 2) * intensity * 15;
    ctx.translate(0, flagOffset);
    ctx.rotate(Math.cos(progress * Math.PI * 2) * intensity * 0.2);
  },
});

warpRegistry.register({
  type: 'fish',
  applyTransform: (ctx, progress, intensity) => {
    const fishOffset = Math.sin(progress * Math.PI) * intensity * 30;
    ctx.translate(0, fishOffset);
    const fishScale = 1 + Math.sin(progress * Math.PI) * intensity * 0.2;
    ctx.scale(fishScale, 1 / fishScale);
  },
});

warpRegistry.register({
  type: 'circle',
  applyTransform: (ctx, progress, intensity, angle) => {
    const circleAngle = progress * Math.PI * 2 + angle;
    const radius = 100 * (1 + intensity);
    ctx.rotate(circleAngle);
    ctx.translate(radius, 0);
    ctx.rotate(Math.PI / 2);
  },
});

warpRegistry.register({
  type: 'distort',
  applyTransform: (ctx, progress, intensity) => {
    const distortY = Math.sin(progress * Math.PI) * intensity * 40;
    const distortScale = 1 + (progress - 0.5) * intensity * 0.3;
    ctx.translate(0, distortY);
    ctx.scale(distortScale, 1 / distortScale);
  },
});

warpRegistry.register({
  type: 'angle',
  applyTransform: (ctx, progress, intensity, angle) => {
    ctx.rotate(angle);
    ctx.transform(1, 0, Math.tan(angle) * intensity, 1, 0, 0);
  },
});

warpRegistry.register({
  type: 'mesh',
  applyTransform: (ctx, progress, intensity) => {
    const meshX = Math.sin(progress * Math.PI * 6) * intensity * 5;
    const meshY = Math.cos(progress * Math.PI * 6) * intensity * 5;
    ctx.translate(meshX, meshY);
  },
});
