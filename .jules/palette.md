## 2024-05-24 - Screen Reader Accessibility for Range Inputs

**Learning:** Custom slider controls (`<input type="range">`) that lack explicitly linked `<label>` tags (often due to visual space constraints or custom label rendering) are announced simply as "slider" by screen readers, making it impossible for visually impaired users to know what they control.
**Action:** Always include a descriptive `aria-label` attribute (e.g., `aria-label="Curvature"`) directly on the input element when it's not wrapped in a semantic `<label htmlFor="...">` to ensure accessibility.
## 2024-05-15 - Redundant ARIA labels
**Learning:** Adding an `aria-label` that is exactly the same as the button text is redundant. Screen readers will read the button text automatically.
**Action:** Only add `aria-label` to buttons when the text content is not descriptive enough, such as icon-only buttons or buttons with vague text.
