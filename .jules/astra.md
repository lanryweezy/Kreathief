## 2026-10-23 - Strict Schema for Gemini JSON Output
**Learning:** Gemini's `responseMimeType: 'application/json'` guarantees the output is parseable JSON, but doesn't guarantee the *shape* of the JSON matches what your application expects, which can lead to uncaught errors downstream when expected nested structures are missing.
**Action:** When using `application/json`, always provide an explicit `responseSchema` (using `@google/generative-ai`'s `SchemaType`) in the `generationConfig` to force Gemini to adhere to the exact object structure your application logic depends on.
## 2026-10-28 - Explicit Schema Enforcement
**Learning:** Enforcing structured JSON output solely through a system prompt (e.g., "Return ONLY valid JSON") is fragile and prone to parsing crashes, especially for complex nested objects like multi-layer artboards.
**Action:** Always provide a rigorous `responseSchema` in the `generationConfig` when using Gemini models to guarantee the output matches the expected shape and eliminate empty or malformed JSON parsing failures.
