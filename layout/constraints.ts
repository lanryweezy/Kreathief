import { Layer } from '../types';

export type HorizontalConstraint = 'start' | 'end' | 'center' | 'scale' | 'both';
export type VerticalConstraint = 'start' | 'end' | 'center' | 'scale' | 'both';

export interface LayerConstraints {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
}

export interface RectDimensions {
  width: number;
  height: number;
}

/**
 * Calculates new position and size of a child layer when its parent dimensions change,
 * according to Figma-style constraints.
 */
export function resolveChildConstraints(
  child: Layer,
  parentPrev: RectDimensions,
  parentNext: RectDimensions
): { x: number; y: number; width: number; height: number } {
  const constraints = child.constraints || { horizontal: 'start', vertical: 'start' };
  const h = constraints.horizontal || 'start';
  const v = constraints.vertical || 'start';

  const prevW = Math.max(1, parentPrev.width);
  const prevH = Math.max(1, parentPrev.height);
  const nextW = Math.max(1, parentNext.width);
  const nextH = Math.max(1, parentNext.height);

  let newX = child.x;
  let newWidth = child.width;

  // Horizontal resolution
  switch (h) {
    case 'start': // Left
      newX = child.x;
      newWidth = child.width;
      break;

    case 'end': { // Right
      const rightMargin = prevW - (child.x + child.width);
      newX = nextW - rightMargin - child.width;
      newWidth = child.width;
      break;
    }

    case 'center': { // Center
      const childCenterX = child.x + child.width / 2;
      const prevCenterX = prevW / 2;
      const offsetFromCenter = childCenterX - prevCenterX;
      const nextCenterX = nextW / 2;
      newX = nextCenterX + offsetFromCenter - child.width / 2;
      newWidth = child.width;
      break;
    }

    case 'scale': { // Scale
      const scaleFactorX = nextW / prevW;
      newX = child.x * scaleFactorX;
      newWidth = Math.max(1, child.width * scaleFactorX);
      break;
    }

    case 'both': { // Left & Right (Stretch)
      const leftMargin = child.x;
      const rightMargin = prevW - (child.x + child.width);
      newX = leftMargin;
      newWidth = Math.max(1, nextW - leftMargin - rightMargin);
      break;
    }
  }

  let newY = child.y;
  let newHeight = child.height;

  // Vertical resolution
  switch (v) {
    case 'start': // Top
      newY = child.y;
      newHeight = child.height;
      break;

    case 'end': { // Bottom
      const bottomMargin = prevH - (child.y + child.height);
      newY = nextH - bottomMargin - child.height;
      newHeight = child.height;
      break;
    }

    case 'center': { // Center
      const childCenterY = child.y + child.height / 2;
      const prevCenterY = prevH / 2;
      const offsetFromCenterY = childCenterY - prevCenterY;
      const nextCenterY = nextH / 2;
      newY = nextCenterY + offsetFromCenterY - child.height / 2;
      newHeight = child.height;
      break;
    }

    case 'scale': { // Scale
      const scaleFactorY = nextH / prevH;
      newY = child.y * scaleFactorY;
      newHeight = Math.max(1, child.height * scaleFactorY);
      break;
    }

    case 'both': { // Top & Bottom (Stretch)
      const topMargin = child.y;
      const bottomMargin = prevH - (child.y + child.height);
      newY = topMargin;
      newHeight = Math.max(1, nextH - topMargin - bottomMargin);
      break;
    }
  }

  return {
    x: Math.round(newX * 100) / 100,
    y: Math.round(newY * 100) / 100,
    width: Math.round(newWidth * 100) / 100,
    height: Math.round(newHeight * 100) / 100,
  };
}

/**
 * Applies constraints to a list of children when parent dimensions change.
 */
export function applyConstraints(
  parentPrev: RectDimensions,
  parentNext: RectDimensions,
  children: Layer[]
): Layer[] {
  if (parentPrev.width === parentNext.width && parentPrev.height === parentNext.height) {
    return children;
  }

  return children.map((child) => {
    const updatedBounds = resolveChildConstraints(child, parentPrev, parentNext);
    return {
      ...child,
      ...updatedBounds,
    };
  });
}

/**
 * Automatically infers natural constraints for a child based on its current position
 * relative to the parent bounding box.
 */
export function inferConstraints(
  child: { x: number; y: number; width: number; height: number },
  parent: RectDimensions
): LayerConstraints {
  const leftMargin = child.x;
  const rightMargin = parent.width - (child.x + child.width);
  const tolerance = Math.min(parent.width * 0.1, 24);

  let horizontal: HorizontalConstraint = 'start';
  if (Math.abs(leftMargin - rightMargin) <= tolerance && child.width > parent.width * 0.7) {
    horizontal = 'both';
  } else if (Math.abs(leftMargin - rightMargin) <= tolerance) {
    horizontal = 'center';
  } else if (rightMargin < leftMargin && rightMargin <= tolerance * 2) {
    horizontal = 'end';
  } else {
    horizontal = 'start';
  }

  const topMargin = child.y;
  const bottomMargin = parent.height - (child.y + child.height);
  const vTolerance = Math.min(parent.height * 0.1, 24);

  let vertical: VerticalConstraint = 'start';
  if (Math.abs(topMargin - bottomMargin) <= vTolerance && child.height > parent.height * 0.7) {
    vertical = 'both';
  } else if (Math.abs(topMargin - bottomMargin) <= vTolerance) {
    vertical = 'center';
  } else if (bottomMargin < topMargin && bottomMargin <= vTolerance * 2) {
    vertical = 'end';
  } else {
    vertical = 'start';
  }

  return { horizontal, vertical };
}
