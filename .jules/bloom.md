## 2024-05-18 - Sanitizing Edge-Cases in Data Flow

**Learning:** Sometimes form validation handles inputs successfully without crashing during generation but fails silently or explicitly at the outer layers (like API proxy endpoints or export steps) when parameters like filenames map directly to file systems or internal regex requirements. In `ExportModal.tsx`, `validation.ts` defined a strict regex for filenames (`/^[a-zA-Z0-9_\-\s]+$/`), but the UI form generated invalid defaults from arbitrary project names and allowed the user to type special characters anyway.
**Action:** When updating or generating inputs that must map to restrictive constraints (like slugs or filenames), proactively strip out invalid characters in the UI change handler (`e.target.value.replace(/[^...]/)`) or default value generator rather than letting the underlying logic choke on validation later.

## 2024-06-18 - Improved Error Notification UX

**Learning:** Found multiple instances in `components/panels/UploadsPanel.tsx`, `TextPanel.tsx`, and `BrandPanel.tsx` where generic, blocking native `alert()` dialogues were used for error handling (e.g. `alert('Failed to parse PSD file.')`). This creates a disruptive user experience.
**Action:** Replaced native `alert()` calls with the integrated `addToast()` notification system from `useStore`, passing the same generic message as an 'error' type. This is non-blocking and fits seamlessly with the rest of the application.

## 2026-06-21 - Adding Undo History Support to Find & Replace

**Learning:** Operations that loop over layers to modify text content programmatically skip the standard user-action undo capture unless explicitly instrumented.
**Action:** When creating bulk text operation utilities, ensure the first modification triggers a single saveToHistory call.

## 2024-06-21 - Improved Error Notification UX

**Learning:** Found multiple instances where generic, blocking native `alert()` dialogues were used for feedback/error handling (e.g., sharing to community in Dashboard). This creates a disruptive user experience.
**Action:** Replaced native `alert()` calls with the integrated `addToast()` notification system from `useStore`, passing the specific message and success/error types. This is non-blocking and fits seamlessly with the rest of the application.

## 2024-06-09 - Replaced generic error messages with specific AI error formatters

**Learning:** Several AI-powered features (`TextPanel`, `VectorizerPanel`, `MagicPanel`) were displaying generic "Something went wrong/failed" error toasts on failure, despite the codebase already having a `getAIErrorMessage` utility in `utils/errorMessages.ts` specifically designed to provide actionable user feedback for AI operations (differentiating timeouts, quota limits, and network errors).
**Action:** Replaced hardcoded, generic error strings in catch blocks with `getAIErrorMessage(error)` to provide specific, actionable guidance to users across all AI generation touchpoints.

## 2026-06-22 - Specific error messaging for file parsing

**Learning:** File import operations like PSD parsing in `UploadsPanel` frequently fail silently or display generic "Failed to parse" messages. While `utils/errorMessages.ts` contained a robust `getErrorDetails` utility capable of diagnosing quota, network, timeout, memory, permission, and format errors with actionable suggestions, it was primarily used by AI features and ignored by standard file handling catch blocks.
**Action:** Replaced hardcoded, generic error strings in non-AI catch blocks (like `parsePsdToLayers`) with `getErrorDetails(err)` to provide specific, actionable guidance to users across all failure touchpoints.

## 2024-11-20 - Typo Tolerance and Short Query Matching in Client-Side Search

**Learning:** Client-side searches often fail silently on valid inputs if they rely on arbitrary keyword length filters (e.g. `k.length > 2`), dropping short queries like "AI" or "UX" entirely. Additionally, strict exact string matching for user input yields a brittle experience where simple typos (like "teech" instead of "tech") return zero results.
**Action:** When implementing or improving frontend search logic, remove arbitrary keyword length limitations that swallow short valid words. Utilize an inline fuzzy-matching algorithm (like Levenshtein distance) configured with dynamic thresholds based on word length to provide typo tolerance without false positives on short words.

## 2024-07-01 - Specific error messaging for standard export and generation operations

**Learning:** Found multiple instances where non-AI operations, such as generating share links in `ShareModal`, auto-detecting mockup placement in `MockupPanel`, and creating AI-generated designs in `Dashboard`, were using generic error messages in `addToast` calls inside `catch` blocks (e.g., `addToast('Batch export failed', 'error')`). While these operations are not directly AI-related, the `getErrorDetails` utility provides a consistent, robust way to extract actionable suggestions (like storage limits, network issues, etc.) for any error type.
**Action:** Replaced generic error strings in standard `addToast` catch blocks with dynamic messages constructed using `getErrorDetails(e)`. This ensures that standard operations also provide specific, actionable guidance to users when they fail, closing the quality gap in error reporting.

