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

## 2026-06-19 - Strict JSON Parsing for Layer Name Generation

**Learning:** Relying on prompt instructions ("No quotes.") and regex replacements (`replace(/^["']|["']$/g, '')`) to sanitize text outputs for features like `generateLayerName` is fragile. LLMs may still generate conversational wrappers or unhandled punctuation that regex misses.
**Action:** To guarantee clean primitive outputs for layer naming, replace textual instruction and regex sanitization with strict schema enforcement (`responseMimeType: 'application/json'` and `responseSchema: { type: SchemaType.STRING }`), parsing the result safely with `safeParseJSON`.

## 2026-06-21 - Prevent AI App Freeze on External Model Fallbacks

**Learning:** Relying on raw `fetch` calls without abort controllers or retry wrappers for external AI models (like Fal.ai Proxies) can cause the application generation state to freeze indefinitely if the request drops or silently fails on a 429/500 backend error.
**Action:** When making external AI API calls (e.g., `fetch` to `/api/fal` or Gemini), always wrap them with `retryWithBackoff` from `utils/errorHandling.ts` and use an `AbortController` (e.g., 30s timeout) to ensure transient network errors are handled gracefully and hanging connections are terminated.

## 2026-06-20 - Strict JSON Parsing for Complex Object and Array Outputs

**Learning:** While `SchemaType.STRING` is effective for single values, omitting `responseSchema` for complex structural outputs like arrays (`generateAutoLayoutSuggestions`) or complex objects (`extractStyleFromImage`) while relying only on `responseMimeType: 'application/json'` can still lead to malformed parsing or unbounded object structures generated by the LLM.
**Action:** Always provide a full `responseSchema` using `SchemaType.OBJECT` or `SchemaType.ARRAY` specifying the exact keys and types needed, even if the structure seems complex. For associative maps, an `OBJECT` type schema helps guide the LLM to output key-value pairs matching the expected format, preventing crashes or missing data.

## 2026-06-22 - Prevent Unbounded JSON Generation in Critic Agent

**Learning:** Using `responseMimeType: 'application/json'` without a paired `responseSchema` for multi-agent mutation tasks (like `criticAgentReview`) allows the LLM to invent unstructured JSON properties, which breaks expected component UI rendering.
**Action:** When creating complex LLM mutation requests that require output schemas, explicitly construct the expected `SchemaType` object structure, and include it under `generationConfig.responseSchema`.

## 2026-06-23 - Eliminate Text Generation Preamble in generateAltText

**Learning:** Extracting raw strings from text-based LLM generation APIs (like `generateAltText`) is prone to issues where the LLM wraps the desired response in conversational preamble ("Here is your alt text:"). Relying on regex replacements like `.replace(/[.!?]+$/, '')` alone doesn't prevent or safely remove these preambles, often leading to poorly formatted text in the application.
**Action:** When a raw string is needed, such as alt text generation, configure the Gemini API request with `generationConfig: { responseMimeType: 'application/json', responseSchema: { type: SchemaType.STRING } }` and parse the text with `safeParseJSON` instead of relying on string replacing methods.

## 2026-06-25 - Prevent Silent JSON parse crashes in generic prompts

**Learning:** AI generation requests like `analyzeDesignContext` that directly use `JSON.parse` will crash the application and cause silent failures if the LLM output is malformed, wrapped in markdown, or otherwise invalid JSON. This completely breaks features that rely on arrays, like asset recommendations, instead of allowing a graceful fallback path.
**Action:** Replace `JSON.parse` with `safeParseJSON<T | null>(text, null)`, check if the result is `null`, and throw a structured error to allow surrounding try/catch blocks to execute graceful fallback routines. Always enforce `generationConfig` with a `responseSchema` and `responseMimeType: 'application/json'` instead of relying solely on the prompt instruction to return valid JSON.
\n## 2026-06-29 - Explicit null string fallback to prevent silent JSON parsing failures\n**Learning:** When using `safeParseJSON<T | null>(text, null)`, if `text` is falsy (like an empty string from a model refusal), falling back to a stringified empty array (`'[]'`) or object (`'{}'`) before parsing will cause the parser to successfully return `[]` or `{}`. These truthy values bypass checks like `if (!parsed)`, leading to silent application failures where downstream code operates on empty data structures rather than executing error recovery logic.\n**Action:** When extracting data from LLMs where an empty response should be treated as a failure, use `'null'` as the fallback string (e.g., `data.text || 'null'`). This ensures `safeParseJSON` parses the literal `null`, which then correctly triggers subsequent `if (!parsed)` checks and fails loudly.

## 2026-06-29 - Null fallback standard for safeParseJSON masking silent failures

**Learning:** `safeParseJSON` returns the provided fallback when parsing fails. Using `[]` or `{}` as the fallback value coupled with an empty string fallback parameter (e.g., `data.text || '{}'`) silently masks LLM empty outputs/failures, because the returned empty structure is truthy and bypasses `!parsed` checks, leading to default state corruption.
**Action:** When extracting data from LLMs where an empty response should be treated as a failure, use `'null'` as the fallback string and `null` as the fallback value (e.g., `safeParseJSON<T | null>(data.text || 'null', null)`). This ensures `safeParseJSON` parses the literal `null`, which then correctly triggers subsequent `if (!parsed)` checks and fails loudly.

## 2026-07-02 - [Native System Instructions and Input Sanitization]
**Learning:** Concatenating system instructions and raw user input into a single prompt string (e.g., `text: \`You are an expert... User Description: "\${simplePrompt}"\``) makes the LLM vulnerable to prompt injection, payload bloat, and context confusion. It treats the instructions and the data at the same privilege level.
**Action:** Always move the AI's persona, rules, and output format instructions to the native `systemInstruction` field of the API payload. Furthermore, sanitize and truncate raw user input (e.g., `simplePrompt.trim().substring(0, 1000)`) before embedding it into the `contents` array to limit payload size and reduce simple injection surface area.
