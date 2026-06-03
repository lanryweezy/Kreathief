## 2024-06-03 - [Accessibility] Missing aria-labels in Sidebar buttons
**Learning:** Found that the main left sidebar icons (Toggle tools, Collapse/Expand, Feedback) relied exclusively on visual tooltips and lacked native `aria-label`s, preventing screen readers from correctly announcing their function.
**Action:** Added state-aware `aria-label` attributes to these icon-only buttons to ensure full keyboard and screen reader accessibility. Ensure that all icon-only action buttons are checked for `aria-label` moving forward.
