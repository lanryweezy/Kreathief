// Computes 3x3 Homography mapping (0,0), (w,0), (w,h), (0,h) to 4 arbitrary points
export function getHomographyMatrix(
  w: number,
  h: number,
  dst: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }]
): number[] {
  const [p0, p1, p2, p3] = dst;

  // Source corners: (0,0), (w,0), (w,h), (0,h)
  const src = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h }
  ];

  // Construct 8x8 system: A * h = b
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = src[i];
    const { x, y } = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }

  // Solve 8x8 system via standard Gaussian Elimination
  const hVec = solveGaussian(A, b); 
  
  // Return column-major 3x3 matrix for WebGL uniform or CSS matrix3d
  return [
    hVec[0], hVec[3], hVec[6],
    hVec[1], hVec[4], hVec[7],
    hVec[2], hVec[5], 1.0
  ];
}

function solveGaussian(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) A[k][j] = 0;
        else A[k][j] += c * A[i][j];
      }
      b[k] += c * b[i];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
}

export function getCSSMatrix3d(h: number[]): string {
  // Expands the 3x3 projective matrix into a 4x4 matrix for CSS transform: matrix3d()
  // h is column-major: [h00, h10, h20, h01, h11, h21, h02, h12, h22]
  return `matrix3d(
    ${h[0]}, ${h[1]}, 0, ${h[2]},
    ${h[3]}, ${h[4]}, 0, ${h[5]},
    0, 0, 1, 0,
    ${h[6]}, ${h[7]}, 0, ${h[8]}
  )`;
}
