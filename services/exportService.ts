import { TextLayer, ShapeLayer, ImageLayer, CanvasFilters, Layer } from '../types';
import { jsPDF } from 'jspdf';

/**
 * Downloads a Blob object as a file.
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Loads an image from a URL or Base64 string into an HTMLImageElement.
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Wraps text into lines based on a max width (approximation for Canvas).
 */
const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const wordWidth = ctx.measureText(word).width;

    // Handle single words that are too long (break-word behavior)
    if (wordWidth > maxWidth) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = '';
      }
      let subWord = '';
      for (let c = 0; c < word.length; c++) {
        const testSub = subWord + word[c];
        if (ctx.measureText(testSub).width > maxWidth) {
          lines.push(subWord);
          subWord = word[c];
        } else {
          subWord = testSub;
        }
      }
      currentLine = subWord;
      continue;
    }

    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// Helper to skew context
const applySkew = (ctx: CanvasRenderingContext2D, skewX: number = 0, skewY: number = 0) => {
  // Transform matrix: [a, b, c, d, e, f]
  // a: ScaleX, b: SkewY, c: SkewX, d: ScaleY, e: TransX, f: TransY
  // To skew, we change b and c. Math.tan takes radians.
  const radX = (skewX * Math.PI) / 180;
  const radY = (skewY * Math.PI) / 180;
  ctx.transform(1, Math.tan(radY), Math.tan(radX), 1, 0, 0);
};

// Helper to create gradient for text
const createTextGradient = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradientConfig: { startColor: string; endColor: string; angle: number }
) => {
  // CSS Angle: 0deg = to top, 90deg = to right.
  // Convert to radians, offset by -90 degrees because Math.cos/sin starts at 3 o'clock (0 rad)
  const angleRad = (gradientConfig.angle - 90) * (Math.PI / 180);

  // Calculate a large enough diagonal to cover the text bounding box during rotation
  const length = Math.sqrt(width * width + height * height);

  // Calculate start and end points relative to center (0,0)
  const centerX = 0;
  const centerY = 0;

  const x1 = centerX - (Math.cos(angleRad) * length) / 2;
  const y1 = centerY - (Math.sin(angleRad) * length) / 2;
  const x2 = centerX + (Math.cos(angleRad) * length) / 2;
  const y2 = centerY + (Math.sin(angleRad) * length) / 2;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, gradientConfig.startColor);
  gradient.addColorStop(1, gradientConfig.endColor);
  return gradient;
};

// Helper to render warped text using pixel slicing (matching Canvas.tsx component)
const drawWarpedText = (
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  textBlockHeight: number,
  _totalHeight: number
) => {
  const {
    text,
    color,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    warpStyle,
    curve = 0,
    width,
    lineHeight = 1.2,
    textAlign = 'left',
  } = layer;

  // Font string
  const font = `${fontStyle === 'italic' ? 'italic' : 'normal'} ${fontWeight} ${fontSize}px ${fontFamily}`;

  // Create temp canvas for the flat text
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    return;
  }

  const intensity = curve / 100; // -1 to 1

  tempCanvas.width = width;
  tempCanvas.height = textBlockHeight;
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';

  // Draw flat text
  tempCtx.font = font;
  tempCtx.textBaseline = 'top';
  const align = textAlign === 'justify' ? 'left' : textAlign;
  tempCtx.textAlign = align as CanvasTextAlign;

  if (layer.gradient?.enabled) {
    const grad = tempCtx.createLinearGradient(0, 0, 0, textBlockHeight);
    grad.addColorStop(0, layer.gradient.startColor);
    grad.addColorStop(1, layer.gradient.endColor);
    tempCtx.fillStyle = grad;
  } else {
    tempCtx.fillStyle = color;
  }

  const lines = text.split('\n');
  const lh = fontSize * lineHeight;

  lines.forEach((line, i) => {
    let x = 0;
    if (textAlign === 'center') {
      x = width / 2;
    }
    if (textAlign === 'right') {
      x = width;
    }
    tempCtx.fillText(line, x, i * lh);
  });

  // Apply Stroke to temp canvas if needed (before warping)
  if (layer.stroke) {
    tempCtx.lineWidth = layer.stroke.width;
    tempCtx.strokeStyle = layer.stroke.color;
    tempCtx.lineJoin = 'round';
    lines.forEach((line, i) => {
      let x = 0;
      if (textAlign === 'center') {
        x = width / 2;
      }
      if (textAlign === 'right') {
        x = width;
      }
      tempCtx.strokeText(line, x, i * lh);
    });
  }

  // Calculate start position to center the warped result on the layer's origin (0,0 of ctx)
  const startX = -width / 2;
  const startY = -textBlockHeight / 2;

  // Slicing parameters - higher precision for export
  const sliceWidth = 0.5;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let x = 0; x < width; x += sliceWidth) {
    const normalizedX = (x / width) * 2 - 1; // -1 to 1
    let offsetY = 0;

    if (warpStyle === 'flag') {
      // Sine wave
      offsetY = Math.sin(normalizedX * Math.PI * 1.5) * (intensity * width * 0.3);
    } else if (warpStyle === 'rise') {
      // Linear rise
      offsetY = normalizedX * (intensity * width * 0.3);
    } else if (warpStyle === 'arc') {
      // Parabola
      offsetY = (1 - normalizedX * normalizedX) * (intensity * width * 0.3) * -1;
    }

    // Draw slice from temp canvas to main context
    ctx.drawImage(
      tempCanvas,
      x,
      0,
      sliceWidth,
      textBlockHeight,
      startX + x,
      startY + offsetY,
      sliceWidth,
      textBlockHeight
    );
  }
};

