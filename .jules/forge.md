## 2026-06-18 - Auth Test Setup
**Learning:** Supabase mock in `tests` needs to explicitly return `db` as part of the `vi.mock` return since tests rely on both `supabase` and its `db` alias. We've seen test failures like `[vitest] No "db" export is defined on the "../lib/supabase/client" mock. Did you forget to return it from "vi.mock"?`
**Action:** When mocking `../lib/supabase/client`, make sure to mock the `db` export too.

## 2026-06-18 - Missing Environment Variables in Tests
**Learning:** We need to explicitly pass `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` when running vitest as `getEnv` will throw if they are missing in non-QA bypass mode. QA Bypass mode isn't enabled by default.
**Action:** Always prefix `pnpm test` with `VITE_GEMINI_API_KEY=fake-key VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=fake-key`.
