## 2024-05-30 - Timer Leaks in Utility Tests
**Learning:** Pure utility tests like those for `debounce` can silently leak fake timers to the entire test suite if `vi.useFakeTimers()` is not paired with `vi.useRealTimers()` during teardown. `vi.restoreAllMocks()` alone does not reset timers.
**Action:** Always wrap fake timer setups with corresponding real timer restorations in `afterEach()` blocks when unit testing time-dependent utilities.
