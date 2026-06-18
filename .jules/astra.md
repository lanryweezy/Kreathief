## 2026-06-08 - Added Output Schema Validation Helper for AI Calls

**Learning:** LLMs occasionally produce invalid JSON due to token limits or prompt confusion, which can cause unhandled `JSON.parse` crashes when parsing responses. The standard `JSON.parse(data.text)` pattern should not be used alone for LLM outputs.
**Action:** A `safeParseJSON` helper was added to `utils/errorHandling.ts`. It wraps `JSON.parse` in a try/catch, safely logging the error and returning a provided default fallback value, avoiding application-crashing unhandled exceptions. Always use this helper when handling unstructured LLM strings that are expected to be JSON.

## 2026-06-10 - Enforcing Graceful Failure on Malformed AI Output

**Learning:** Returning a safe default (like an empty array `[]`) from `safeParseJSON` can unintentionally cause silent failures by allowing the application to proceed with empty data instead of triggering the surrounding error handling logic.
**Action:** When validating multi-agent AI responses, always pass `null` as the fallback to `safeParseJSON` and explicitly check the result (`if (!rawVariants) throw new Error(...)`). This ensures the application fails loudly on malformed output, allowing existing `try/catch` blocks to catch the structured error and recover gracefully without silently corrupting downstream layout logic.

## 2024-05-18 - Enforcing JSON output with Gemini `responseSchema`
**Learning:** Using `generationConfig.responseMimeType = 'application/json'` and `responseSchema` via `@google/generative-ai` `SchemaType` completely eliminates the need for regex cleanup on raw markdown-wrapped responses, ensuring reliable output parsing for features like palette generation.
**Action:** Always prefer setting `responseSchema` on Gemini API requests over attempting to regex-match or manually parse text completion output.

## 2026-06-12 - Fix JSON Output parsing crashes with responseSchema and safeParseJSON fallback
**Learning:** Relying on 'format as JSON' in prompts without explicitly configuring the schema natively (using Gemini `responseSchema`) and using unstructured `JSON.parse` allows AI models to occasionally wrap output in markdown tags causing application-breaking exceptions.
**Action:** When handling AI requests that return JSON arrays or objects, explicitly define `generationConfig.responseSchema` so the model always formats valid JSON. Ensure UI components handle the data extraction natively or wrap parsing with `safeParseJSON` throwing an error on `null` payload so the UI catches it.

## 2026-06-13 - [Silent JSON Parsing Failure Prevention]
**Learning:** Returning default empty values (like `[]` or `{}`) in generic `safeParseJSON` error handling causes downstream functions in `services/geminiService.ts` to fail silently. When valid responses aren't successfully parsed, the downstream code treats them as valid but empty responses instead of catching the error.
**Action:** When using `safeParseJSON` to parse LLM JSON responses, always pass `null` as the default fallback value and explicitly check `if (!parsed) throw new Error(...)`. This ensures the error cascades correctly, executing proper fallback UI logic or logging within surrounding try/catch blocks.

## 2024-05-20 - Adding Resilience to Unguarded Backend AI Calls
**Learning:** Unguarded AI API calls using native `fetch` can hang indefinitely (due to missing timeouts) or fail silently/brittley on transient 429 (Rate Limit) or 50x (Server Error) responses. This causes applications to hang or crash without attempting a recovery.
**Action:** When making API requests to backend AI routes or third-party AI services, wrap them in a centralized `retryWithBackoff` pattern. Ensure that requests utilize `AbortController` to enforce strict timeouts (e.g., 30s) and explicitly map transient HTTP errors (like 429 and 5xx) to `NetworkError` types so the backoff logic can successfully catch and retry them.

## 2026-06-15 - Structured Output Prevents Conversational Preamble
**Learning:** Instructing an LLM to "Return ONLY the text/value" is an unreliable prompt engineering technique. The model will frequently append conversational preamble (e.g., "Sure, here is your font: [FONT]") even when explicitly instructed not to, which breaks downstream application logic that expects a raw primitive value.
**Action:** When a raw string or primitive value is required from an LLM (e.g., `suggestFontPairing`, `enhancePrompt`), use `generationConfig` with `responseMimeType: 'application/json'` and an explicit `responseSchema` of `SchemaType.STRING`. This enforces a strict JSON output structure, entirely eliminating conversational preamble and allowing safe extraction using `safeParseJSON`.

## 2026-06-17 - Eliminate Text Generation Preamble
**Learning:** In text manipulation features (like rewriting text or content generation), instructing the LLM to "Return ONLY the rewritten text without quotes" is insufficient and leads to conversational preamble ("Sure, here is the text: ") which breaks string splitting logic in components like `SmartContentGenerator` and `Toolbar`.
**Action:** When a raw string is needed, configure the Gemini API request with `generationConfig: { responseMimeType: 'application/json', responseSchema: { type: SchemaType.STRING } }` and parse the text with `safeParseJSON` instead of relying on prompt instructions and string replacements.

## 2026-06-18 - JSON Schema for Raw SVG Path Validation
**Learning:** Relying on regular expressions (like `.replace(/<[^>]*>/g, '')`) to extract raw strings (e.g., SVG path 'd' attributes) from free-form LLM outputs is brittle. LLMs often include unprompted markdown (e.g., `xml`, `svg`) or conversational wrappers ("Here is your SVG:") that evade simple replacements, resulting in malformed inputs that crash rendering functions.
**Action:** When a pure text primitive is required (such as an SVG path string), configure the Gemini API request with `generationConfig: { responseMimeType: 'application/json', responseSchema: { type: SchemaType.STRING } }`. Then, strictly parse the payload using `safeParseJSON<string | null>(data.text, null)` rather than using string matching and replacing methods.
