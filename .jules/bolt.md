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

**Learning:** Destructuring directly from without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the _entire_ global store. This causes the component to re-render whenever _any_ state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from without a selector. Always use an explicit selector and wrap it with when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.

## 2026-06-28 - Unnecessary full-store subscriptions via direct destructuring

**Learning:** Destructuring directly from `useStore()` without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the _entire_ global store. This causes the component to re-render whenever _any_ state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from `useStore()` without a selector. Always use an explicit selector and wrap it with `useShallow` when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.

## 2026-07-02 - Unnecessary full-store subscriptions via direct destructuring in panel components

**Learning:** Destructuring directly from `useStore()` without providing a selector (e.g., `const { a, b } = useStore()` or `const { isActive } = useStore()`) subscribes the calling component to the _entire_ global store. This causes the component to re-render whenever _any_ state in the store changes, even if the destructured values are completely unrelated. In frequently re-rendered components like canvas overlays, this creates a massive performance bottleneck.
**Action:** Never use direct destructuring from `useStore()` without a selector. Always use an explicit selector and wrap it with `useShallow` when returning multiple values to ensure the component only re-renders when the specific properties it depends on change.

## 2026-07-03 - Zustand useShallow Optimization

**Learning:** Found several components (`CommunityTemplates`, `VersionHistoryTimeline`, `FeedbackModal`, `ShapeTools`) in this specific codebase subscribing to the entire Zustand store without a selector (e.g., `const { a, b } = useStore();`) or returning objects from selectors without `useShallow` (e.g. `useStore((state) => ({a: state.a}))`). This anti-pattern breaks referential equality and forces components to re-render on _every_ store update (like mouse movements or other layer updates).
**Action:** Always use an explicit selector wrapped in `useShallow` from `zustand/react/shallow` when extracting multiple properties from the store to prevent catastrophic re-rendering loops.

## 2026-07-04 - Zustand Store Subscriptions in Overlay Components

**Learning:** Overlay components like FeedbackModal destructured the entire Zustand store without using a selector. This caused the component to re-render constantly on every minor canvas state update, hurting global app performance.
**Action:** Never use parameterless destructuring with `useStore()`. Always use explicit selectors wrapped in `useShallow` from `zustand/react/shallow` so the component only renders when its specific dependencies change.

## 2024-05-24 - Unnecessary Iterations for Logging in Render Cycle

**Learning:** Found an instance where an entire nested iteration loop over all layers in the scene was enclosed inside a `useMemo` specifically to execute a debug logging method (`bitmapCache.stats()`). This forced the application to trace every layer on virtually every prop update (since `artboards` reference frequently changed) without generating any usable output.
**Action:** Avoid placing debug logging loops that iterate through the whole component hierarchy inside standard render flows. In a performance-obsessed codebase, operations strictly meant for debug stats should either be placed behind developer tools toggles, debounced outside the main thread, or removed completely when unnecessary to avoid O(N) penalties during critical renders.

## 2026-07-16 - Zustand store selective destructuring with useShallow

**Learning:** When extracting multiple values from Zustand's `useStore` in React components, avoid parameterless destructuring (e.g., `const { a, b } = useStore();`) or returning objects without `useShallow` (e.g., `useStore(state => ({a: state.a}))`). This subscribes the component to the entire store or breaks referential equality, causing catastrophic re-renders on every store update (like simple mouse movements).
**Action:** Always use an explicit selector returning an object and wrap it with `useShallow` from `zustand/react/shallow` to preserve referential equality and prevent unnecessary component re-renders.

## 2026-07-18 - Zustand Store Subscriptions in Panel Components

**Learning:** Destructuring directly from `useStore()` without providing a selector (e.g., `const past = useStore((state) => state.past); const future = useStore((state) => state.future);`) in panels subscribes the calling component to the global store, triggering unnecessary re-renders when any state in the store changes. In frequently re-rendered components like `HistoryPanel`, this creates a performance bottleneck.
**Action:** When a component extracts multiple values from `useStore()`, use an explicit selector and wrap it with `useShallow` from `zustand/react/shallow` to ensure the component only re-renders when the specific properties it depends on change.

