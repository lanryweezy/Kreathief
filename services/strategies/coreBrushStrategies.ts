import { registerBrushStrategy } from './brushStrategies';

registerBrushStrategy('eraser', {
  apply(ctx, _pressureWidth, _brushOpacity, _ptPressure, _brushColor, brushSize) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = brushSize;
    return false;
  },
});

registerBrushStrategy('calligraphy', {
  apply(ctx, pressureWidth) {
    ctx.lineCap = 'butt';
    ctx.lineWidth = pressureWidth * 1.5;
    return false;
  },
});

registerBrushStrategy('oil', {
  apply(ctx, pressureWidth, _brushOpacity, _ptPressure, brushColor) {
    ctx.lineWidth = pressureWidth * 1.8;
    ctx.shadowBlur = 4;
    ctx.shadowColor = brushColor;
    return false;
  },
});

registerBrushStrategy('crayon', {
  apply(ctx, pressureWidth) {
    ctx.lineWidth = pressureWidth;
    ctx.setLineDash([2, 5]);
    return false;
  },
});

registerBrushStrategy('pencil', {
  apply(ctx, _pressureWidth, brushOpacity, ptPressure) {
    ctx.lineWidth = 1;
    ctx.globalAlpha = brushOpacity * 0.7 * (0.5 + ptPressure * 0.5);
    return false;
  },
});

registerBrushStrategy('watercolor', {
  apply(ctx, pressureWidth, brushOpacity, _ptPressure, brushColor) {
    ctx.lineWidth = pressureWidth * 2.5;
    ctx.globalAlpha = brushOpacity * 0.4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = brushColor;
    return false;
  },
});

registerBrushStrategy('splatter', {
  apply(ctx, pressureWidth, _brushOpacity, _ptPressure, brushColor, _brushSize, drawX, drawY) {
    ctx.lineWidth = 1;
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(drawX, drawY, pressureWidth * (0.5 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
    return true; // Skip default lineTo/stroke
  },
});

registerBrushStrategy('texture', {
  apply(ctx, pressureWidth, brushOpacity, _ptPressure, brushColor) {
    ctx.lineWidth = pressureWidth * 2.0;
    ctx.globalAlpha = brushOpacity * 0.85;
    ctx.shadowBlur = 6;
    ctx.shadowColor = brushColor;
    ctx.setLineDash([1, 2]);
    return false;
  },
});
