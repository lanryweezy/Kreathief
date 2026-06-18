export class MatrixMath {
  static multiply(m1: number[], m2: number[]): number[] {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }

  static rotate(deg: number): number[] {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [cos, sin, -sin, cos, 0, 0];
  }

  static scale(sx: number, sy: number): number[] {
    return [sx, 0, 0, sy, 0, 0];
  }

  static translate(tx: number, ty: number): number[] {
    return [1, 0, 0, 1, tx, ty];
  }

  static transformPoint(p: { x: number; y: number }, m: number[]) {
    return {
      x: p.x * m[0] + p.y * m[2] + m[4],
      y: p.x * m[1] + p.y * m[3] + m[5],
    };
  }
}
