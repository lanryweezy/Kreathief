/**
 * Color Extraction Utility
 *
 * Extracts dominant colors from an image using a lightweight k-means clustering
 * approach on a down-sampled canvas. Returns 5 hex color strings.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert RGB to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate Euclidean distance between two RGB colors.
 */
function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Simple k-means clustering on RGB pixel data.
 * @param pixels - Array of RGB pixel values
 * @param k - Number of clusters (default 5)
 * @param maxIterations - Maximum iterations (default 10)
 * @returns Array of k cluster center colors
 */
function kMeansClustering(pixels: RGB[], k: number = 5, maxIterations: number = 10): RGB[] {
  if (pixels.length === 0) {
    return [];
  }
  if (pixels.length <= k) {
    return pixels;
  }

  // Initialize centroids using evenly spaced sampling from the pixel array
  const step = Math.floor(pixels.length / k);
  const centroids: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push({ ...pixels[i * step] });
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest centroid
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = colorDistance(pixel, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      clusters[bestCluster].push(pixel);
    }

    // Recompute centroids
    let converged = true;
    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) {
        continue;
      }

      const newR = clusters[c].reduce((sum, p) => sum + p.r, 0) / clusters[c].length;
      const newG = clusters[c].reduce((sum, p) => sum + p.g, 0) / clusters[c].length;
      const newB = clusters[c].reduce((sum, p) => sum + p.b, 0) / clusters[c].length;

      const newCentroid = { r: newR, g: newG, b: newB };
      if (colorDistance(centroids[c], newCentroid) > 1) {
        converged = false;
      }
      centroids[c] = newCentroid;
    }

    if (converged) {
      break;
    }
  }

  // Sort centroids by visual weight (darker colors first, then brighter)
  centroids.sort((a, b) => {
    const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
    const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
    return lumA - lumB;
  });

  return centroids;
}

/**
 * Extract the dominant colors from an image URL.
 * Creates a temporary canvas, draws the image at a small size,
 * samples pixel data, and runs k-means clustering.
 *
 * @param imageUrl - URL of the image (can be a blob URL, data URL, or http URL)
 * @param colorCount - Number of dominant colors to extract (default 5)
 * @returns Promise resolving to an array of hex color strings
 */
export async function extractDominantColors(imageUrl: string, colorCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Down-sample to a small canvas for performance (max 50×50)
        const maxDim = 50;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Sample pixels, skipping fully transparent ones
        const pixels: RGB[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) {
            continue;
          } // skip transparent pixels

          // Skip near-white and near-black pixels to get more interesting colors
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 245 && g > 245 && b > 245) {
            continue;
          } // near-white
          if (r < 10 && g < 10 && b < 10) {
            continue;
          } // near-black

          pixels.push({ r, g, b });
        }

        // If too few interesting pixels, include all opaque pixels
        if (pixels.length < colorCount * 2) {
          pixels.length = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) {
              continue;
            }
            pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
          }
        }

        if (pixels.length === 0) {
          resolve([]);
          return;
        }

        const centroids = kMeansClustering(pixels, colorCount);

        // Filter out colors that are too similar (distance < 30)
        const uniqueColors: RGB[] = [];
        for (const c of centroids) {
          const isDuplicate = uniqueColors.some((u) => colorDistance(u, c) < 30);
          if (!isDuplicate) {
            uniqueColors.push(c);
          }
        }

        const hexColors = uniqueColors.map((c) => rgbToHex(c.r, c.g, c.b));
        resolve(hexColors);
      } catch (err) {
        // Silently fail — color extraction is non-critical
        resolve([]);
      }
    };

    img.onerror = () => {
      // Silently fail — image may be cross-origin restricted
      resolve([]);
    };

    img.src = imageUrl;
  });
}
