## 2026-06-16 - API routes missing implementations
**Learning:** Client-side telemetry explicitly references backend endpoints like `/api/error-log` via `navigator.sendBeacon` (in `utils/errorHandling.ts`) which were previously not implemented in the `/api` directory.
**Action:** When adding or verifying client-side API telemetry and fallback hooks, check if the corresponding Edge Function exists and is wired correctly with CORS and structured logging.
