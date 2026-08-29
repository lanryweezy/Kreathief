import ImageTracer from 'imagetracerjs';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

function getPixel(data: Uint8ClampedArray, x: number, y: number, width: number) {
  const idx = (y * width + x) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
}

/**
 * Heavy Worker
 * Handles compute-intensive tasks for Kreathief.
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, id, payload } = e.data;

  try {
    switch (type) {
      case 'REMOVE_BACKGROUND': {
        let resultBlob: Blob;
        try {
          resultBlob = await imglyRemoveBackground(payload.imageUrl);
        } catch (onnxErr) {
          // ONNX/WebGPU/WASM failed — fall back to canvas-based edge detection
          const img = await createImageBitmap(await (await fetch(payload.imageUrl)).blob());
          const canvas = new OffscreenCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const corners = [
            getPixel(data, 0, 0, canvas.width),
            getPixel(data, canvas.width - 1, 0, canvas.width),
            getPixel(data, 0, canvas.height - 1, canvas.width),
            getPixel(data, canvas.width - 1, canvas.height - 1, canvas.width),
          ];
          const bgColor = {
            r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
            g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
            b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
          };
          const visited = new Uint8Array(canvas.width * canvas.height);
          const threshold = 45;
          const queue: [number, number][] = [
            [0, 0],
            [canvas.width - 1, 0],
            [0, canvas.height - 1],
            [canvas.width - 1, canvas.height - 1],
          ];
          while (queue.length > 0) {
            const [x, y] = queue.pop()!;
            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
            const idx = y * canvas.width + x;
            if (visited[idx]) continue;
            const pixel = getPixel(data, x, y, canvas.width);
            const dist = Math.sqrt(
              (pixel.r - bgColor.r) ** 2 + (pixel.g - bgColor.g) ** 2 + (pixel.b - bgColor.b) ** 2
            );
            if (dist > threshold) continue;
            visited[idx] = 1;
            data[idx * 4 + 3] = 0;
            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
          }
          ctx.putImageData(imageData, 0, 0);
          resultBlob = await canvas.convertToBlob({ type: 'image/png' });
        }
        const reader = new FileReader();
        const base64: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(resultBlob);
        });
        self.postMessage({ type: 'SUCCESS', id, payload: base64 });
        break;
      }

      case 'VECTORIZE': {
        const svgString = await vectorize(payload.imageUrl, payload.options);
        self.postMessage({ type: 'SUCCESS', id, payload: svgString });
        break;
      }

      case 'ENHANCE': {
        const enhancedUrl = await algorithmicEnhance(payload.imageSrc);
        self.postMessage({ type: 'SUCCESS', id, payload: enhancedUrl });
        break;
      }

      case 'EXTRACT_PALETTE': {
        const palette = await extractPalette(payload.imageSrc, payload.colorCount);
        self.postMessage({ type: 'SUCCESS', id, payload: palette });
        break;
      }

      case 'TRACE_SVG': {
        const traceResults = await traceImageToSVG(payload.imageSrc, payload.colors);
        self.postMessage({ type: 'SUCCESS', id, payload: traceResults });
        break;
      }

      case 'APPLY_FILTERS': {
        const { imageSrc, filters } = payload;
        const processedUrl = await applyFiltersToImage(imageSrc, filters);
        self.postMessage({ type: 'SUCCESS', id, payload: processedUrl });
        break;
      }

      case 'GENERATE_GRAIN': {
        const { width, height, noise, scale } = payload;
        const grainUrl = await generateGrainTexture(width, height, noise, scale);
        self.postMessage({ type: 'SUCCESS', id, payload: grainUrl });
        break;
      }

      default:
        self.postMessage({ type: 'ERROR', id, error: `Unknown task type: ${type}` });
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', id, error: error.message || 'Worker task failed' });
  }
};

// --- Task Implementations ---

async function generateGrainTexture(width: number, height: number, noise: number, scale: number): Promise<string> {
  const canvas = new OffscreenCanvas(width / scale, height / scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Offscreen context failed');
  }

  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const val = Math.random() * 255;
    data[i] = val; // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
    data[i + 3] = noise * 2.55; // Alpha based on noise intensity
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}

async function applyFiltersToImage(imageSrc: string, filters: any): Promise<string> {
  const bitmap = await fetchImageBitmap(imageSrc);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Offscreen context failed');
  }

  // Apply filters using Canvas context for speed where possible
  const filterStr = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px) hue-rotate(${filters.hueRotate || 0}deg)`;
  ctx.filter = filterStr;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // If vignette is requested, apply it manually via pixel manipulation or radial gradient
  if (filters.vignette > 0) {
    const radius = Math.max(canvas.width, canvas.height) / 1.5;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      radius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
    ctx.filter = 'none';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}

async function vectorize(imageUrl: string, options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      ImageTracer.imageToSVG(
        imageUrl,
        (svgString: string) => {
          if (svgString) {
            resolve(svgString);
          } else {
            reject(new Error('Vectorization failed'));
          }
        },
        options
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function algorithmicEnhance(imageSrc: string): Promise<string> {
  const bitmap = await fetchImageBitmap(imageSrc);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Offscreen context failed');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Histogram Stretching & AWB Logic
  let minR = 255,
    maxR = 0,
    minG = 255,
    maxG = 0,
    minB = 255,
    maxB = 0;
  let sumR = 0,
    sumG = 0,
    sumB = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (r < minR) {
      minR = r;
    }
    if (r > maxR) {
      maxR = r;
    }
    if (g < minG) {
      minG = g;
    }
    if (g > maxG) {
      maxG = g;
    }
    if (b < minB) {
      minB = b;
    }
    if (b > maxB) {
      maxB = b;
    }
    sumR += r;
    sumG += g;
    sumB += b;
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const avgGray = (avgR + avgG + avgB) / 3;

  const scaleR = avgGray / avgR;
  const scaleG = avgGray / avgG;
  const scaleB = avgGray / avgB;

  for (let i = 0; i < data.length; i += 4) {
    let r = (data[i] - minR) * (255 / (maxR - minR || 1));
    let g = (data[i + 1] - minG) * (255 / (maxG - minG || 1));
    let b = (data[i + 2] - minB) * (255 / (maxB - minB || 1));
    r *= scaleR;
    g *= scaleG;
    b *= scaleB;
    const contrast = 1.1;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}

async function extractPalette(imageSrc: string, colorCount: number = 5): Promise<string[]> {
  const bitmap = await fetchImageBitmap(imageSrc);
  const canvas = new OffscreenCanvas(100, (bitmap.height / bitmap.width) * 100);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Offscreen context failed');
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const colors: { r: number; g: number; b: number; count: number }[] = [];

  for (let i = 0; i < data.length; i += 12) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      a = data[i + 3];
    if (a < 128) {
      continue;
    }

    let bestMatch = -1;
    let minDist = 1600;

    for (let j = 0; j < colors.length; j++) {
      const dr = colors[j].r - r,
        dg = colors[j].g - g,
        db = colors[j].b - b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        bestMatch = j;
      }
    }

    if (bestMatch !== -1) {
      const m = colors[bestMatch];
      m.count++;
      m.r = (m.r * 3 + r) / 4;
      m.g = (m.g * 3 + g) / 4;
      m.b = (m.b * 3 + b) / 4;
    } else if (colors.length < colorCount * 4) {
      colors.push({ r, g, b, count: 1 });
    }
  }

  return colors
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount)
    .map((c) => {
      const r = Math.round(c.r).toString(16).padStart(2, '0');
      const g = Math.round(c.g).toString(16).padStart(2, '0');
      const b = Math.round(c.b).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    });
}

async function traceImageToSVG(imageSrc: string, colors: number = 2): Promise<any[]> {
  const bitmap = await fetchImageBitmap(imageSrc);
  const size = 64;
  const canvas = new OffscreenCanvas(size, (bitmap.height / bitmap.width) * size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Offscreen context failed');
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const results: { path: string; color: string }[] = [];
  const colorGrids = new Map<string, boolean[][]>();

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i + 3] < 128) {
        continue;
      }

      const r = Math.round(data[i] / 64) * 64;
      const g = Math.round(data[i + 1] / 64) * 64;
      const b = Math.round(data[i + 2] / 64) * 64;
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

      if (!colorGrids.has(hex)) {
        colorGrids.set(
          hex,
          Array.from({ length: Math.ceil(canvas.height) }, () => new Array(Math.ceil(canvas.width)).fill(false))
        );
      }
      colorGrids.get(hex)![y][x] = true;
    }
  }

  colorGrids.forEach((grid, color) => {
    let d = '';
    const nh = (1 / canvas.height) * 100;
    for (let y = 0; y < canvas.height; y++) {
      let startX = -1;
      for (let x = 0; x <= canvas.width; x++) {
        const hasPixel = x < canvas.width && grid[y][x];
        if (hasPixel && startX === -1) {
          startX = x;
        } else if (!hasPixel && startX !== -1) {
          const nx = (startX / canvas.width) * 100;
          const ny = (y / canvas.height) * 100;
          const spanW = ((x - startX) / canvas.width) * 100;
          d += `M${nx},${ny} h${spanW} v${nh} h-${spanW} z `;
          startX = -1;
        }
      }
    }
    if (d) {
      results.push({ path: d, color });
    }
  });

  return results.slice(0, colors);
}

// --- Helpers ---

async function fetchImageBitmap(src: string): Promise<ImageBitmap> {
  const response = await fetch(src);
  const blob = await response.blob();
  return createImageBitmap(blob);
}
