import paper from 'paper/dist/paper-core';
import { VectorPath, VectorPoint } from '../types';
import { VectorUtils } from '../utils/vectorUtils';
import { log } from '../utils/log';

let paperInitialized = false;

function initPaper() {
  if (!paperInitialized) {
    paper.setup(new paper.Size(1, 1));
    paperInitialized = true;
  }
}

export function pathToPaperPath(path: VectorPath): paper.Path {
  initPaper();
  const paperPath = new paper.Path();

  path.points.forEach((point, i) => {
    if (i === 0 || point.isMove) {
      paperPath.moveTo(new paper.Point(point.x, point.y));
    } else {
      const prev = path.points[i - 1];
      if (prev && (prev.handleOut || point.handleIn)) {
        const cp1 = prev.handleOut
          ? new paper.Point(prev.x + prev.handleOut.x, prev.y + prev.handleOut.y)
          : new paper.Point(prev.x, prev.y);
        const cp2 = point.handleIn
          ? new paper.Point(point.x + point.handleIn.x, point.y + point.handleIn.y)
          : new paper.Point(point.x, point.y);
        paperPath.cubicCurveTo(cp1, cp2, new paper.Point(point.x, point.y));
      } else {
        paperPath.lineTo(new paper.Point(point.x, point.y));
      }
    }
  });

  if (path.isClosed) {
    paperPath.closed = true;
  }

  return paperPath;
}

export function paperPathToVectorPath(paperPath: paper.Path | paper.CompoundPath | any): VectorPath {
  if (!paperPath) {
    return { points: [], isClosed: false };
  }

  const segments: any[] = [];
  if (Array.isArray(paperPath.segments)) {
    segments.push(...paperPath.segments);
  } else if (Array.isArray(paperPath.children)) {
    paperPath.children.forEach((child: any, childIdx: number) => {
      if (Array.isArray(child.segments)) {
        child.segments.forEach((seg: any, segIdx: number) => {
          if (segIdx === 0 && childIdx > 0) {
            seg._isMove = true;
          }
          segments.push(seg);
        });
      }
    });
  }

  const points: VectorPoint[] = segments.map((segment) => {
    const pt = VectorUtils.createPoint(segment.point.x, segment.point.y);
    if (segment._isMove) {
      pt.isMove = true;
    }
    if (segment.handleIn && (segment.handleIn.x !== 0 || segment.handleIn.y !== 0)) {
      pt.handleIn = { x: segment.handleIn.x, y: segment.handleIn.y };
    }
    if (segment.handleOut && (segment.handleOut.x !== 0 || segment.handleOut.y !== 0)) {
      pt.handleOut = { x: segment.handleOut.x, y: segment.handleOut.y };
    }
    return pt;
  });

  return {
    points,
    isClosed: paperPath.closed ?? true,
  };
}

/**
 * Boolean union: combine two paths into one
 */
export function union(path1: VectorPath, path2: VectorPath): VectorPath {
  try {
    initPaper();
    const paperPath1 = pathToPaperPath(path1);
    const paperPath2 = pathToPaperPath(path2);

    const result = paperPath1.unite(paperPath2) as paper.Path;

    paperPath1.remove();
    paperPath2.remove();

    return paperPathToVectorPath(result);
  } catch (error) {
    log.error('Boolean union failed', error);
    return path1;
  }
}

/**
 * Boolean subtract: cut path2 from path1
 */
export function subtract(path1: VectorPath, path2: VectorPath): VectorPath {
  try {
    initPaper();
    const paperPath1 = pathToPaperPath(path1);
    const paperPath2 = pathToPaperPath(path2);

    const result = paperPath1.subtract(paperPath2) as paper.Path;

    paperPath1.remove();
    paperPath2.remove();

    return paperPathToVectorPath(result);
  } catch (error) {
    log.error('Boolean subtract failed', error);
    return path1;
  }
}

/**
 * Boolean intersect: keep only overlapping area
 */
export function intersect(path1: VectorPath, path2: VectorPath): VectorPath {
  try {
    initPaper();
    const paperPath1 = pathToPaperPath(path1);
    const paperPath2 = pathToPaperPath(path2);

    const result = paperPath1.intersect(paperPath2) as paper.Path;

    paperPath1.remove();
    paperPath2.remove();

    return paperPathToVectorPath(result);
  } catch (error) {
    log.error('Boolean intersect failed', error);
    return path1;
  }
}

/**
 * Boolean exclude: remove overlapping area (XOR)
 */
export function exclude(path1: VectorPath, path2: VectorPath): VectorPath {
  try {
    initPaper();
    const paperPath1 = pathToPaperPath(path1);
    const paperPath2 = pathToPaperPath(path2);

    const result = paperPath1.exclude(paperPath2) as paper.Path;

    paperPath1.remove();
    paperPath2.remove();

    return paperPathToVectorPath(result);
  } catch (error) {
    log.error('Boolean exclude failed', error);
    return path1;
  }
}