## 2024-07-03 - Replaced generic error messages with specific AI error formatters in AIGenerateModal

**Learning:** The `AIGenerateModal` feature was displaying a generic "Something went wrong" error toast on failure, despite the codebase already having a `getAIErrorMessage` utility in `utils/errorMessages.ts` specifically designed to provide actionable user feedback for AI operations (differentiating timeouts, quota limits, and network errors).
**Action:** Replaced the hardcoded, generic error string in the catch block of `AIGenerateModal` with `getAIErrorMessage(err)` to provide specific, actionable guidance to users.

## 2024-11-20 - Typo Tolerance and Short Query Matching in Client-Side Search

**Learning:** Client-side searches often fail silently on valid inputs if they rely on exact substring matches (`String.includes`), yielding a brittle experience where simple typos (like "teech" instead of "tech") return zero results. In addition, reusing inline logic like `getLevenshteinDistance` leads to code duplication across services.
**Action:** Created a centralized `utils/search.ts` with a `fuzzyMatch` utility that applies Levenshtein distance typo tolerance. Replaced exact `.includes()` matching in Dashboard to gracefully handle user typos without changing the external interface of the search feature.

## 2026-07-11 - High-fidelity Node Workflow UI Upgrade

**Learning:** Node-based UIs in high-end design tools require more than just functional connectivity; they need visual "weight" (glassmorphism, gradients) and animated feedback (flow indicators) to feel integrated with a premium WebGL-driven application. Emojis, while convenient, break the "Pro" immersion.
**Action:** Always prefer SVG icon libraries (like the project's internal Icons) over emojis for core feature interfaces, and use CSS animations for "active" states in graph-based workflows.

## 2026-08-15 - Applying fuzzy matching to search features

**Learning:** Replaced exact substring matching with fuzzy matching to improve search resilience against typos. However, directly writing the logic instead of using the pre-existing `utils/search.ts` utility leads to duplicated logic or hallucinated imports. Need to verify that imports are actual before using them.
**Action:** Use existing `fuzzyMatch` from `utils/search.ts` when implementing typo-tolerant search across the app.
## 2026-08-16 - Typo-tolerant Command Palette Search
**Learning:** The Command Palette (`CommandPalette.tsx`) relied on the `searchCommands` utility in `commands/registry.ts`, which used exact substring matching (`.includes()`). This caused the search to fail completely on minor user typos (e.g. typing "fiel" instead of "file" or "geneate" instead of "generate"), degrading the user experience.
**Action:** Replaced exact substring matching with the existing `fuzzyMatch` utility in `searchCommands`. This closes the quality gap by adding typo tolerance without altering the external interface of the search function.
## 2026-08-20 - Typo-tolerant Layers Panel Search
**Learning:** The layer search functionality in the Layers Panel (`LayersPanel.tsx`) relied on strict substring matching (`.includes()`). This caused searches to fail on minor typos when users were trying to find specific layers among potentially hundreds (e.g. "hader" instead of "header"), degrading the workflow quality.
**Action:** Replaced exact substring matching with the existing `fuzzyMatch` utility from `utils/search.ts` to gracefully handle typos and significantly improve the search resilience without changing any component props or state structures.
## $(date +%Y-%m-%d) - Component fragility with string methods on unstructured props
**Learning:** Destructuring with a default value (e.g. `alt = ''`) only protects against `undefined`, leaving the component vulnerable to fatal crashes (`Cannot read properties of null`) if passed `null` or unexpected types from loosely typed data or APIs.
**Action:** Always defensively check `typeof prop === 'string'` before calling string methods like `charAt` or `toUpperCase` on props that can be bypassed by nulls.
## 2024-05-18 - Replacing exact substring matching with fuzzy matching in Community Feed search
**Learning:** The community feed search (`CommunityTemplates.tsx`) relied on strict exact substring matching (`.includes()`) for title, author, and tags. This brittle implementation meant that minor user typos or variations returned zero results, severely degrading the experience of finding templates.
**Action:** Replaced exact `.includes()` matching with the existing `fuzzyMatch` utility from `utils/search.ts`. This closes the quality gap by adding robust typo tolerance across titles, authors, and tags without altering the component’s interface or adding new features.
## 2024-05-18 - Replacing exact substring matching with fuzzy matching in Text Panel font search
**Learning:** The text panel font search (`TextPanel.tsx`) relied on strict exact substring matching (`.includes()`) for font names. This brittle implementation meant that minor user typos returned zero results, degrading the experience of finding fonts.
**Action:** Replaced exact `.includes()` matching with the existing `fuzzyMatch` utility from `utils/search.ts`. This closes the quality gap by adding robust typo tolerance without altering the component’s interface or adding new features.