## 2026-07-20 - Missing useShallow with useStore pattern in Canvas components

**Learning:** In a codebase heavily relying on Zustand's useStore pattern, extracting multiple values from the store without using an explicit object selector wrapped in `useShallow` results in unnecessary component re-renders. This is particularly noticeable in complex React components with frequent state updates like a `<Canvas>` or `<MiniMap>` which can perform costly redraws on every unassociated state change (e.g. `hoveredId` changing, causing `<Canvas>` and `<MiniMap>` to unnecessarily re-render).
**Action:** When extracting multiple state values from a Zustand store, always use an explicit object selector and wrap it with `useShallow` to preserve referential equality and avoid wasteful renders.

## 2025-02-15 - Optimize Array Iterations in Bounds Calculation

**Learning:** Multiple array `.map()` passes and spread operations into `Math.min/max()` create unnecessary O(N) allocations and redundant loops, drastically reducing performance when calculating bounding boxes for many items.
**Action:** Replace chained `.map()` and spread calls with a single standard `for` loop to compute multiple min/max bounds in one pass, reducing memory allocations and speeding up execution time (by ~51% in group bounds calculations).

## 2026-07-25 - Optimizing Array Intersection for Selected Layers

**Learning:** When retrieving multiple entities from a large array by their IDs (e.g., matching a list of `selectedLayerIds` against an `artboard.layers` array), using `.map(id => layers.find(l => l.id === id))` creates an O(N\*M) nested loop. This significantly degrades performance, especially during operations involving many selected items (like grouping, bulk moving, or bulk deleting) as the component re-renders.
**Action:** Replace nested array searches with an O(N) Set-based filter (e.g., `const selectedIdsSet = new Set(selectedLayerIds); layers.filter(l => selectedIdsSet.has(l.id))`) to improve render performance and reduce CPU overhead when interacting with multiple items simultaneously.

## 2026-07-27 - Supabase Batched Deletions

**Learning:** When performing operations on multiple rows in Supabase based on an array of IDs, looping over the IDs and executing sequential queries (e.g., `for (const id of ids) await supabase...delete().eq('id', id)`) introduces severe N+1 network latency and excessive DB connections.
**Action:** Always batch database modifications by mapping the objects to an array of identifiers and executing a single query using the `.in()` operator (e.g., `await supabase...delete().in('id', ids)`), dramatically reducing request overhead.

## 2026-07-26 - Optimize Array Iterations in Bounds Calculation

**Learning:** Multiple array `.map()` passes and spread operations into `Math.min/max()` create unnecessary O(N) allocations and redundant loops, drastically reducing performance when calculating bounding boxes for many items.
**Action:** Replace chained `.map()` and spread calls with a single standard `for` loop to compute multiple min/max bounds in one pass, reducing memory allocations and speeding up execution time (by ~51% in group bounds calculations).

## 2026-07-29 - Optimize array lookups and map operations in layoutSlice

**Learning:** Using `.findIndex` inside a `.map` creates an O(N^2) operation, causing severe performance issues with large arrays. Additionally, using `Math.min(...array.map())` causes unnecessary memory allocations and can lead to maximum call stack exceeded errors.
**Action:** Use a pre-computed `Map` to turn O(N^2) lookups into O(N). Replace chained `.map` and spread operations with a single `for` loop.
<<<<<<< HEAD

## 2026-07-31 - Replace .findIndex() inside .map() loops and Math.min() calls

**Learning:** Using `layers.findIndex()` inside `selectedPaths.map()` followed by `Math.min(...)` to find the lowest selected index results in an O(N\*M) operation and can cause "Maximum call stack size exceeded" with very large selections.
**Action:** Always pre-compute a `Set` of the selected items' IDs, then use a single `layers.findIndex()` check against the `Set` to achieve O(N) complexity.

