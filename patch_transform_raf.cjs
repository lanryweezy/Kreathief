const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/hooks/canvas/useLayerTransformation.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add transformRafIdRef declaration
content = content.replace(
  'const transformPreviewRef = useRef<Record<string, Partial<Layer>>>({});',
  `const transformPreviewRef = useRef<Record<string, Partial<Layer>>>({});\n  const transformRafIdRef = useRef<number | null>(null);`
);

// 2. Add unmount cleanup
content = content.replace(
  'const panOffsetRef = useRef(panOffset);',
  `const panOffsetRef = useRef(panOffset);

  useEffect(() => {
    return () => {
      if (transformRafIdRef.current !== null) {
        cancelAnimationFrame(transformRafIdRef.current);
      }
    };
  }, []);`
);

// 3. Throttle onPreviewLayers with RAF in updateTransformation
content = content.replace(
  `transformPreviewRef.current = updates;
      onPreviewLayers(updates);`,
  `transformPreviewRef.current = updates;
      if (transformRafIdRef.current === null) {
        transformRafIdRef.current = requestAnimationFrame(() => {
          onPreviewLayers(transformPreviewRef.current);
          transformRafIdRef.current = null;
        });
      }`
);

// 4. Cancel pending RAF in finalizeTransformation
content = content.replace(
  `const finalizeTransformation = useCallback(() => {
    if (Object.keys(transformPreviewRef.current).length > 0) {`,
  `const finalizeTransformation = useCallback(() => {
    if (transformRafIdRef.current !== null) {
      cancelAnimationFrame(transformRafIdRef.current);
      transformRafIdRef.current = null;
    }
    if (Object.keys(transformPreviewRef.current).length > 0) {`
);

fs.writeFileSync(file, content);
console.log('Patched useLayerTransformation with RAF throttling');