// Helper to draw a shape layer
const drawShapeToContext = (ctx: CanvasRenderingContext2D, shape: ShapeLayer) => {
  ctx.save();

  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  applySkew(ctx, shape.skewX, shape.skewY);

  ctx.globalAlpha = shape.opacity;
  if (shape.blendMode) {
    ctx.globalCompositeOperation = shape.blendMode as GlobalCompositeOperation;
  }
  ctx.fillStyle = shape.color;

  const isSimple = shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'path';
  if (shape.shadow && isSimple) {
    ctx.shadowColor = shape.shadow.color;
    ctx.shadowBlur = shape.shadow.blur;
    ctx.shadowOffsetX = shape.shadow.offsetX;
    ctx.shadowOffsetY = shape.shadow.offsetY;
  }

  ctx.beginPath();

  const w = shape.width;
  const h = shape.height;
  const hw = w / 2;
  const hh = h / 2;

  if (shape.type === 'rectangle') {
    if (shape.cornerRadius && shape.cornerRadius > 0 && ctx.roundRect) {
      ctx.roundRect(-hw, -hh, w, h, shape.cornerRadius);
    } else {
      ctx.rect(-hw, -hh, w, h);
    }
    ctx.fill();
  } else if (shape.type === 'circle') {
    ctx.ellipse(0, 0, hw, hh, 0, 0, 2 * Math.PI);
    ctx.fill();
  } else if (shape.type === 'path' && shape.pathData) {
    const path = new Path2D(shape.pathData);
    ctx.save();
    ctx.translate(-hw, -hh);
    ctx.scale(w / 100, h / 100);
    ctx.fill(path);
    if (shape.stroke) {
      ctx.lineWidth = shape.stroke.width * (100 / w);
      ctx.strokeStyle = shape.stroke.color;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
    }
    ctx.restore();
  } else if (shape.type === 'triangle') {
    ctx.moveTo(0, -hh);
    ctx.lineTo(-hw, hh);
    ctx.lineTo(hw, hh);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'star') {
    const spikes = 5;
    const outerRadius = Math.min(w, h) / 2;
    const innerRadius = outerRadius / 2.2;
    let rot = (Math.PI / 2) * 3;
    let x = 0;
    let y = 0;
    const step = Math.PI / spikes;
    ctx.moveTo(0, 0 - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rot) * outerRadius;
      y = Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(0, 0 - outerRadius);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'hexagon') {
    const sideLength = w / 2;
    ctx.moveTo(sideLength * Math.cos(0), sideLength * Math.sin(0));
    for (let i = 1; i <= 6; i++) {
      ctx.lineTo(sideLength * Math.cos((i * 2 * Math.PI) / 6), sideLength * Math.sin((i * 2 * Math.PI) / 6));
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'diamond') {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'arrow') {
    const y20 = -hh + h * 0.2;
    const y0 = -hh;
    const y50 = 0;
    const y100 = hh;
    const y80 = -hh + h * 0.8;
    const x0 = -hw;
    const x60 = -hw + w * 0.6;
    const x100 = hw;
    ctx.moveTo(x0, y20);
    ctx.lineTo(x60, y20);
    ctx.lineTo(x60, y0);
    ctx.lineTo(x100, y50);
    ctx.lineTo(x60, y100);
    ctx.lineTo(x60, y80);
    ctx.lineTo(x0, y80);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'speech_bubble') {
    const y75 = -hh + h * 0.75;
    const x75 = -hw + w * 0.75;
    const x50 = 0;
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, y75);
    ctx.lineTo(x75, y75);
    ctx.lineTo(x75, hh);
    ctx.lineTo(x50, y75);
    ctx.lineTo(-hw, y75);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'heart') {
    ctx.moveTo(0, -hh + h * 0.85);
    ctx.lineTo(-hw + w * 0.15, 0);
    ctx.lineTo(-hw + w * 0.15, -hh + h * 0.25);
    ctx.lineTo(-hw + w * 0.3, -hh + h * 0.1);
    ctx.lineTo(0, -hh + h * 0.25);
    ctx.lineTo(-hw + w * 0.7, -hh + h * 0.1);
    ctx.lineTo(-hw + w * 0.85, -hh + h * 0.25);
    ctx.lineTo(-hw + w * 0.85, 0);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'shield') {
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh + h * 0.2);
    ctx.lineTo(hw, -hh + h * 0.7);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, -hh + h * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'ribbon') {
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw * 0.8, 0);
    ctx.lineTo(hw, hh);
    ctx.lineTo(-hw, hh);
    ctx.lineTo(-hw * 0.8, 0);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'banner') {
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh * 0.6);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, hh * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'pentagon') {
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, -hh + h * 0.38);
    ctx.lineTo(hw * 0.64, hh);
    ctx.lineTo(-hw * 0.64, hh);
    ctx.lineTo(-hw, -hh + h * 0.38);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'octagon') {
    ctx.moveTo(-hw * 0.4, -hh);
    ctx.lineTo(hw * 0.4, -hh);
    ctx.lineTo(hw, -hh + h * 0.3);
    ctx.lineTo(hw, hh * 0.4);
    ctx.lineTo(hw * 0.4, hh);
    ctx.lineTo(-hw * 0.4, hh);
    ctx.lineTo(-hw, hh * 0.4);
    ctx.lineTo(-hw, -hh + h * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'plus') {
    ctx.moveTo(-hw * 0.3, -hh);
    ctx.lineTo(hw * 0.3, -hh);
    ctx.lineTo(hw * 0.3, -hh * 0.3);
    ctx.lineTo(hw, -hh * 0.3);
    ctx.lineTo(hw, hh * 0.3);
    ctx.lineTo(hw * 0.3, hh * 0.3);
    ctx.lineTo(hw * 0.3, hh);
    ctx.lineTo(-hw * 0.3, hh);
    ctx.lineTo(-hw * 0.3, hh * 0.3);
    ctx.lineTo(-hw, hh * 0.3); // Fixed plus shape logic
    ctx.lineTo(-hw, -hh * 0.3);
    ctx.lineTo(-hw * 0.3, -hh * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'star_4') {
    const x39 = -hw + w * 0.39;
    const x61 = -hw + w * 0.61;
    const y35 = -hh + h * 0.35;
    const y65 = -hh + h * 0.65;
    ctx.moveTo(0, -hh);
    ctx.lineTo(x61, y35);
    ctx.lineTo(hw, 0);
    ctx.lineTo(x61, y65);
    ctx.lineTo(0, hh);
    ctx.lineTo(x39, y65);
    ctx.lineTo(-hw, 0);
    ctx.lineTo(x39, y35);
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'star_8') {
    ctx.moveTo(0, -hh);
    ctx.lineTo(-hw + w * 0.61, -hh + h * 0.22);
    ctx.lineTo(-hw + w * 0.85, -hh + h * 0.15);
    ctx.lineTo(-hw + w * 0.72, -hh + h * 0.35);
    ctx.lineTo(hw, 0);
    ctx.lineTo(-hw + w * 0.72, -hh + h * 0.65);
    ctx.lineTo(-hw + w * 0.85, -hh + h * 0.85);
    ctx.lineTo(-hw + w * 0.61, -hh + h * 0.72);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw + w * 0.39, -hh + h * 0.72);
    ctx.lineTo(-hw + w * 0.15, -hh + h * 0.85);
    ctx.lineTo(-hw + w * 0.28, -hh + h * 0.65);
    ctx.lineTo(-hw, 0);
    ctx.lineTo(-hw + w * 0.28, -hh + h * 0.35);
    ctx.lineTo(-hw + w * 0.15, -hh + h * 0.15);
    ctx.lineTo(-hw + w * 0.39, -hh + h * 0.22);
    ctx.closePath();
    ctx.fill();
  }

  if (shape.stroke && shape.type !== 'path') {
    ctx.lineWidth = shape.stroke.width;
    ctx.strokeStyle = shape.stroke.color;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  ctx.restore();
};

// Helper to draw an image layer
const drawImageLayerToContext = async (ctx: CanvasRenderingContext2D, imgLayer: ImageLayer) => {
  try {
    const img = await loadImage(imgLayer.src);
    ctx.save();

    const centerX = imgLayer.x + imgLayer.width / 2;
    const centerY = imgLayer.y + imgLayer.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((imgLayer.rotation * Math.PI) / 180);
    applySkew(ctx, imgLayer.skewX, imgLayer.skewY);

    const scaleX = imgLayer.flipX ? -1 : 1;
    const scaleY = imgLayer.flipY ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    ctx.globalAlpha = imgLayer.opacity;
    if (imgLayer.blendMode) {
      ctx.globalCompositeOperation = imgLayer.blendMode as GlobalCompositeOperation;
    }

    if (imgLayer.shadow) {
      ctx.shadowColor = imgLayer.shadow.color;
      ctx.shadowBlur = imgLayer.shadow.blur;
      ctx.shadowOffsetX = imgLayer.shadow.offsetX;
      ctx.shadowOffsetY = imgLayer.shadow.offsetY;
    }

    const f = imgLayer.filters;
    if (f) {
      ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) grayscale(${f.grayscale}%) blur(${f.blur}px) sepia(${f.sepia}%)`;
    }

    if (imgLayer.cornerRadius) {
      ctx.beginPath();
      const x = -imgLayer.width / 2;
      const y = -imgLayer.height / 2;
      if (ctx.roundRect) {
        ctx.roundRect(x, y, imgLayer.width, imgLayer.height, imgLayer.cornerRadius);
      } else {
        ctx.rect(x, y, imgLayer.width, imgLayer.height);
      }
      ctx.clip();
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -imgLayer.width / 2, -imgLayer.height / 2, imgLayer.width, imgLayer.height);

    if (f && f.vignette && f.vignette > 0) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
      const radius = Math.max(imgLayer.width, imgLayer.height) / 1.5;
      const startPct = Math.max(0, 0.7 - f.vignette * 0.005);

      const gradient = ctx.createRadialGradient(0, 0, radius * startPct, 0, 0, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${f.vignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(-imgLayer.width / 2, -imgLayer.height / 2, imgLayer.width, imgLayer.height);
    }

    if (imgLayer.stroke) {
      ctx.lineWidth = imgLayer.stroke.width;
      ctx.strokeStyle = imgLayer.stroke.color;
      const x = -imgLayer.width / 2;
      const y = -imgLayer.height / 2;
      ctx.beginPath();
      if (ctx.roundRect && imgLayer.cornerRadius) {
        ctx.roundRect(x, y, imgLayer.width, imgLayer.height, imgLayer.cornerRadius);
      } else {
        ctx.rect(x, y, imgLayer.width, imgLayer.height);
      }
      ctx.stroke();
    }

    ctx.restore();
  } catch (err) {
    console.warn('Failed to load image layer for export', err);
  }
};

// Helper to draw a text layer
const drawTextLayerToContext = (ctx: CanvasRenderingContext2D, textLayer: TextLayer) => {
  ctx.save();

  const fontSize = textLayer.fontSize;
  const fontStyle = textLayer.fontStyle === 'italic' ? 'italic' : 'normal';
  const fontWeight = textLayer.fontWeight;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${textLayer.fontFamily}`;

  if (textLayer.letterSpacing) {
    // @ts-expect-error - ignore type mismatch
    ctx.letterSpacing = `${textLayer.letterSpacing}px`;
  }

  const lineHeight = textLayer.lineHeight || 1.2;
  let textToRender = textLayer.text;
  if (textLayer.textTransform === 'uppercase') {
    textToRender = textToRender.toUpperCase();
  }
  if (textLayer.textTransform === 'lowercase') {
    textToRender = textToRender.toLowerCase();
  }

  const rawLines = textToRender.split('\n');
  let lines: string[] = [];
  const wrapWidth = textLayer.width || 400;

  if (textLayer.warpStyle && textLayer.warpStyle !== 'none') {
    lines = rawLines;
  } else {
    rawLines.forEach((line) => {
      lines = lines.concat(getLines(ctx, line, wrapWidth));
    });
  }

  const textBlockHeight = lines.length * fontSize * lineHeight;
  let drawHeight = textBlockHeight;

  if (textLayer.warpStyle && textLayer.warpStyle !== 'none') {
    const intensity = (textLayer.curve || 0) / 100;
    const maxDisplacement = Math.abs(intensity) * (textLayer.width / 2);
    drawHeight = textBlockHeight + maxDisplacement * 2;
  }

  const centerX = textLayer.x + textLayer.width / 2;
  const centerY = textLayer.y + drawHeight / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate((textLayer.rotation * Math.PI) / 180);
  applySkew(ctx, textLayer.skewX, textLayer.skewY);

  ctx.globalAlpha = textLayer.opacity;
  if (textLayer.blendMode) {
    ctx.globalCompositeOperation = textLayer.blendMode as GlobalCompositeOperation;
  }

  if (!textLayer.warpStyle || textLayer.warpStyle === 'none') {
    if (textLayer.gradient && textLayer.gradient.enabled) {
      ctx.fillStyle = createTextGradient(ctx, textLayer.width, textBlockHeight, textLayer.gradient);
    } else {
      ctx.fillStyle = textLayer.color;
    }
  }

  ctx.textBaseline = 'middle';

  if (textLayer.shadow && (!textLayer.warpStyle || textLayer.warpStyle === 'none')) {
    ctx.shadowColor = textLayer.shadow.color;
    ctx.shadowBlur = textLayer.shadow.blur;
    ctx.shadowOffsetX = textLayer.shadow.offsetX;
    ctx.shadowOffsetY = textLayer.shadow.offsetY;
  }

  if (textLayer.warpStyle && textLayer.warpStyle !== 'none') {
    drawWarpedText(ctx, textLayer, textBlockHeight, drawHeight);
  } else {
    const align = textLayer.textAlign === 'justify' ? 'left' : textLayer.textAlign;
    ctx.textAlign = align as CanvasTextAlign;

    ctx.translate(0, -textBlockHeight / 2 + (fontSize * lineHeight) / 2);

    lines.forEach((line, index) => {
      const lineY = index * (fontSize * lineHeight);
      let drawX = 0;
      if (textLayer.textAlign === 'left') {
        drawX = -wrapWidth / 2;
      }
      if (textLayer.textAlign === 'right') {
        drawX = wrapWidth / 2;
      }

      if (textLayer.textAlign === 'justify') {
        const lineWords = line.split(' ');
        if (lineWords.length > 1) {
          const totalWordWidth = lineWords.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
          const spaceAvailable = wrapWidth - totalWordWidth;
          const gap = spaceAvailable / (lineWords.length - 1);
          let justifyStartX = -wrapWidth / 2;

          lineWords.forEach((word) => {
            if (textLayer.stroke) {
              ctx.strokeText(word, justifyStartX, lineY);
            }
            ctx.fillText(word, justifyStartX, lineY);
            justifyStartX += ctx.measureText(word).width + gap;
          });
          return;
        }
      }

      if (textLayer.stroke) {
        ctx.lineWidth = textLayer.stroke.width;
        ctx.strokeStyle = textLayer.stroke.color;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, drawX, lineY);
      }

      if (textLayer.depth && textLayer.depth > 0) {
        const depth = textLayer.depth;
        const depthColor = textLayer.depthColor || '#333333';
        ctx.save();
        ctx.fillStyle = depthColor;
        ctx.shadowColor = 'transparent'; // Disable shadow for depth iteration
        for (let i = 1; i <= depth; i++) {
          ctx.fillText(line, drawX + i, lineY + i);
        }
        ctx.restore();
      }
      ctx.fillText(line, drawX, lineY);

      if (textLayer.textDecoration && textLayer.textDecoration !== 'none') {
        const lineWidth = ctx.measureText(line).width;
        let lineStartX = drawX;
        if (textLayer.textAlign === 'justify') {
          lineStartX = -wrapWidth / 2;
        } else if (textLayer.textAlign === 'center') {
          lineStartX = -lineWidth / 2;
        } else if (textLayer.textAlign === 'right') {
          lineStartX = wrapWidth / 2 - lineWidth;
        }

        const thickness = Math.max(1, fontSize / 15);
        ctx.fillStyle = textLayer.color;
        const decoWidth = textLayer.textAlign === 'justify' ? wrapWidth : lineWidth;

        if (textLayer.textDecoration.includes('underline')) {
          ctx.fillRect(lineStartX, lineY + fontSize * 0.5, decoWidth, thickness);
        }
        if (textLayer.textDecoration.includes('line-through')) {
          ctx.fillRect(lineStartX, lineY, decoWidth, thickness);
        }
      }
    });
  }

  ctx.restore();
};

export const exportDesignToImage = async (
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImageUrl: string | null,
  layers: Layer[],
  filters?: CanvasFilters,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<string> => {
  // Try offloading to worker first for better responsiveness if supported
  if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      return await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./exportWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.dataUrl) {
            resolve(e.data.dataUrl);
          } else if (e.data.error) {
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };
        worker.onerror = (err) => {
          reject(err);
          worker.terminate();
        };
        worker.postMessage({
          width,
          height,
          backgroundColor,
          backgroundImageUrl,
          layers,
          filters,
          format,
          quality,
        });
      });
    } catch (err) {
      console.warn('Background export failed, falling back to main thread:', err);
    }
  }

  // Fallback to main-thread implementation
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // 1. Draw Background Color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Background Image
  if (backgroundImageUrl) {
    try {
      const img = await loadImage(backgroundImageUrl);
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > canvasAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      ctx.save();
      if (filters) {
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
        ctx.globalAlpha = filters.opacity;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Vignette for Background
      if (filters?.vignette && filters.vignette > 0) {
        ctx.globalCompositeOperation = 'source-over';
        const radius = Math.max(width, height) / 1.5;
        const startPct = Math.max(0, 0.7 - filters.vignette * 0.005);
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          radius * startPct,
          width / 2,
          height / 2,
          radius
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    } catch (err) {
      console.warn('Failed to load background image for export', err);
    }
  }

  // 3. Draw Layers in Z-Index Order
  for (const layer of layers) {
    if (!layer.visible) {
      continue;
    }

    if (layer.type === 'image') {
      await drawImageLayerToContext(ctx, layer);
    } else if (layer.type === 'text') {
      drawTextLayerToContext(ctx, layer);
    } else {
      drawShapeToContext(ctx, layer);
    }
  }

  // 4. Draw Texture Overlay
  if (filters?.overlayTexture) {
    try {
      const texImg = await loadImage(filters.overlayTexture);
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(texImg, 0, 0, width, height);
      ctx.restore();
    } catch (err) {
      console.warn('Failed to load texture for export', err);
    }
  }

  // Export encoding
  if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', quality);
  }
  if (format === 'webp') {
    return canvas.toDataURL('image/webp', quality);
  }
  return canvas.toDataURL('image/png');
};

