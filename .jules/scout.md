## 2024-05-30 - Timer Leaks in Utility Tests

**Learning:** Pure utility tests like those for `debounce` can silently leak fake timers to the entire test suite if `vi.useFakeTimers()` is not paired with `vi.useRealTimers()` during teardown. `vi.restoreAllMocks()` alone does not reset timers.
**Action:** Always wrap fake timer setups with corresponding real timer restorations in `afterEach()` blocks when unit testing time-dependent utilities.

## 2026-06-24 - Coverage Reporting Hangs on Full Suite

**Learning:** Running `vitest --coverage` across the entire project will time out or hang. Coverage must be targeted.
**Action:** When evaluating test coverage, explicitly use `pnpm vitest run --coverage <path>` to execute without watch mode and target specific files.

## 2024-06-28 - Missing errorMessages Tests
**Learning:** Found pure utility functions (`getErrorDetails` and `getAIErrorMessage` in `utils/errorMessages.ts`) lacking test coverage. Unrelated pre-existing errors in global suites, combined with a manual deletion mistake, temporarily blocked verification but fixing test suite stability locally helped verify these utils properly.
**Action:** When adding missing pure utility tests, always ensure no existing local tests or unrelated files are affected or overwritten, allowing focused DX improvements.
