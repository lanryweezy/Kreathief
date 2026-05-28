## 2026-05-28 - Stable props for React.memo in CanvasRenderer
**Learning:** In highly complex components like `CanvasRenderer.tsx`, anonymous inline functions (e.g., `getEffectiveLayer={(l) => l}`) and re-created callbacks pass new reference identities on every render, which defeats `React.memo` and causes expensive unnecessary re-renders of the canvas.
**Action:** Always extract stable logic (like identity functions) outside the component and ensure `useCallback` hooks are correctly memoized before passing them to heavy child components.
