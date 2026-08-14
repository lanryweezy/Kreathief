## 2025-01-24 - Completing Node Interactive Inputs and Settings Propagation

**Learning:** When developing complex client-side canvas systems such as Node Graphs, UI input elements rendered inside draggable node containers must explicitly stop event propagation (`onMouseDown`, `onPointerDown`, `onWheel`, etc.) to prevent dragging/selection systems from intercepting interactions. Furthermore, when syncing node state with a centralized store (like Zustand), the update function signature (e.g., passing `(id, settingsObject)` vs `(id, key, value)`) must be thoroughly verified across the consumer and the store to prevent silent state synchronization failures.

**Action:** Always wrap input interactions, range sliders, custom dropdowns, color pickers, and text fields within node components in `stopPropagation` handlers to isolate node drag events. Always check store action definitions in the hook/store implementation rather than assuming the prop types matching the target element handlers.

## 2026-08-14 - Completing Internal Zustand Slice Properties

**Learning:** Internal store tracking variables meant for batching or sync logic (like `__batchDepth` and `__hasPendingBatchChange`) are often initialized in the main store aggregator (e.g., `useStore.ts`) but forgotten in the specific slice's TypeScript interface. The codebase convention uses `@ts-expect-error TODO: fix type - internal slice property` instead of addressing the type error directly.

**Action:** When searching for completeness tasks, search for `@ts-expect-error TODO:` comments in the store/state management files. Fixing them usually involves simply declaring the exact initialized variable and its type in the corresponding slice's interface.
