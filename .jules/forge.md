## 2026-06-18 - Auth Test Setup

**Learning:** Supabase mock in `tests` needs to explicitly return `db` as part of the `vi.mock` return since tests rely on both `supabase` and its `db` alias. We've seen test failures like `[vitest] No "db" export is defined on the "../lib/supabase/client" mock. Did you forget to return it from "vi.mock"?`
**Action:** When mocking `../lib/supabase/client`, make sure to mock the `db` export too.

## 2026-06-18 - Missing Environment Variables in Tests

**Learning:** We need to explicitly pass `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` when running vitest as `getEnv` will throw if they are missing in non-QA bypass mode. QA Bypass mode isn't enabled by default.
**Action:** Always prefix `pnpm test` with `VITE_GEMINI_API_KEY=fake-key VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=fake-key`.
## 2026-06-19 - Test file structure and coverage tools
**Learning:** This codebase strictly forbids altering `package.json` to downgrade versions or install coverage tools (like `@vitest/coverage-v8`) on the fly. Furthermore, test files must be correctly structured with well-nested `describe` blocks. A missing closing bracket can easily orphan test suites and cause failures.
**Action:** Write test suites adhering to the existing framework and configuration. Only use standard execution commands (`pnpm test` and specific test file paths) without injecting new dependency plugins unless explicitly approved. Ensure structural integrity of all `describe` blocks.