## 2026-08-04 - Cautious Use of Map lookups for Array Intersections

**Learning:** While replacing an O(N*M) nested array search (`layers.filter(l => selectedIds.includes(l.id))`) with an O(N) Map lookup (`const map = new Map(layers.map(l => [l.id, l])); selectedIds.map(id => map.get(id))`) is theoretically faster algorithmically, it introduces a massive de-optimization if the main array (N) is huge and the subset of selected IDs (M) is very small. In these cases, allocating the memory and iterating over the entire massive array to build the Map is significantly slower than just running the O(N*M) search.
**Action:** Before optimizing O(N\*M) lookups with Maps, consider the relative sizes of N and M. If M is guaranteed to be extremely small (e.g. user selected 2 items out of 10,000 layers), avoid creating an O(N) Map or Set. If N and M can both be large, only then proceed with the Map/Set optimization.

## 2026-07-31 - Zustand multiple useStore calls in complex components

**Learning:** When multiple top-level global state values are retrieved via separate independent `useStore((state) => state.prop)` calls in highly active container components like `<Editor>`, `<Header>`, and `useContextualPanels`, each call subscribes to the store independently. While Zustand handles this reasonably well, having 10-15 separate store subscriptions causes noticeable overhead and unnecessary fragmented re-evaluations during rapid state updates (e.g. mouse movements/collaboration).
**Action:** When extracting many individual scalar properties from a Zustand store, consolidate them into a single `useStore` call passing an explicit object selector, and always wrap it with `useShallow` from `zustand/react/shallow`. This reduces the number of store subscriptions and groups re-render evaluation efficiently.

## 2026-08-07 - Optimize Array Iterations in Bounds Calculation (Revisited)

**Learning:** Found multiple instances where the codebase computes bounding boxes for a set of items (like corners or projected 3D points) by using `.map` to create intermediate arrays and then passing them into `Math.min/max` with the spread operator (e.g., `Math.min(...corners.map(c => c.x))`). This is extremely inefficient. It iterates over the data 4 separate times and creates 4 temporary arrays, plus it risks `Maximum call stack size exceeded` errors if the array is large.
**Action:** Replace `Math.min(...arr.map(...))` chains with a single standard `for` loop that computes min/max values for `x` and `y` simultaneously. This completely eliminates intermediate allocations and reduces the computation to a single O(N) pass.

## 2026-08-08 - Concurrent DAG Execution in NodeGraph

**Learning:** The visual node workflow pipeline (`executeGraph` in `useNodeGraph.ts`) previously executed nodes sequentially using a `for` loop based on a topological sort. This meant independent nodes (e.g., two parallel image generation prompts) had to wait for each other, increasing overall execution time unnecessarily.
**Action:** Replaced the sequential loop with a Promise-based execution model where all nodes are started immediately but await their specific dependencies internally. This allows independent branches of the graph to execute concurrently, significantly speeding up complex AI workflows.

## 2026-08-09 - Spread Operator in Pen Bounding Box

**Learning:** Found an instance in `canvasEngine.ts` where the drawing engine computed bounds for `finishPen` by doing `Math.min(...this.penPoints.map((p) => p.x))`. For complex freehand vector paths containing thousands of points, this forces multiple intermediate O(N) array allocations and risks catastrophic `Maximum call stack size exceeded` errors due to spreading massive arrays into function arguments.
**Action:** Replace `Math.min(...arr.map(...))` chains on potentially unbound sets with a single standard `for` loop that computes min/max values for `x` and `y` simultaneously without creating intermediate allocations or blowing the call stack.

## 2026-08-12 - Optimize Array Intersection for Selected Layers in Grouping

