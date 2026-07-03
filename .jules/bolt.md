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

## 2026-06-18 - Memoizing overlay components

**Learning:** Overlay components on the Canvas like `CanvasControls`, `CanvasGuides`, `SelectionMarquee`, `PathEditorOverlay`, and `BrushFilters` are often subjected to rapid re-renders if their parent re-renders. Without `React.memo`, these components cause unnecessary performance degradation, especially during rapid state updates like mouse movement.
**Action:** Ensure all heavy overlay and visualization components that depend on parent state are wrapped in `React.memo` to prevent unnecessary updates.

## 2026-06-23 - Applying useShallow to multiple store properties destructuring

**Learning:** Destructuring multiple properties from Zustand's `useStore()` without a shallow equality check creates a new object on every state update. This defeats any memoization and triggers a re-render of the component even if none of the destructured values changed.
**Action:** When a component extracts multiple values from `useStore()` by returning an object, always wrap the selector function in `useShallow` from `zustand/react/shallow`. This ensures the component only re-renders when one of the specifically selected properties has been updated.
## 2026-06-28 - Unnecessary full-store subscriptions via direct destructuring
**Learning:** Destructuring directly from  without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the *entire* global store. This causes the component to re-render whenever *any* state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from  without a selector. Always use an explicit selector and wrap it with  when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.

## 2026-06-28 - Unnecessary full-store subscriptions via direct destructuring

**Learning:** Destructuring directly from `useStore()` without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the *entire* global store. This causes the component to re-render whenever *any* state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from `useStore()` without a selector. Always use an explicit selector and wrap it with `useShallow` when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.

## 2026-07-02 - Unnecessary full-store subscriptions via direct destructuring in panel components
**Learning:** Destructuring directly from `useStore()` without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the *entire* global store. This causes the component to re-render whenever *any* state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from `useStore()` without a selector. Always use an explicit selector and wrap it with `useShallow` when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.
## 2026-07-03 - Zustand useShallow Optimization
**Learning:** Found several components (`CommunityTemplates`, `VersionHistoryTimeline`, `FeedbackModal`, `ShapeTools`) in this specific codebase subscribing to the entire Zustand store without a selector (e.g., `const { a, b } = useStore();`) or returning objects from selectors without `useShallow` (e.g. `useStore((state) => ({a: state.a}))`). This anti-pattern breaks referential equality and forces components to re-render on *every* store update (like mouse movements or other layer updates).
**Action:** Always use an explicit selector wrapped in `useShallow` from `zustand/react/shallow` when extracting multiple properties from the store to prevent catastrophic re-rendering loops.
