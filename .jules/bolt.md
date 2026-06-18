## 2026-05-28 - Stable props for React.memo in CanvasRenderer

**Learning:** In highly complex components like `CanvasRenderer.tsx`, anonymous inline functions (e.g., `getEffectiveLayer={(l) => l}`) and re-created callbacks pass new reference identities on every render, which defeats `React.memo` and causes expensive unnecessary re-renders of the canvas.
**Action:** Always extract stable logic (like identity functions) outside the component and ensure `useCallback` hooks are correctly memoized before passing them to heavy child components.

## 2026-05-29 - Stable array and function props for React.memo

**Learning:** In complex components like `CanvasRenderer.tsx`, passing inline literals like `[]` or fallback inline functions `(() => {})` defeats `React.memo` by generating a new reference on every parent render.
**Action:** Always extract stable literals (e.g., `const emptyArray = []`) and fallback functions (e.g., `const noop = () => {}`) outside the React component scope before passing them down.

## 2026-05-30 - Memoizing event handlers in Canvas layers

**Learning:** Even if a component uses `React.memo`, passing inline event handlers (like `onClick={() => setActiveArtboardId(id)}` or `onZoomChangeValue={() => {}}`) creates a new function reference every render. This completely defeats the memoization of heavy child components like `CanvasRenderer` and `useCanvasInteractions`, leading to major performance degradation during simple state updates (like mouse moves).
**Action:** Extract all inline event handlers into `useCallback` hooks or use stable references like a constant `noop` function instead of `() => {}`.

## 2026-06-15 - Memoizing store methods passed to useCanvasInteractions

**Learning:** Inline arrow functions wrapping global store state actions (e.g., `onSelectLayer={(id) => useStore.getState().selectLayer(id)}`) cause custom hooks or memoized child components to lose their cached states, as the dependency arrays see a new function reference every render. This forces deep re-renders on every trivial interaction.
**Action:** Extract all store action calls into stable `useCallback` hooks (e.g., `const handleSelectLayer = useCallback((id) => useStore.getState().selectLayer(id), []);`) when passing them as dependencies to hooks or React.memo components.

## 2026-06-18 - Applying useShallow to Zustand store selectors

**Learning:** Selecting multiple properties from a Zustand store by returning an object (e.g., `const { a, b } = useStore(state => ({ a: state.a, b: state.b }))`) without `useShallow` creates a new object reference on every state change, causing the component to re-render even if `a` and `b` haven't changed.
**Action:** Always wrap object-returning Zustand selectors with `useShallow` from `zustand/react/shallow` to ensure components only re-render when the specific selected properties actually change.
