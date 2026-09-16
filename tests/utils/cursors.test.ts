import { describe, it, expect } from 'vitest';
import { getCanvasCursor, getEraserCursor } from '../../utils/cursors';

describe('Custom Signature Cursors', () => {
  it('returns "grabbing" when isPanning is true', () => {
    expect(
      getCanvasCursor({
        isPanning: true,
        isSpacePressed: false,
        isDrawing: false,
      })
    ).toBe('grabbing');
  });

  it('returns "grab" when isSpacePressed is true and not panning', () => {
    expect(
      getCanvasCursor({
        isPanning: false,
        isSpacePressed: true,
        isDrawing: false,
      })
    ).toBe('grab');
  });

  it('returns custom SVG pen cursor when drawing with non-eraser brush', () => {
    const cursor = getCanvasCursor({
      isPanning: false,
      isSpacePressed: false,
      isDrawing: true,
      brushType: 'pencil',
    });
    expect(cursor).toContain('data:image/svg+xml;base64');
  });

  it('returns dynamic circular eraser cursor when brushType is eraser', () => {
    const cursor = getCanvasCursor({
      isPanning: false,
      isSpacePressed: false,
      isDrawing: true,
      brushType: 'eraser',
      brushSize: 20,
      zoom: 1,
    });
    expect(cursor).toContain('data:image/svg+xml;base64');
  });

  it('returns text cursor in text mode', () => {
    const cursor = getCanvasCursor({
      isPanning: false,
      isSpacePressed: false,
      isDrawing: false,
      isTextMode: true,
    });
    expect(cursor).toContain('data:image/svg+xml;base64');
  });

  it('returns shape cursor in shape mode', () => {
    const cursor = getCanvasCursor({
      isPanning: false,
      isSpacePressed: false,
      isDrawing: false,
      isShapeMode: true,
    });
    expect(cursor).toContain('data:image/svg+xml;base64');
  });

  it('returns default when idle', () => {
    expect(
      getCanvasCursor({
        isPanning: false,
        isSpacePressed: false,
        isDrawing: false,
      })
    ).toBe('default');
  });
});
