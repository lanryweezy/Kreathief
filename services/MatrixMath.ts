/**
 * 2D Affine Matrix Math Utility
 * Represented as:
 * [ a c e ]
 * [ b d f ]
 * [ 0 0 1 ]
 */
export interface Matrix {
  a: number; // Scale X
  b: number; // Skew Y
  c: number; // Skew X
  d: number; // Scale Y
  e: number; // Translate X
  f: number; // Translate Y
}

export const MatrixMath = {
  identity(): Matrix {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  },

  multiply(m1: Matrix, m2: Matrix): Matrix {
    return {
      a: m1.a * m2.a + m1.c * m2.b,
      b: m1.b * m2.a + m1.d * m2.b,
      c: m1.a * m2.c + m1.c * m2.d,
      d: m1.b * m2.c + m1.d * m2.d,
      e: m1.a * m2.e + m1.c * m2.f + m1.e,
      f: m1.b * m2.e + m1.d * m2.f + m1.f,
    };
  },

  translate(m: Matrix, tx: number, ty: number): Matrix {
    return this.multiply(m, { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
  },

  rotate(m: Matrix, angleRad: number): Matrix {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return this.multiply(m, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
  },

  scale(m: Matrix, sx: number, sy: number): Matrix {
    return this.multiply(m, { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });
  },

  inverse(m: Matrix): Matrix {
    const det = m.a * m.d - m.b * m.c;
    if (Math.abs(det) < 1e-10) {
      return this.identity();
    }
    const invDet = 1 / det;
    return {
      a: m.d * invDet,
      b: -m.b * invDet,
      c: -m.c * invDet,
      d: m.a * invDet,
      e: (m.c * m.f - m.d * m.e) * invDet,
      f: (m.b * m.e - m.a * m.f) * invDet,
    };
  },

  applyToPoint(m: Matrix, x: number, y: number): { x: number; y: number } {
    return {
      x: m.a * x + m.c * y + m.e,
      y: m.b * x + m.d * y + m.f,
    };
  },

  /**
   * Compose a matrix from layer properties.
   * Pivot is usually the center for rotation in design tools.
   */
  compose(
    x: number,
    y: number,
    width: number,
    height: number,
    rotationDeg: number,
    pivotX: number = 0.5,
    pivotY: number = 0.5
  ): Matrix {
    const angleRad = (rotationDeg * Math.PI) / 180;
    const px = width * pivotX;
    const py = height * pivotY;

    let m = this.identity();
    m = this.translate(m, x + px, y + py); // 3. Move to world position
    m = this.rotate(m, angleRad); // 2. Rotate around pivot
    m = this.translate(m, -px, -py); // 1. Move pivot to origin
    return m;
  },

  /**
   * Decompose matrix back to basic properties (assuming no skew).
   */
  decompose(
    m: Matrix,
    _pivotXPct: number = 0.5,
    _pivotYPct: number = 0.5,
    currentWidth: number,
    currentHeight: number
  ) {
    const rotationRad = Math.atan2(m.b, m.a);
    const rotation = (rotationRad * 180) / Math.PI;

    // Scale is the magnitude of the basis vectors
    const scaleX = Math.sqrt(m.a * m.a + m.b * m.b);
    const scaleY = Math.sqrt(m.c * m.c + m.d * m.d);

    // To find X, Y (top-left), we need to reverse the pivot logic
    // Matrix = T(pos+pivot) * R(rot) * T(-pivot)
    // We want to find the top-left (0,0) point in world space
    const topLeft = this.applyToPoint(m, 0, 0);

    return {
      x: topLeft.x,
      y: topLeft.y,
      rotation,
      width: currentWidth * scaleX,
      height: currentHeight * scaleY,
    };
  },
};
