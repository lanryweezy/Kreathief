## 2026-05-28 - [AIAssistant Accessibility]
**Learning:** Icon-only buttons without `aria-label` attributes are a common accessibility issue in React components, rendering them unintelligible to screen readers.
**Action:** Always verify that buttons containing only icons (e.g., `<Icons.Send />`) have a descriptive `aria-label` attribute (e.g., `aria-label="Send message"`) to ensure keyboard and screen reader accessibility.

## 2024-06-01 - Connect `<label>` and `<input>` using `id` and `htmlFor`
**Learning:** The accessibility pattern of explicitly linking inputs and their descriptive labels using the `id` and `htmlFor` attributes is crucial for screen readers. In `Auth.tsx`, input fields for Name, Email, and Password were not explicitly linked to their corresponding `<label>` tags. Connecting them enables assistive technologies to properly announce the input field's purpose.
**Action:** When implementing forms, always ensure each `<input>` has a unique `id` and that its associated `<label>` references that `id` via the `htmlFor` property.
