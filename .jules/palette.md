## 2024-05-24 - Screen Reader Accessibility for Range Inputs

**Learning:** Custom slider controls (`<input type="range">`) that lack explicitly linked `<label>` tags (often due to visual space constraints or custom label rendering) are announced simply as "slider" by screen readers, making it impossible for visually impaired users to know what they control.
**Action:** Always include a descriptive `aria-label` attribute (e.g., `aria-label="Curvature"`) directly on the input element when it's not wrapped in a semantic `<label htmlFor="...">` to ensure accessibility.

## 2026-07-30 - Screen Reader Accessibility for Nested Range Inputs

**Learning:** Custom slider controls (`<input type="range">`) nested deep within complex control panels (like Mockup controls) that use generic text labels for styling (e.g., `<span>Scale</span>`) instead of semantic `<label htmlFor="...">` are inaccessible to screen readers. Users will just hear "slider".
**Action:** Always include a descriptive `aria-label` attribute (e.g., `aria-label="Scale"`) directly on the input element when it's not wrapped in a semantic `<label htmlFor="...">` to ensure accessibility, even if a nearby text element explains its purpose visually.

## 2024-11-20 - Screen Reader Accessibility for Unlinked Labels on Inputs

**Learning:** Native `<input type="color">` and `<input type="range">` elements, when visually labeled using adjacent text tags (like `<span>` or `<label>` without `htmlFor`) instead of proper semantic `<label htmlFor="...">` associations, become opaque to screen readers which announce them generically (e.g. as "Color picker" or "Slider"). This is particularly common in compact UI panels like `TextEffectsPanel` and `LayerEffectsPanel`.
**Action:** When working in dense property panels where a `<label htmlFor="id">` is impractical, always apply a context-specific `aria-label` (e.g., `aria-label="Shadow Color"` or `aria-label="Stroke Width"`) directly to the `<input>` element to ensure it is accurately announced by assistive technologies.

## 2026-08-09 - Screen Reader Accessibility for Property Sliders

**Learning:** Native `<input type="range">` elements inside complex property panels (like `MockupControls`) are often visually labeled with generic icons or loosely coupled textual siblings that do not get natively linked via `id`/`htmlFor`. This leaves screen readers to announce them ambiguously.
**Action:** When working in dense property panels where a `<label htmlFor="id">` is impractical, always apply a context-specific `aria-label` (e.g., `aria-label="Curve Intensity"`, `aria-label="Scale"`, or `aria-label="Perspective Skew X"`) directly to the `<input>` element to ensure it is accurately announced by assistive technologies.

## 2026-08-10 - Screen Reader Accessibility for Vector Editing Sliders

**Learning:** Native `<input type="range">` elements used for vector properties (like Simplify Tolerance, Offset Distance, Corner Radius, Rotation, and Scale) inside `VectorEditingPanel` lacked semantic `<label htmlFor>` links, causing them to be announced generically by screen readers.
**Action:** Always include a context-specific `aria-label` attribute on slider inputs inside complex panels to ensure visually impaired users understand what property they are controlling.

## 2024-05-25 - Screen Reader Accessibility for Icon-only Buttons in Asset Grids

**Learning:** When rendering asset cards in dense grids (like favorites or templates), the secondary actions that appear on hover (such as a "Remove" button with only an 'X' icon) are inaccessible to screen readers without a text label or `aria-label`. Because they lack visible text to save space, screen readers will either announce nothing or something unhelpful, leaving visually impaired users unsure what the button does.
**Action:** Always include a context-specific `aria-label` attribute (e.g., `aria-label="Remove from favorites"`) on icon-only buttons, especially in visually dense UI components like asset grids.

## 2024-05-27 - Screen Reader Accessibility for Search Clear Buttons

**Learning:** When using standard icon-only buttons (`<button><Icons.X/></button>`) within input fields to clear the search query, screen readers will read nothing useful (e.g., they might announce the icon component name or just "button").
**Action:** Always include a context-specific `aria-label` attribute (e.g., `aria-label="Clear search"`) on icon-only buttons intended to clear text inputs, ensuring visually impaired users know how to reset their search state.