**Learning:** In operations dealing with large datasets (like grouping/ungrouping layers), chaining array operations (`.map`, `.filter`) with nested `.includes()` lookups creates an O(N\*M) performance bottleneck, which causes unnecessary memory allocations and risks `Maximum call stack size exceeded` errors when spreading into `Math.min/Math.max`.
**Action:** Replaced these inefficient chained operations with a single O(N) iteration () while utilizing a for O(1) lookups to determine layer groupings, significantly optimizing rendering logic without modifying standard behavioral execution paths.

## 2026-08-12 - Optimize Array Intersection for Selected Layers in Grouping

**Learning:** In operations dealing with large datasets (like grouping/ungrouping layers), chaining array operations (`.map`, `.filter`) with nested `.includes()` lookups creates an O(N\*M) performance bottleneck, which causes unnecessary memory allocations and risks `Maximum call stack size exceeded` errors when spreading into `Math.min/Math.max`.
**Action:** Replaced these inefficient chained operations with a single O(N) iteration (`.forEach()`) while utilizing a `Set` for O(1) lookups to determine layer groupings, significantly optimizing rendering logic without modifying standard behavioral execution paths.

## 2026-08-13 - Single pass array iterations for frequent renders

**Learning:** Chained array methods like `.map(...).filter(...)` followed by spreading into a `new Map(...)` create multiple intermediate O(N) array allocations. In frequent render paths (like `useMemo` hooks in canvas renderers), this generates excessive garbage collection overhead and drops frames.
**Action:** Replace chained array methods with a single standard `for` loop to map, filter, and unique values simultaneously into a target collection, eliminating intermediate object creation.

## 2026-08-14 - Optimize array iterations for performance in grouping interactions

**Learning:** Found chained `.filter().map()` array operations used to find children elements recursively in `useLayerDragging.ts`. When this runs repeatedly (e.g., during mouse drag events at 60fps), these chained operations create many intermediate arrays that increase garbage collection overhead and cause frame drops.
**Action:** Replace chained `.filter().map()` operations with a single `for` loop to filter and transform the data simultaneously, eliminating intermediate O(N) array allocations.

## 2026-08-14 - Concurrent Image Loading in PSD Export

**Learning:** The `exportToLayeredPSD` function previously contained a loop that synchronously awaited each image to load (`await new Promise((resolve) => { img.onload = resolve; })`). This caused the export process to take O(n) time based on network latency for images, significantly slowing down the generation of PSD files containing multiple external resources.
**Action:** Extract unique image URLs from the layer nodes and preload all of them concurrently via `Promise.all` into a `Map` before beginning the sequential canvas rendering loop. This replaces O(n) sequential network wait time with O(1) concurrent wait time, resulting in massive speedups (e.g. ~48x improvement for 50 images).

## 2026-08-14 - Optimize sequential font registration with Promise.all

**Learning:** Initializing multiple resources (e.g., custom fonts) sequentially using a `for` loop and `await` inside the loop causes unnecessary blocking. If the initializations are independent of each other, this creates a performance bottleneck during startup.
**Action:** Replace sequential `for` loops with `await Promise.all()` mapped over the data array to execute asynchronous, independent setup tasks concurrently.

## 2026-08-15 - Optimize Array Intersection for Selected Layers in AI Slice\n\n**Learning:** When retrieving multiple layer objects by their IDs, using `.map(id => layers.find(l => l.id === id))` inside high-frequency operations creates an O(N\*M) nested loop, which can cause significant performance degradation when selections are large.\n**Action:** Replace nested array searches with an O(N) Hash Map lookup (`new Map(layers.map(l => [l.id, l]))`) before mapping the IDs to preserve selection order efficiently without relying on nested `.find()`.

## 2024-05-18 - Avoid array overhead in frequent renders

**Learning:** Chaining array methods (e.g. `flatMap`, `filter`, `map`) inside `useMemo` hooks or render bodies causes unnecessary intermediate array allocations, increasing garbage collection pressure and affecting frame rates, especially with large numbers of layers across multiple artboards. Using `.find()` on top of `.flatMap()` prevents early termination of the underlying artboard loop.
**Action:** Replace `array.flatMap().filter()` or `array.flatMap().find()` with nested imperative `for` loops. This allows for early termination when searching (saving CPU cycles) and avoids the memory overhead of intermediate O(N) array constructions.

