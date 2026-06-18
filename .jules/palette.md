## 2026-05-28 - [AIAssistant Accessibility]
**Learning:** Icon-only buttons without `aria-label` attributes are a common accessibility issue in React components, rendering them unintelligible to screen readers.
**Action:** Always verify that buttons containing only icons (e.g., `<Icons.Send />`) have a descriptive `aria-label` attribute (e.g., `aria-label="Send message"`) to ensure keyboard and screen reader accessibility.

## 2024-06-01 - Connect `<label>` and `<input>` using `id` and `htmlFor`
**Learning:** The accessibility pattern of explicitly linking inputs and their descriptive labels using the `id` and `htmlFor` attributes is crucial for screen readers. In `Auth.tsx`, input fields for Name, Email, and Password were not explicitly linked to their corresponding `<label>` tags. Connecting them enables assistive technologies to properly announce the input field's purpose.
**Action:** When implementing forms, always ensure each `<input>` has a unique `id` and that its associated `<label>` references that `id` via the `htmlFor` property.

## 2024-06-07 - [Mobile/Panel Accessibility]
**Learning:** Found and fixed two components, `MobileQuickActions` (Mobile FAB) and `MockupPanel` (close button), that used icon-only `<button>`s without `aria-label`s. The `IconButton` wrapper is safe (falls back to title), but raw `<button>`s with just `<Icons.X/>` or `<Icons.Plus/>` inside need manual accessibility handling.
**Action:** Always check raw `<button>` elements that only wrap SVGs/Icons (especially custom mobile toolbars or modal headers) to ensure they have an `aria-label` or `aria-expanded` where applicable.
## 2026-06-11 - [Accessible Custom Toggle Switches]
**Learning:** Custom UI toggle switches built with `<button>` tags (like the "Professional Print Mode" toggle in ExportModal) are visually clear but completely invisible to screen readers without proper semantics.
**Action:** When implementing custom toggle switches, always include `role="switch"`, an `aria-checked` boolean attribute bound to the state, and a descriptive `aria-label` to ensure the component is fully accessible.

## 2026-06-14 - [Publish Modal Accessibility]
**Learning:** Form fields with visually adjacent text labels must use `htmlFor` and `id` attributes to establish programmatic association for screen readers. Simply nesting or placing them side-by-side without explicit linkage causes screen readers to misinterpret or skip the form fields.
**Action:** When implementing forms or modifying existing modals (like `PublishModal`), always ensure each `<input>` and `<textarea>` has a unique `id` and that its associated `<label>` references that `id` via the `htmlFor` property to maintain click-to-focus and screen reader compatibility.
## 2026-06-12 - Missing ARIA Labels on Text Inputs
**Learning:** Discovered several context-specific text inputs across the application (like inline rename fields, or standalone search bars in modal dialogs and side panels) that lacked explicit `<label>` tags due to spatial constraints and visual design patterns. These inputs also lacked `aria-label` attributes, rendering them inaccessible to screen readers which would only announce "edit text".
**Action:** Always provide an explicit `aria-label` attribute describing the input's purpose (e.g., `aria-label="Search templates"`, `aria-label="Rename layer"`) on `<input>` elements that do not have an explicitly linked `<label>` tag.
