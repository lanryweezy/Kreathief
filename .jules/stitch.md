## 2025-01-24 - Completing Node Interactive Inputs and Settings Propagation

**Learning:** When developing complex client-side canvas systems such as Node Graphs, UI input elements rendered inside draggable node containers must explicitly stop event propagation (`onMouseDown`, `onPointerDown`, `onWheel`, etc.) to prevent dragging/selection systems from intercepting interactions. Furthermore, when syncing node state with a centralized store (like Zustand), the update function signature (e.g., passing `(id, settingsObject)` vs `(id, key, value)`) must be thoroughly verified across the consumer and the store to prevent silent state synchronization failures.

**Action:** Always wrap input interactions, range sliders, custom dropdowns, color pickers, and text fields within node components in `stopPropagation` handlers to isolate node drag events. Always check store action definitions in the hook/store implementation rather than assuming the prop types matching the target element handlers.