/**
 * Exports an image data URL to a PDF file.
 */
export const exportToPDF = async (width: number, height: number, imgDataUrl: string, fileName: string) => {
  const orientation = width > height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: [width, height],
  });
  pdf.addImage(imgDataUrl, 'PNG', 0, 0, width, height);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};

/**
 * Generates an SVG transform string combining translate, rotate, skew, and flip.
 */
const getSVGTransform = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  skewX: number = 0,
  skewY: number = 0,
  flipX: boolean = false,
  flipY: boolean = false
): string => {
  const centerX = width / 2;
  const centerY = height / 2;

  let transform = `translate(${x} ${y})`;
  if (rotation !== 0) {
    transform += ` rotate(${rotation} ${centerX} ${centerY})`;
  }
  if (skewX !== 0 || skewY !== 0) {
    // Svg skew uses degrees. Matrix is more robust but skewX/skewY are standard.
    if (skewX !== 0) {
      transform += ` skewX(${skewX})`;
    }
    if (skewY !== 0) {
      transform += ` skewY(${skewY})`;
    }
  }
  if (flipX || flipY) {
    // To flip around center: translate(center), scale(-1, 1), translate(-center)
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    if (flipX || flipY) {
      transform += ` translate(${centerX} ${centerY}) scale(${sx} ${sy}) translate(${-centerX} ${-centerY})`;
    }
  }
  return transform;
};

