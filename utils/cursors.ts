export type CursorState = {
  isPanning: boolean;
  isSpacePressed: boolean;
  isDrawing: boolean;
  brushType?: string;
  brushSize?: number;
  zoom?: number;
  isTextMode?: boolean;
  isShapeMode?: boolean;
};

function createSvgCursor(svgContent: string, hotspotX: number = 12, hotspotY: number = 12): string {
  const b64 = btoa(svgContent);
  return `url("data:image/svg+xml;base64,${b64}") ${hotspotX} ${hotspotY}, auto`;
}

// Custom Signature Cursors
const PEN_CURSOR = createSvgCursor(`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L20 8L8 20H4V16L16 4Z" fill="white" stroke="#7c3aed" stroke-width="2" stroke-linejoin="round"/>
</svg>
`, 4, 20);

const SHAPE_CURSOR = createSvgCursor(`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#7c3aed" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="#7c3aed"/>
</svg>
`, 12, 12);

const TEXT_CURSOR = createSvgCursor(`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4V20M8 4H16M10 20H14" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`, 12, 12);

export function getEraserCursor(brushSize: number, zoom: number): string {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const size = Math.max(4, brushSize * zoom * dpr);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='rgba(255,255,255,0.5)' stroke='#7c3aed' stroke-width='1.5'/>
    <circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}' fill='none' stroke='#fff' stroke-width='0.5' stroke-dasharray='2,2'/>
  </svg>`;
  return createSvgCursor(svg, Math.round(size / 2), Math.round(size / 2));
}

export function getCanvasCursor(state: CursorState): string {
  if (state.isPanning) {
    return 'grabbing';
  }
  if (state.isSpacePressed) {
    return 'grab';
  }
  if (state.isDrawing) {
    if (state.brushType === 'eraser') {
      return getEraserCursor(state.brushSize || 10, state.zoom || 1);
    }
    return PEN_CURSOR;
  }
  if (state.isTextMode) {
    return TEXT_CURSOR;
  }
  if (state.isShapeMode) {
    return SHAPE_CURSOR;
  }
  return 'default';
}
