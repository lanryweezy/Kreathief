import { VectorPath, VectorPoint, PointType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { BezierMath } from './bezierMath';

export class VectorUtils {
    static lastPathData: string = '';

    /**
     * Serializes a VectorPath into an SVG path data string ('d')
     */
    static serializePath(path: VectorPath): string {
        if (path.points.length === 0) return '';

        let d = '';
        path.points.forEach((point, i) => {
            if (i === 0) {
                d += `M ${point.x} ${point.y}`;
            } else {
                const prev = path.points[i - 1];
                if (prev.handleOut || point.handleIn) {
                    // Cubic Bezier
                    const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
                    const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;
                    const cp2x = point.handleIn ? point.x + point.handleIn.x : point.x;
                    const cp2y = point.handleIn ? point.y + point.handleIn.y : point.y;
                    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
                } else {
                    // Line
                    d += ` L ${point.x} ${point.y}`;
                }
            }
        });

        if (path.isClosed) {
            // If closed, handle the curve back to start if necessary
            const last = path.points[path.points.length - 1];
            const first = path.points[0];
            if (last.handleOut || first.handleIn) {
                const cp1x = last.handleOut ? last.x + last.handleOut.x : last.x;
                const cp1y = last.handleOut ? last.y + last.handleOut.y : last.y;
                const cp2x = first.handleIn ? first.x + first.handleIn.x : first.x;
                const cp2y = first.handleIn ? first.y + first.handleIn.y : first.y;
                d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
            }
            d += ' Z';
        }

        VectorUtils.lastPathData = d;
        return d;
    }

    /**
     * Basic SVG path parser to structured VectorPath
     * (Supports basic M, L, C for now)
     */
    static parsePath(d: string): VectorPath {
        const points: VectorPoint[] = [];
        const commands = d.match(/([MLCQZmlcqz])[^MLCQZmlcqz]*/g) || [];

        let currentX = 0;
        let currentY = 0;

        commands.forEach((cmdStr) => {
            const type = cmdStr[0];
            const args = (cmdStr.substring(1).trim().split(/[\s,]+/).map(Number) || []).filter(n => !isNaN(n));

            switch (type.toUpperCase()) {
                case 'M':
                    currentX = args[0];
                    currentY = args[1];
                    points.push(this.createPoint(currentX, currentY));
                    break;
                case 'L':
                    currentX = args[0];
                    currentY = args[1];
                    points.push(this.createPoint(currentX, currentY));
                    break;
                case 'C':
                    // args: cp1x cp1y cp2x cp2y x y
                    if (points.length > 0) {
                        const prev = points[points.length - 1];
                        prev.handleOut = { x: args[0] - prev.x, y: args[1] - prev.y };

                        currentX = args[4];
                        currentY = args[5];
                        const next = this.createPoint(currentX, currentY);
                        next.handleIn = { x: args[2] - currentX, y: args[3] - currentY };
                        points.push(next);
                    }
                    break;
                // QC etc could be added
            }
        });

        return {
            points,
            isClosed: d.toUpperCase().includes('Z')
        };
    }

    static createPoint(x: number, y: number, type: PointType = 'sharp'): VectorPoint {
        return {
            id: uuidv4(),
            x,
            y,
            type
        };
    }

    /**
     * Helper to update symmetric/smooth handles
     */
    static alignHandles(point: VectorPoint, movedHandle: 'in' | 'out'): VectorPoint {
        if (point.type === 'sharp' || !point.handleIn || !point.handleOut) return point;

        const source = movedHandle === 'in' ? point.handleIn : point.handleOut;
        const target = movedHandle === 'in' ? 'handleOut' : 'handleIn';

        const angle = Math.atan2(source.y, source.x);
        const dist = Math.sqrt(point[target]!.x ** 2 + point[target]!.y ** 2);

        if (point.type === 'symmetric') {
            const sourceDist = Math.sqrt(source.x ** 2 + source.y ** 2);
            point[target] = {
                x: -source.x,
                y: -source.y
            };
        } else if (point.type === 'smooth') {
            point[target] = {
                x: -Math.cos(angle) * dist,
                y: -Math.sin(angle) * dist
            };
        }

        return point;
    }

    /**
     * Calculates the bounding box of a VectorPath
     */
    static getBounds(path: VectorPath): { x: number, y: number, width: number, height: number } {
        if (path.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        path.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);

            if (p.handleIn) {
                minX = Math.min(minX, p.x + p.handleIn.x);
                minY = Math.min(minY, p.y + p.handleIn.y);
                maxX = Math.max(maxX, p.x + p.handleIn.x);
                maxY = Math.max(maxY, p.y + p.handleIn.y);
            }
            if (p.handleOut) {
                minX = Math.min(minX, p.x + p.handleOut.x);
                minY = Math.min(minY, p.y + p.handleOut.y);
                maxX = Math.max(maxX, p.x + p.handleOut.x);
                maxY = Math.max(maxY, p.y + p.handleOut.y);
            }
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Applies corner rounding to a VectorPath by inserting arc segments
     */
    static applyCornerRounding(path: VectorPath, globalRadius: number): VectorPath {
        if (path.points.length < 2 || globalRadius <= 0) return path;

        const newPoints: VectorPoint[] = [];
        const n = path.points.length;

        for (let i = 0; i < n; i++) {
            const curr = path.points[i];
            const prev = path.points[(i - 1 + n) % n];
            const next = path.points[(i + 1) % n];

            // If it's a curve point or has handles, we don't round it automatically for now
            if (curr.handleIn || curr.handleOut) {
                newPoints.push(curr);
                continue;
            }

            const radius = curr.cornerRadius !== undefined ? curr.cornerRadius : globalRadius;
            if (radius <= 0) {
                newPoints.push(curr);
                continue;
            }

            // Vector math for corner rounding
            const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
            const v2 = { x: next.x - curr.x, y: next.y - curr.y };
            const d1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const d2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

            const n1 = { x: v1.x / d1, y: v1.y / d1 };
            const n2 = { x: v2.x / d2, y: v2.y / d2 };

            const angle = Math.acos(n1.x * n2.x + n1.y * n2.y);
            const maxRadius = Math.min(d1, d2) / 2;
            const r = Math.min(radius, maxRadius);

            const offset = r / Math.tan(angle / 2);

            const p1 = { x: curr.x + n1.x * offset, y: curr.y + n1.y * offset };
            const p2 = { x: curr.x + n2.x * offset, y: curr.y + n2.y * offset };

            // Create two points with handles to form the arc
            const pt1 = this.createPoint(p1.x, p1.y, 'smooth');
            const pt2 = this.createPoint(p2.x, p2.y, 'smooth');

            // Set handles to approx a circle arc (0.5519 is kappa for 90deg, 
            // but for any angle it's more complex. Using a simple fraction for now.)
            const cpLen = r * 0.55228;
            pt1.handleOut = { x: -n1.x * cpLen, y: -n1.y * cpLen };
            pt2.handleIn = { x: -n2.x * cpLen, y: -n2.y * cpLen };

            newPoints.push(pt1, pt2);
        }

        return {
            points: newPoints,
            isClosed: path.isClosed
        };
    }


    /**
     * Tries to insert a point onto the path if it's close enough involved segment
     */
    static insertPointToPath(path: VectorPath, x: number, y: number, threshold: number = 10): VectorPath | null {
        if (path.points.length < 2) return null;

        let bestDist = Infinity;
        let bestSegmentIndex = -1;
        let bestT = 0;
        const target = { x, y };

        // Check each segment
        for (let i = 1; i < path.points.length; i++) {
            const p0 = path.points[i - 1];
            const p3 = path.points[i];

            // Setup control points for cubic
            // IF it's a line, handles are practically same as points
            const p1 = p0.handleOut
                ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } as VectorPoint
                : p0;
            const p2 = p3.handleIn
                ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } as VectorPoint
                : p3;

            const { t, dist } = BezierMath.getClosestT(p0, p1, p2, p3, target);

            if (dist < bestDist) {
                bestDist = dist;
                bestSegmentIndex = i;
                bestT = t;
            }
        }

        // Check closing segment if closed
        if (path.isClosed) {
            const p0 = path.points[path.points.length - 1];
            const p3 = path.points[0];
            const p1 = p0.handleOut
                ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } as VectorPoint
                : p0;
            const p2 = p3.handleIn
                ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } as VectorPoint
                : p3;

            const { t, dist } = BezierMath.getClosestT(p0, p1, p2, p3, target);
            if (dist < bestDist) {
                bestDist = dist;
                bestSegmentIndex = path.points.length; // Indicates closing segment
                bestT = t;
            }
        }

        if (bestDist > threshold) return null;

        // Perform insertion
        const newPoints = [...path.points];

        let pStartIdx = bestSegmentIndex === path.points.length ? path.points.length - 1 : bestSegmentIndex - 1;
        let pEndIdx = bestSegmentIndex === path.points.length ? 0 : bestSegmentIndex;

        const p0 = newPoints[pStartIdx];
        const p3 = newPoints[pEndIdx];

        // If it's effectively a line (no handles), linear interpolation is simpler
        // But we treat everything as cubic for consistency
        const p1 = p0.handleOut ? { x: p0.x + p0.handleOut.x, y: p0.y + p0.handleOut.y } : p0;
        const p2 = p3.handleIn ? { x: p3.x + p3.handleIn.x, y: p3.y + p3.handleIn.y } : p3;

        // Split
        // Cast geometry points to VectorPoints where needed or just extract values
        const { left, right } = BezierMath.splitCubic(p0, p1 as any, p2 as any, p3, bestT);

        // Created inserted point
        // left[3] is the split point (same as right[0])
        // left[1] is new handleOut for p0
        // left[2] is handleIn for new point
        // right[1] is handleOut for new point
        // right[2] is new handleIn for p3

        const splitPoint = left[3];

        const newPoint: VectorPoint = this.createPoint(splitPoint.x, splitPoint.y, 'smooth'); // Default to smooth

        // Handles are relative
        newPoint.handleIn = { x: left[2].x - splitPoint.x, y: left[2].y - splitPoint.y };
        newPoint.handleOut = { x: right[1].x - splitPoint.x, y: right[1].y - splitPoint.y };

        // Update previous point's handleOut
        const newPrevHandleOut = { x: left[1].x - p0.x, y: left[1].y - p0.y };

        // Update next point's handleIn
        const newNextHandleIn = { x: right[2].x - p3.x, y: right[2].y - p3.y };

        // Apply updates
        // We need to be careful not to mutate the original objects in the array reference if we want pure update
        // But here we are building a new array 'newPoints'

        const updatedP0 = { ...p0, handleOut: newPrevHandleOut };
        const updatedP3 = { ...p3, handleIn: newNextHandleIn };

        // If insert index is normal
        if (bestSegmentIndex !== path.points.length) {
            newPoints[pStartIdx] = updatedP0;
            newPoints[pEndIdx] = updatedP3;
            newPoints.splice(bestSegmentIndex, 0, newPoint);
        } else {
            // Closing segment: pStart is last, pEnd is first
            newPoints[pStartIdx] = updatedP0;
            newPoints[0] = updatedP3;
            newPoints.push(newPoint); // Insert at end (before implied close)
        }

        return {
            ...path,
            points: newPoints
        };
    }
}
