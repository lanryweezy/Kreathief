## 2026-05-28 - [AIAssistant Accessibility]
**Learning:** Icon-only buttons without `aria-label` attributes are a common accessibility issue in React components, rendering them unintelligible to screen readers.
**Action:** Always verify that buttons containing only icons (e.g., `<Icons.Send />`) have a descriptive `aria-label` attribute (e.g., `aria-label="Send message"`) to ensure keyboard and screen reader accessibility.
