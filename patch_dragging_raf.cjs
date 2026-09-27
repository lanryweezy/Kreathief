const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/hooks/canvas/useLayerDragging.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add dragRafIdRef declaration after bulkDragPreviewRef
content = content.replace(
  'const bulkDragPreviewRef = useRef<Record<string, Partial<Layer>>>({});',
  `const bulkDragPreviewRef = useRef<Record<string, Partial<Layer>>>({});\n  const dragRafIdRef = useRef<number | null>(null);`
);

// 2. Add unmount cleanup
content = content.replace(
  'useEffect(() => {\n    initEngine();\n  }, []);',
  `useEffect(() => {
    initEngine();
    return () => {
      if (dragRafIdRef.current !== null) {
        cancelAnimationFrame(dragRafIdRef.current);
      }
    };
  }, []);`
);

// 3. Throttle onPreviewLayers with requestAnimationFrame in updateDragging
content = content.replace(
  `bulkDragPreviewRef.current = { ...buffer };
        onPreviewLayers(bulkDragPreviewRef.current);`,
  `bulkDragPreviewRef.current = { ...buffer };
        if (dragRafIdRef.current === null) {
          dragRafIdRef.current = requestAnimationFrame(() => {
            onPreviewLayers(bulkDragPreviewRef.current);
            dragRafIdRef.current = null;
          });
        }`
);

// 4. Cancel pending RAF in finalizeDragging
content = content.replace(
  `const finalizeDragging = useCallback(() => {
    if (Object.keys(bulkDragPreviewRef.current).length > 0) {`,
  `const finalizeDragging = useCallback(() => {
    if (dragRafIdRef.current !== null) {
      cancelAnimationFrame(dragRafIdRef.current);
      dragRafIdRef.current = null;
    }
    if (Object.keys(bulkDragPreviewRef.current).length > 0) {`
);

fs.writeFileSync(file, content);
console.log('Patched useLayerDragging with RAF throttling');
