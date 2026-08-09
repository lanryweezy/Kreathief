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