/**
 * Creates SVG <defs> for gradients and filters used in the design.
 */
const generateSVGDefs = (layers: Layer[]): string => {
  let defs = '<defs>';

  const addGradient = (grad: any, id: string) => {
    if (!grad || !grad.colors || grad.colors.length === 0) {
      return;
    }
    if (grad.type === 'linear') {
      // CSS angle is 0deg at bottom, 90deg at right.
      // SVG linear gradient: x1, y1 (start), x2, y2 (end)
      const angleRad = (grad.angle - 90) * (Math.PI / 180);
      const x1 = 50 - Math.cos(angleRad) * 50;
      const y1 = 50 - Math.sin(angleRad) * 50;
      const x2 = 50 + Math.cos(angleRad) * 50;
      const y2 = 50 + Math.sin(angleRad) * 50;
      defs += `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
    } else {
      defs += `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">`;
    }

    grad.colors.forEach((c: any) => {
      defs += `<stop offset="${c.position * 100}%" stop-color="${c.color}" />`;
    });

    defs += grad.type === 'linear' ? '</linearGradient>' : '</radialGradient>';
  };

  layers.forEach((layer) => {
    const layerWithGrad = layer as any;
    if (layerWithGrad.gradient && layerWithGrad.gradient.colors?.length > 0) {
      addGradient(layerWithGrad.gradient, `grad-${layer.id}`);
    }
  });

  // Unique Shadow Filters per Layer
  layers.forEach((layer) => {
    if (layer.shadow) {
      const s = layer.shadow;
      // Approximate color for filter (SVG feDropShadow is simplest)
      defs += `
    <filter id="shadow-${layer.id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${s.blur / 2}"/>
      <feOffset dx="${s.offsetX}" dy="${s.offsetY}" result="offsetblur"/>
      <feFlood flood-color="${s.color.split(',').slice(0, 3).join(',') + ')'}" flood-opacity="0.5" />
      <feComposite in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`;
    }
  });

  defs += '</defs>';
  return defs;
};

