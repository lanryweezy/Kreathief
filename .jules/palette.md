## 2024-05-24 - Screen Reader Accessibility for Range Inputs

**Learning:** Custom slider controls (`<input type="range">`) that lack explicitly linked `<label>` tags (often due to visual space constraints or custom label rendering) are announced simply as "slider" by screen readers, making it impossible for visually impaired users to know what they control.
**Action:** Always include a descriptive `aria-label` attribute (e.g., `aria-label="Curvature"`) directly on the input element when it's not wrapped in a semantic `<label htmlFor="...">` to ensure accessibility.
## 2024-11-20 - Adding aria-labels to range inputs
**Learning:** Found multiple panels where `<input type="range">` lacked explicitly linked `<label>` tags (e.g. DrawPanel, TexturesPanel, LayersPanel). This pattern is problematic for screen reader accessibility, as it results in the control being announced only as "slider".
**Action:** Consistently added explicit `aria-label` attributes to these custom slider controls ensuring users have context (e.g. "Brush Size", "Material Opacity")
