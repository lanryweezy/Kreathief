## 2026-06-08 - Added Output Schema Validation Helper for AI Calls

**Learning:** LLMs occasionally produce invalid JSON due to token limits or prompt confusion, which can cause unhandled `JSON.parse` crashes when parsing responses. The standard `JSON.parse(data.text)` pattern should not be used alone for LLM outputs.
**Action:** A `safeParseJSON` helper was added to `utils/errorHandling.ts`. It wraps `JSON.parse` in a try/catch, safely logging the error and returning a provided default fallback value, avoiding application-crashing unhandled exceptions. Always use this helper when handling unstructured LLM strings that are expected to be JSON.

## 2026-06-10 - Enforcing Graceful Failure on Malformed AI Output

**Learning:** Returning a safe default (like an empty array `[]`) from `safeParseJSON` can unintentionally cause silent failures by allowing the application to proceed with empty data instead of triggering the surrounding error handling logic.
**Action:** When validating multi-agent AI responses, always pass `null` as the fallback to `safeParseJSON` and explicitly check the result (`if (!rawVariants) throw new Error(...)`). This ensures the application fails loudly on malformed output, allowing existing `try/catch` blocks to catch the structured error and recover gracefully without silently corrupting downstream layout logic.

## 2024-05-18 - Enforcing JSON output with Gemini `responseSchema`
**Learning:** Using `generationConfig.responseMimeType = 'application/json'` and `responseSchema` via `@google/generative-ai` `SchemaType` completely eliminates the need for regex cleanup on raw markdown-wrapped responses, ensuring reliable output parsing for features like palette generation.
**Action:** Always prefer setting `responseSchema` on Gemini API requests over attempting to regex-match or manually parse text completion output.