/**
 * Exports the design as a Scalable Vector Graphic (SVG) string.
 */
export const exportToSVG = (width: number, height: number, backgroundColor: string, layers: Layer[]): string => {
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  // 1. Defs (Gradients, Filters)
  svg += generateSVGDefs(layers);

  // 2. Background
  svg += `<rect width="100%" height="100%" fill="${backgroundColor}" />`;

  // 3. Draw Layers
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  layers.forEach((layer) => {
    if (!layer.visible) {
      return;
    }

    if (layer.type === 'image') {
      const img = layer as ImageLayer;
      const transform = getSVGTransform(
        img.x,
        img.y,
        img.width,
        img.height,
        img.rotation,
        img.skewX,
        img.skewY,
        img.flipX,
        img.flipY
      );

      let imageContent = `<image x="0" y="0" width="${img.width}" height="${img.height}" href="${img.src}" />`;

      if (img.cornerRadius) {
        const clipId = `clip-${img.id}`;
        svg += `<defs><clipPath id="${clipId}"><rect width="${img.width}" height="${img.height}" rx="${img.cornerRadius}" /></clipPath></defs>`;
        imageContent = `<image x="0" y="0" width="${img.width}" height="${img.height}" href="${img.src}" clip-path="url(#${clipId})" />`;
      }

      svg += `<g transform="${transform}" opacity="${img.opacity}">${imageContent}</g>`;
    } else if (layer.type === 'text') {
      const t = layer as TextLayer;
      const transform = getSVGTransform(
        t.x,
        t.y,
        t.width,
        t.fontSize * (t.lineHeight || 1.2),
        t.rotation,
        t.skewX,
        t.skewY
      );
      const fill = t.gradient && t.gradient.enabled ? `url(#grad-${t.id})` : t.color;
      const shadow = t.shadow ? `filter="url(#shadow-${t.id})"` : '';
      const style = `font-family: ${t.fontFamily}; font-size: ${t.fontSize}px; font-weight: ${t.fontWeight}; font-style: ${t.fontStyle}; letter-spacing: ${t.letterSpacing}px;`;

      const anchorMap: any = { left: 'start', center: 'middle', right: 'end', justify: 'start' };
      const anchor = anchorMap[t.textAlign] || 'start';
      const x = t.textAlign === 'center' ? t.width / 2 : t.textAlign === 'right' ? t.width : 0;

      let textLines = [t.text];
      if (tempCtx) {
        tempCtx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`;
        textLines = getLines(tempCtx, t.text, t.width);
      }

      let tspanContent = '';
      textLines.forEach((line, i) => {
        const lineHeightRel = t.fontSize * (t.lineHeight || 1.2);
        tspanContent += `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeightRel}">${line}</tspan>`;
      });

      svg += `<text x="${x}" y="${t.fontSize}" fill="${fill}" text-anchor="${anchor}" style="${style}" transform="${transform}" opacity="${t.opacity}" ${shadow}>${tspanContent}</text>`;
    } else {
      // Shape
      const s = layer as ShapeLayer;
      const transform = getSVGTransform(s.x, s.y, s.width, s.height, s.rotation, s.skewX, s.skewY);
      const fill = s.gradient && s.gradient.colors?.length > 0 ? `url(#grad-${s.id})` : s.color;
      const shadow = s.shadow ? `filter="url(#shadow-${s.id})"` : '';
      const stroke = s.stroke
        ? `stroke="${s.stroke.color}" stroke-width="${s.stroke.width}" stroke-opacity="${s.stroke.opacity ?? 1}" stroke-linejoin="round"`
        : '';

      let shapeTag = '';
      if (s.type === 'rectangle') {
        shapeTag = `<rect width="${s.width}" height="${s.height}" fill="${fill}" rx="${s.cornerRadius || 0}" ${stroke} />`;
      } else if (s.type === 'circle') {
        shapeTag = `<ellipse cx="${s.width / 2}" cy="${s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${fill}" ${stroke} />`;
      } else if (s.type === 'path' && s.pathData) {
        const scaleX = s.width / 100;
        const scaleY = s.height / 100;
        shapeTag = `<path d="${s.pathData}" fill="${fill}" transform="scale(${scaleX} ${scaleY})" ${stroke} />`;
      } else {
        shapeTag = `<rect width="${s.width}" height="${s.height}" fill="${fill}" ${stroke} />`;
      }

      svg += `<g transform="${transform}" opacity="${s.opacity}" ${shadow}>${shapeTag}</g>`;
    }
  });

  svg += `</svg>`;
  return svg;
};