## 2026-08-21 - Optimize Layer Lookup in MotionPanel

**Learning:** Found an instance in `MotionPanel.tsx` where it used `artboards.flatMap(a => a.layers).find(...)` inside the component body, which executes on every render cycle. This creates a massive intermediate array allocation (O(N) time and memory overhead) only to find a single layer, which increases garbage collection pressure in React applications.
**Action:** Replace `artboards.flatMap(a => a.layers).find(...)` with a nested imperative `for` loop to search for the selected layer. This avoids all intermediate object creation and allows for an early `break` once the layer is found, optimizing both execution speed and memory footprint.

## 2026-08-22 - Optimize Zustand Subscriptions with useShallow

**Learning:** In React 18+ components using Zustand, extracting multiple properties via separate `useStore` hooks creates independent `useSyncExternalStore` subscriptions. For highly interactive components, this forces Zustand to evaluate many listeners sequentially on every state change, increasing CPU overhead.
**Action:** Consolidate multiple property extractions into a single `useStore` call passing an explicit object selector wrapped in `useShallow` from `zustand/react/shallow`. This reduces the subscription count to one, minimizing re-evaluation overhead while preventing unnecessary component re-renders.

## 2026-08-23 - Optimize array lookups and map operations in editor logic

**Learning:** Using `.map` with a nested `.findIndex` creates an O(N^2) operation, causing performance issues. Furthermore, using `Math.min(...array)` on the mapped array causes unnecessary memory allocations and risks exceeding the maximum call stack size on large selections.
**Action:** Replace chained `.map` with nested `.findIndex` and `Math.min` spread operations with a single early-exiting `for` loop or `Set` lookup to compute the lowest index.

## 2026-08-24 - Optimize Layer Lookup in TextPanel (Re-evaluated)
**Learning:** Replacing an O(N) chained `flatMap().find()` operation with an imperative loop is only effective if we correctly respect its original execution context. Removing the wrapping `useMemo` block forces the nested loop to execute on every single render cycle, degrading CPU performance during unrelated state updates.
**Action:** When extracting computationally expensive loops (like traversing all artboard layers) out of inefficient chained array methods, ensure the new imperative loop is wrapped in a `useMemo` block with correct dependencies (e.g., `[artboards, selectedLayerId]`) to preserve both memory and CPU efficiency.
## 2024-05-18 - Optimize selectedLayers calculation in ArrangePanel
**Learning:** Found an instance in `ArrangePanel.tsx` where it calculated `allLayers` and `selectedLayers` on every render by doing an O(N) array allocation (`artboards.flatMap((a) => a.layers)`) followed by another O(N) `filter` mapping. This results in heavy intermediate array allocations on every render cycle which increases garbage collection pressure, affecting UI performance and causing unnecessary rendering slowness.
**Action:** Replace `artboards.flatMap().filter()` with an imperative loop wrapped in `React.useMemo`. Using an imperative block avoids intermediate array overhead, allows early termination of loops (when `layers.length === selectedLayerIds.length`), and `useMemo` guarantees that the logic will only be evaluated when `artboards` or `selectedLayerIds` explicitly change.

## 2026-08-25 - Avoid string joins for array equality in frequent renders

**Learning:** When comparing arrays inside a `useMemo` block in frequently rendered components like `Canvas.tsx`, using `.map(item => item.id).join(',')` is extremely inefficient. It creates massive string allocations and intermediate arrays on every render cycle, increasing garbage collection overhead.
**Action:** Replace `.map().join(',')` based array equality checks with imperative `for` loops that iterate over the arrays and compare elements (or their IDs) index by index, enabling early exits and zero string allocations.
