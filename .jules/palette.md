## 2026-08-10 - Screen Reader Accessibility for Vector Editing Sliders

**Learning:** Native `<input type="range">` elements used for vector properties (like Simplify Tolerance, Offset Distance, Corner Radius, Rotation, and Scale) inside `VectorEditingPanel` lacked semantic `<label htmlFor>` links, causing them to be announced generically by screen readers.
**Action:** Always include a context-specific `aria-label` attribute on slider inputs inside complex panels to ensure visually impaired users understand what property they are controlling.

## 2024-05-25 - Screen Reader Accessibility for Icon-only Buttons in Asset Grids

**Learning:** When rendering asset cards in dense grids (like favorites or templates), the secondary actions that appear on hover (such as a "Remove" button with only an 'X' icon) are inaccessible to screen readers without a text label or `aria-label`. Because they lack visible text to save space, screen readers will either announce nothing or something unhelpful, leaving visually impaired users unsure what the button does.
**Action:** Always include a context-specific `aria-label` attribute (e.g., `aria-label="Remove from favorites"`) on icon-only buttons, especially in visually dense UI components like asset grids.

## 2024-05-27 - Screen Reader Accessibility for Search Clear Buttons

**Learning:** When using standard icon-only buttons (`<button><Icons.X/></button>`) within input fields to clear the search query, screen readers will read nothing useful (e.g., they might announce the icon component name or just "button").
**Action:** Always include a context-specific `aria-label` attribute (e.g., `aria-label="Clear search"`) on icon-only buttons intended to clear text inputs, ensuring visually impaired users know how to reset their search state.

## 2024-05-28 - Screen Reader Accessibility for Dynamic Arrays of Inputs

**Learning:** When generating multiple `<input type="color">` and `<input type="range">` elements dynamically inside an array map (like color stops in `GradientEditor`), they often lack semantic `<label htmlFor>` links due to the dynamic nature of the list, rendering them inaccessible to screen readers.
**Action:** Always include a context-specific, dynamically numbered `aria-label` attribute (e.g., `aria-label={"Color Stop " + (index + 1) + " Color"}`) directly on the mapped input elements to ensure visually impaired users can differentiate between items in the list.

## 2024-05-29 - Screen Reader Accessibility for Modal Close Buttons

**Learning:** When using standard modal components that employ a generic "Close" or "X" icon for dismissal without visible text (e.g., `<button><Icons.X/></button>`), screen readers often announce them ambiguously. In complex interfaces with multiple modals or side panels, a generic "Close" label might not provide sufficient context for visually impaired users.
**Action:** Always include a specific `aria-label` attribute on modal close buttons that describes exactly what is being closed (e.g., `aria-label="Close appearance modal"` or `aria-label="Close version history"`), ensuring users understand which dialog they are dismissing.

## 2026-08-17 - Screen Reader Accessibility for Icon-Only State Toggles

**Learning:** When using icon-only buttons as state toggles (like expanding a "Logic Trace" details panel), providing a static `title` is not sufficient for accessibility. Screen readers require explicit `aria-expanded` attributes to convey the current state, and dynamic `aria-label` or `title` text to clearly indicate the button's action (e.g., "View Logic Trace" vs. "Hide Logic Trace").
**Action:** Always include `aria-expanded` and context-aware, dynamic `aria-label` and `title` attributes on icon-only toggle buttons to ensure the component is fully accessible and stateful for screen readers.

## 2026-08-23 - Redundant ARIA labels

**Learning:** Adding an `aria-label` that is exactly the same as the button text is redundant. Screen readers will read the button text automatically.
**Action:** Only add `aria-label` to buttons when the text content is not descriptive enough, such as icon-only buttons or buttons with vague text.

## 2026-08-25 - Screen Reader Accessibility for Dual-Input Color Pickers

**Learning:** When color pickers combine a native `<input type="color">` and a hex `<input type="text">` side-by-side (e.g., in `ContrastChecker`), they often lack semantic `<label>` associations or explicit `aria-label` attributes. Without them, screen readers announce both simply as generic inputs, providing no context on whether the user is interacting with the color swatch or the hex value for the foreground or background.
**Action:** Always include context-specific `aria-label` attributes on both the visual color picker (e.g., `aria-label="Background color picker"`) and its accompanying hex text input (e.g., `aria-label="Background color hex value"`) when grouped together without explicit `<label htmlFor>` bindings.
## 2024-05-17 - Tab Component Accessibility
**Learning:** Found that custom Tab components in this app lacked semantic ARIA roles and keyboard focus styles, leading to poor accessibility for screen reader and keyboard users.
**Action:** Always ensure `role="tablist"` on the tab container, `role="tab"` and `aria-selected` on the tab items, and apply `focus-visible` styles with a negative outline offset to prevent layout shifts.

## 2026-08-29 - Screen Reader Accessibility for State Toggle Buttons

**Learning:** When using an icon-only button to toggle a binary state (like locking/unlocking the aspect ratio in `TransformPanel.tsx`), it's important to provide not only an `aria-label` but also the correct state attribute. Using `aria-expanded` is semantically incorrect for simple toggles, as it implies the button expands/collapses a section.
**Action:** Always use `aria-pressed={boolean}` for state toggle buttons, along with a descriptive `aria-label` when the button is icon-only.
## 2026-09-01 - Screen Reader Accessibility for Aspect Ratio Toggle Buttons
**Learning:** When using an icon-only button to toggle a binary state (like locking/unlocking the aspect ratio in `ArrangePanel.tsx` and `TransformTools.tsx`), it's important to provide not only an `aria-label` but also the correct state attribute. Using `aria-pressed` is correct for state toggle buttons to let screen reader users know the current status.
**Action:** Always use `aria-pressed={boolean}` for state toggle buttons, along with a descriptive `aria-label` when the button is icon-only.
