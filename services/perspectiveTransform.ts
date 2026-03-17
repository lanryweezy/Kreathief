// Perspective and Corner Pinning Utilities for Mockup Studio

export interface Point {
  x: number;
  y: number;
}

export interface CornerPoints {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

/**
 * Calculate perspective transform matrix from corner points
 * Uses homography transformation
 */
export function getPerspectiveTransform(
  src: CornerPoints,
  dst: CornerPoints
): number[] {
  const { topLeft: s0, topRight: s1, bottomRight: s2, bottomLeft: s3 } = src;
  const { topLeft: d0, topRight: d1, bottomRight: d2, bottomLeft: d3 } = dst;

  // Build system of equations for homography
  const A = [
    [s0.x, s0.y, 1, 0, 0, 0, -s0.x * d0.x, -s0.y * d0.x],
    [0, 0, 0, s0.x, s0.y, 1, -s0.x * d0.y, -s0.y * d0.y],
    [s1.x, s1.y, 1, 0, 0, 0, -s1.x * d1.x, -s1.y * d1.x],
    [0, 0, 0, s1.x, s1.y, 1, -s1.x * d1.y, -s1.y * d1.y],
    [s2.x, s2.y, 1, 0, 0, 0, -s2.x * d2.x, -s2.y * d2.x],
    [0, 0, 0, s2.x, s2.y, 1, -s2.x * d2.y, -s2.y * d2.y],
    [s3.x, s3.y, 1, 0, 0, 0, -s3.x * d3.x, -s3.y * d3.x],
    [0, 0, 0, s3.x, s3.y, 1, -s3.x * d3.y, -s3.y * d3.y],
  ];

  const b = [d0.x, d0.y, d1.x, d1.y, d2.x, d2.y, d3.x, d3.y];

  // Solve using Gaussian elimination
  const h = gaussianElimination(A, b);

  // Return 3x3 matrix (flattened to array)
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * Apply perspective transform to a point
 */
export function transformPoint(point: Point, matrix: number[]): Point {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const x = point.x;
  const y = point.y;

  const w = g * x + h * y + i;
  if (Math.abs(w) < 0.0001) {
    return { x, y };
  }

  return {
    x: (a * x + b * y + c) / w,
    y: (d * x + e * y + f) / w,
  };
}

/**
 * Gaussian elimination for solving linear system Ax = b
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += M[i][j] * x[j];
    }
    x[i] = (M[i][n] - sum) / M[i][i];
  }

  return x;
}

/**
 * Calculate default corner points from placement
 */
export function getDefaultCornerPoints(
  width: number,
  height: number,
  placement: {
    top: number;
    left: number;
    width: number;
    rotate: number;
    skewX: number;
    skewY: number;
  }
): CornerPoints {
  const containerW = width;
  const containerH = height;

  // Calculate design dimensions
  const designW = (placement.width / 100) * containerW;
  const aspectRatio = 1; // Assume square design
  const designH = designW / aspectRatio;

  const centerX = (placement.left / 100) * containerW + designW / 2;
  const centerY = (placement.top / 100) * containerH + designH / 2;

  // Apply rotation and skew
  const rotRad = (placement.rotate * Math.PI) / 180;
  const skewXRad = (placement.skewX * Math.PI) / 180;
  const skewYRad = (placement.skewY * Math.PI) / 180;

  const corners = [
    { x: -designW / 2, y: -designH / 2 }, // Top-left
    { x: designW / 2, y: -designH / 2 }, // Top-right
    { x: designW / 2, y: designH / 2 }, // Bottom-right
    { x: -designW / 2, y: designH / 2 }, // Bottom-left
  ];

  const transformed = corners.map((corner) => {
    // Apply skew
    const x = corner.x + corner.y * Math.tan(skewXRad);
    const y = corner.y + corner.x * Math.tan(skewYRad);

    // Apply rotation
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    return {
      x: centerX + rotatedX,
      y: centerY + rotatedY,
    };
  });

  return {
    topLeft: transformed[0],
    topRight: transformed[1],
    bottomRight: transformed[2],
    bottomLeft: transformed[3],
  };
}

/**
 * Apply perspective warp to canvas
 */
export function applyPerspectiveWarp(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  corners: CornerPoints
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Create temporary canvas for the transformation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {return;}

  // Draw image normally first
  tempCtx.drawImage(image, 0, 0);

  // Get source corners (the image corners)
  const srcCorners: CornerPoints = {
    topLeft: { x: 0, y: 0 },
    topRight: { x: image.width, y: 0 },
    bottomRight: { x: image.width, y: image.height },
    bottomLeft: { x: 0, y: image.height },
  };

  // Get perspective transform matrix
  const matrix = getPerspectiveTransform(srcCorners, corners);

  // Apply transform to main canvas
  ctx.setTransform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);

  // Draw the transformed image
  ctx.drawImage(tempCanvas, 0, 0, image.width, image.height);

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Interpolate between two points
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

/**
 * Calculate perspective intensity from corner points
 */
export function getPerspectiveIntensity(corners: CornerPoints): number {
  const topWidth = Math.abs(corners.topRight.x - corners.topLeft.x);
  const bottomWidth = Math.abs(corners.bottomRight.x - corners.bottomLeft.x);
  const leftHeight = Math.abs(corners.bottomLeft.y - corners.topLeft.y);
  const rightHeight = Math.abs(corners.bottomRight.y - corners.topRight.y);

  const widthDiff = Math.abs(topWidth - bottomWidth) / Math.max(topWidth, bottomWidth);
  const heightDiff = Math.abs(leftHeight - rightHeight) / Math.max(leftHeight, rightHeight);

  return (widthDiff + heightDiff) / 2;
}

/**
 * Apply curve effect to corners (for cylindrical surfaces)
 */
export function applyCurveToCorners(
  corners: CornerPoints,
  curve: number,
  width: number,
  _height: number
): CornerPoints {
  if (curve === 0) {return corners;}

  const curveRad = (curve * Math.PI) / 180;
  // const midX = width / 2;

  // Calculate curve offset
  const curveOffset = Math.sin(curveRad) * (width / 4);

  return {
    topLeft: {
      x: corners.topLeft.x - curveOffset,
      y: corners.topLeft.y + Math.abs(curve) * 0.5,
    },
    topRight: {
      x: corners.topRight.x + curveOffset,
      y: corners.topRight.y + Math.abs(curve) * 0.5,
    },
    bottomLeft: {
      x: corners.bottomLeft.x - curveOffset,
      y: corners.bottomLeft.y - Math.abs(curve) * 0.5,
    },
    bottomRight: {
      x: corners.bottomRight.x + curveOffset,
      y: corners.bottomRight.y - Math.abs(curve) * 0.5,
    },
  };
}

/**
 * Convert corner points to percentage-based coordinates
 */
export function cornersToPercentages(
  corners: CornerPoints,
  containerWidth: number,
  containerHeight: number
): {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
} {
  return {
    topLeft: {
      x: (corners.topLeft.x / containerWidth) * 100,
      y: (corners.topLeft.y / containerHeight) * 100,
    },
    topRight: {
      x: (corners.topRight.x / containerWidth) * 100,
      y: (corners.topRight.y / containerHeight) * 100,
    },
    bottomLeft: {
      x: (corners.bottomLeft.x / containerWidth) * 100,
      y: (corners.bottomLeft.y / containerHeight) * 100,
    },
    bottomRight: {
      x: (corners.bottomRight.x / containerWidth) * 100,
      y: (corners.bottomRight.y / containerHeight) * 100,
    },
  };
}

/**
 * Convert percentage-based corners to pixel coordinates
 */
export function cornersFromPercentages(
  corners: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  },
  containerWidth: number,
  containerHeight: number
): CornerPoints {
  return {
    topLeft: {
      x: (corners.topLeft.x / 100) * containerWidth,
      y: (corners.topLeft.y / 100) * containerHeight,
    },
    topRight: {
      x: (corners.topRight.x / 100) * containerWidth,
      y: (corners.topRight.y / 100) * containerHeight,
    },
    bottomLeft: {
      x: (corners.bottomLeft.x / 100) * containerWidth,
      y: (corners.bottomLeft.y / 100) * containerHeight,
    },
    bottomRight: {
      x: (corners.bottomRight.x / 100) * containerWidth,
      y: (corners.bottomRight.y / 100) * containerHeight,
    },
  };
}
