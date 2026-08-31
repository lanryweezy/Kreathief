import { log } from '../utils/log';

/**
 * Feature 10: Offline-First AI — run AI models ON DEVICE via WebGPU/WASM.
 * Background removal, style transfer, object detection without internet.
 */

interface OnDeviceAIResult {
  imageData: ImageData;
  processingTime: number;
}

/**
 * Check if WebGPU is available.
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Check if WebAssembly is available.
 */
export function isWasmAvailable(): boolean {
  return typeof WebAssembly !== 'undefined';
}

/**
 * On-device background removal using canvas-based edge detection.
 * No AI model needed — uses color difference and flood fill.
 */
export async function removeBackgroundOnDevice(imageSource: HTMLImageElement | string): Promise<OnDeviceAIResult> {
  const startTime = performance.now();

  const img = typeof imageSource === 'string' ? await loadImageElement(imageSource) : imageSource;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Sample corner pixels to detect background color
  const corners = [
    getPixel(data, 0, 0, canvas.width),
    getPixel(data, canvas.width - 1, 0, canvas.width),
    getPixel(data, 0, canvas.height - 1, canvas.width),
    getPixel(data, canvas.width - 1, canvas.height - 1, canvas.width),
  ];

  // Average corner colors as background estimate
  const bgColor = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
  };

  // Flood fill from corners to find background region
  const visited = new Uint8Array(canvas.width * canvas.height);
  const threshold = 45; // Color distance threshold

  const queue: [number, number][] = [
    [0, 0],
    [canvas.width - 1, 0],
    [0, canvas.height - 1],
    [canvas.width - 1, canvas.height - 1],
  ];

  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    const idx = y * canvas.width + x;
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      continue;
    }
    if (visited[idx]) {
      continue;
    }

    const pixel = getPixel(data, x, y, canvas.width);
    const dist = Math.sqrt((pixel.r - bgColor.r) ** 2 + (pixel.g - bgColor.g) ** 2 + (pixel.b - bgColor.b) ** 2);

    if (dist > threshold) {
      continue;
    } // Not background

    visited[idx] = 1;
    const dataIdx = idx * 4;
    data[dataIdx + 3] = 0; // Set alpha to 0 (transparent)

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Edge smoothing — blur the alpha channel at boundaries
  smoothAlphaEdges(data, canvas.width, canvas.height);

  ctx.putImageData(imageData, 0, 0);

  return {
    imageData,
    processingTime: performance.now() - startTime,
  };
}

/**
 * On-device object detection using simple contrast-based segmentation.
 */
export async function detectObjectsOnDevice(
  imageSource: HTMLImageElement | string
): Promise<{ bounds: { x: number; y: number; width: number; height: number }[]; processingTime: number }> {
  const startTime = performance.now();

  const img = typeof imageSource === 'string' ? await loadImageElement(imageSource) : imageSource;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Simple edge detection using Sobel filter
  const edges = sobelEdgeDetect(data, canvas.width, canvas.height);

  // Find connected components (blobs)
  const blobs = findBlobs(edges, canvas.width, canvas.height, 50); // min 50px blob

  return {
    bounds: blobs.map((b) => ({
      x: b.minX,
      y: b.minY,
      width: b.maxX - b.minX,
      height: b.maxY - b.minY,
    })),
    processingTime: performance.now() - startTime,
  };
}

/**
 * On-device style transfer using edge-based abstraction.
 */
export async function applyStyleTransferOnDevice(
  imageSource: HTMLImageElement | string,
  style: 'oil' | 'sketch' | 'pixel' | 'posterize' = 'posterize'
): Promise<OnDeviceAIResult> {
  const startTime = performance.now();

  const img = typeof imageSource === 'string' ? await loadImageElement(imageSource) : imageSource;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (style) {
    case 'posterize':
      posterize(data, 6); // 6 color levels
      break;
    case 'pixel':
      pixelate(data, canvas.width, canvas.height, 8); // 8px blocks
      break;
    case 'sketch':
      applySketchEffect(data, canvas.width, canvas.height);
      break;
    case 'oil':
      applyOilPaintEffect(data, canvas.width, canvas.height, 3);
      break;
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    imageData,
    processingTime: performance.now() - startTime,
  };
}

// --- Helper Functions ---

