## 2026-10-23 - Strict Schema for Gemini JSON Output
**Learning:** Gemini's `responseMimeType: 'application/json'` guarantees the output is parseable JSON, but doesn't guarantee the *shape* of the JSON matches what your application expects, which can lead to uncaught errors downstream when expected nested structures are missing.
**Action:** When using `application/json`, always provide an explicit `responseSchema` (using `@google/generative-ai`'s `SchemaType`) in the `generationConfig` to force Gemini to adhere to the exact object structure your application logic depends on.
