1. **Remove `VITE_FREEPIK_API_KEY` exposure in `services/freepikService.ts`**
   - The `isConfigured` method currently checks `import.meta.env.VITE_FREEPIK_API_KEY`. This forces the bundler to include the backend secret in the client code if the `VITE_` prefix is used in `.env`.
   - Update `isConfigured` to return `true` unconditionally (or just `typeof window !== 'undefined'`). Since it relies on the backend proxy `/api/freepik`, the backend handles API key management. Checking a secret on the client is insecure and redundant.

2. **Remove `VITE_REPLICATE_API_KEY` exposure in `services/upscaleService.ts`**
   - The `upscaleViaReplicate` method directly checks `(import.meta as any).env?.VITE_REPLICATE_API_KEY` and calls the `https://api.replicate.com` directly from the browser.
   - We will replace the direct `https://api.replicate.com` fetch calls with requests to a new backend proxy endpoint `/api/replicate`.
   - We will create `api/replicate.ts` based on existing proxy patterns (e.g. using `requireAuth`, CORS, forwarding the request using `process.env.REPLICATE_API_KEY`).
   - Update `upscaleViaReplicate` to hit `/api/replicate` instead, removing the client-side `import.meta.env` secret entirely.

3. **Complete pre commit steps**
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