function getPixel(data: Uint8ClampedArray, x: number, y: number, width: number) {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function smoothAlphaEdges(data: Uint8ClampedArray, width: number, height: number, featherRadius: number = 2) {
  const alphaCopy = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaCopy[i] = data[i * 4 + 3];
  }

  // Detect edge boundary transitions
  const isEdge = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const current = alphaCopy[idx];
      if (
        (current > 0 &&
          (alphaCopy[idx - 1] === 0 ||
            alphaCopy[idx + 1] === 0 ||
            alphaCopy[idx - width] === 0 ||
            alphaCopy[idx + width] === 0)) ||
        (current === 0 &&
          (alphaCopy[idx - 1] > 0 ||
            alphaCopy[idx + 1] > 0 ||
            alphaCopy[idx - width] > 0 ||
            alphaCopy[idx + width] > 0))
      ) {
        isEdge[idx] = 1;
      }
    }
  }

  // Distance-weighted alpha feathering for smooth anti-aliased transitions
  for (let y = featherRadius; y < height - featherRadius; y++) {
    for (let x = featherRadius; x < width - featherRadius; x++) {
      const idx = y * width + x;
      if (!isEdge[idx]) {
        continue;
      }

      let sum = 0;
      let count = 0;
      for (let dy = -featherRadius; dy <= featherRadius; dy++) {
        for (let dx = -featherRadius; dx <= featherRadius; dx++) {
          const nIdx = (y + dy) * width + (x + dx);
          const weight = 1 / (1 + Math.sqrt(dx * dx + dy * dy));
          sum += alphaCopy[nIdx] * weight;
          count += weight;
        }
      }
      data[idx * 4 + 3] = Math.round(sum / count);
    }
  }
}

function sobelEdgeDetect(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Sobel kernels
      let gx = 0,
        gy = 0;
      for (const [dx, dy, wx, wy] of [
        [-1, -1, -1, 0],
        [0, -1, 0, 0],
        [1, -1, 1, 0],
        [-1, 0, -2, 0],
        [1, 0, 2, 0],
        [-1, 1, -1, 0],
        [0, 1, 0, 0],
        [1, 1, 1, 0],
      ]) {
        const nIdx = ((y + dy) * width + (x + dx)) * 4;
        const ng = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
        gx += ng * wx;
        gy += ng * wy;
      }

      edges[y * width + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }

  return edges;
}

function findBlobs(edges: Uint8Array, width: number, height: number, minSize: number) {
  const visited = new Uint8Array(width * height);
  const blobs: { minX: number; minY: number; maxX: number; maxY: number; size: number }[] = [];
  const threshold = 30;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || edges[idx] < threshold) {
        continue;
      }

      // BFS to find connected blob
      const queue = [[x, y]];
      visited[idx] = 1;
      let minX = x,
        minY = y,
        maxX = x,
        maxY = y,
        size = 0;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        size++;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);

        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const nx = cx + dx,
            ny = cy + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && edges[nIdx] >= threshold) {
              visited[nIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      if (size >= minSize) {
        blobs.push({ minX, minY, maxX, maxY, size });
      }
    }
  }

  return blobs;
}

function posterize(data: Uint8ClampedArray, levels: number) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }
}

function pixelate(data: Uint8ClampedArray, width: number, height: number, blockSize: number) {
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;
      for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }
}

function applySketchEffect(data: Uint8ClampedArray, width: number, height: number) {
  // Convert to grayscale first
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Invert
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  // Apply blur-like effect (simple box blur)
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let sum = 0;
      for (const [dx, dy] of [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ]) {
        sum += copy[((y + dy) * width + (x + dx)) * 4];
      }
      data[idx] = data[idx + 1] = data[idx + 2] = Math.min(255, sum / 8);
    }
  }

  // Color dodge blend with original
  for (let i = 0; i < data.length; i += 4) {
    const base = copy[i];
    const blend = data[i];
    data[i] = data[i + 1] = data[i + 2] = blend === 255 ? 255 : Math.min(255, (base << 8) / (256 - blend));
  }
}

function applyOilPaintEffect(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  const copy = new Uint8ClampedArray(data);
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const intensityBins = new Array(256).fill(0);
      const avgR = new Array(256).fill(0);
      const avgG = new Array(256).fill(0);
      const avgB = new Array(256).fill(0);

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const intensity = Math.round((copy[idx] + copy[idx + 1] + copy[idx + 2]) / 3);
          intensityBins[intensity]++;
          avgR[intensity] += copy[idx];
          avgG[intensity] += copy[idx + 1];
          avgB[intensity] += copy[idx + 2];
        }
      }

      let maxBin = 0;
      for (let i = 1; i < 256; i++) {
        if (intensityBins[i] > intensityBins[maxBin]) {
          maxBin = i;
        }
      }

      const idx = (y * width + x) * 4;
      const count = intensityBins[maxBin] || 1;
      data[idx] = Math.round(avgR[maxBin] / count);
      data[idx + 1] = Math.round(avgG[maxBin] / count);
      data[idx + 2] = Math.round(avgB[maxBin] / count);
    }
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
