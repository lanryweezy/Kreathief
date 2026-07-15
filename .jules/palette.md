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

## 2024-05-18 - Missing Accessible Names on Modals

**Learning:** Found that custom modal components (`CommunityModal` and `CreateProjectModal`) were using icon-only `<button>` tags (like `<Icons.X>`) for close actions without `aria-label` attributes. This rendered the close buttons invisible to screen reader users, disrupting the modal dismissal experience.
**Action:** Always ensure that any icon-only button, especially those performing critical interactions like closing overlays/modals, has a clear and descriptive `aria-label` (e.g., `aria-label="Close modal"`).

## 2026-06-20 - [BlogPost Share Buttons Accessibility]

**Learning:** Discovered icon-only buttons in `components/blog/BlogPostView.tsx` used for sharing (Twitter, Website, Link) lacked `aria-label` attributes, rendering them unintelligible to screen readers.
**Action:** Always verify that buttons containing only icons (e.g., `<Icons.Twitter />`) have a descriptive `aria-label` attribute (e.g., `aria-label="Share on Twitter"`) to ensure keyboard and screen reader accessibility.

## 2026-06-22 - Missing ARIA labels in AI Assistant Panel

**Learning:** Newly introduced feature panels, specifically the AI Assistant, often lack basic accessibility attributes like `aria-label` on icon-only buttons (minimize, close, clear, send, etc). This pattern makes the interface difficult to navigate for screen reader users.
**Action:** When auditing new feature components, explicitly check all icon-only buttons (`<button><Icons.X/></button>`) for missing `aria-label` attributes to ensure they announce their purpose correctly.

## 2026-06-24 - Missing ARIA labels on Icon-only buttons in Editor Navigation

**Learning:** Found that quick access bars and dynamic toolbars (like `QuickAccessBar.tsx` and `ShortcutOverlay.tsx`) frequently use icon-only buttons for actions like "Zoom In", "Zoom Out", and "Close". Even when wrapper components like `QuickButton` take a `title` prop, they might fail to forward it as an `aria-label` to the underlying `<button>` element.
**Action:** When creating reusable button wrappers (e.g. `QuickButton`, `IconButton`), ensure they automatically apply an `aria-label` attribute using the provided `title` or explicit `ariaLabel` prop. Also, systematically audit all instances of `<button><Icon /></button>` across the codebase to ensure they possess a descriptive `aria-label`.
## 2024-05-18 - Missing ARIA Labels on Icon Buttons\n**Learning:** When building custom panels with inline actions, it is easy to forget `aria-label`s on icon-only buttons like Trash or Edit, which makes them inaccessible to screen readers.\n**Action:** Always verify `aria-label` presence when using `<Icons.X className="..." />` inside a `<button>`.

## 2025-05-18 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (such as back arrows and close icons) frequently lack `aria-label` attributes across different components (e.g., `MobileContextMenu`, `BottomSheet`, `UserProfilePage`, `SmartTemplatesPanel`). This is a common pattern where rapid UI development skips over crucial accessibility hints, leaving screen reader users without context for interactive elements.
**Action:** Always verify that buttons containing only icons (or primarily icons with no visible text) have a descriptive `aria-label` so that screen readers can communicate their purpose effectively.

## 2026-07-15 - Missing ARIA labels in Node Editor

**Learning:** Found multiple instances in `Node.tsx` and `NodeGraph.tsx` where icon-only buttons (`×`, `+`, `<Icons.Minus />`, `<Icons.Plus />`) lacked `aria-label` attributes. This breaks keyboard accessibility and renders them invisible to screen readers, which is especially critical in an interactive visual tool like a node graph editor.
**Action:** When implementing custom workspace controls, zooming tools, and interactive layer configurations, ensure all buttons with icons or symbols have clear and descriptive `aria-label`s.
