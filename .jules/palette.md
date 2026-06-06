## 2024-06-03 - [Accessibility] Missing aria-labels in Sidebar buttons
**Learning:** Found that the main left sidebar icons (Toggle tools, Collapse/Expand, Feedback) relied exclusively on visual tooltips and lacked native `aria-label`s, preventing screen readers from correctly announcing their function.
**Action:** Added state-aware `aria-label` attributes to these icon-only buttons to ensure full keyboard and screen reader accessibility. Ensure that all icon-only action buttons are checked for `aria-label` moving forward.
## 2026-06-06 - [Accessibility] Added aria-labels to remaining icon-only close buttons
**Learning:** Many icon-only close/delete buttons in modals and panels (like PricingModal, PublishModal, ShareModal, and SnapshotsPanel) lacked `aria-label` attributes and properly hidden SVG icon contents (`aria-hidden="true"`), causing poor screen reader experiences.
**Action:** Added explicit `aria-label` descriptions and `aria-hidden="true"` to the internal icons across several specific components to ensure correct screen reader announcements without redundant vocalization of 'times' or 'X'. Keep checking these patterns on modals moving forward.
