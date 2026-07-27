## 2024-05-24 - Screen Reader Accessibility for Range Inputs

**Learning:** Custom slider controls (`<input type="range">`) that lack explicitly linked `<label>` tags (often due to visual space constraints or custom label rendering) are announced simply as "slider" by screen readers, making it impossible for visually impaired users to know what they control.
**Action:** Always include a descriptive `aria-label` attribute (e.g., `aria-label="Curvature"`) directly on the input element when it's not wrapped in a semantic `<label htmlFor="...">` to ensure accessibility.

## 2024-05-25 - Contextual Screen Reader Accessibility for Range Inputs

**Learning:** Adding `aria-label="Slider"` to `<input type="range">` elements is an accessibility anti-pattern. Because the element inherently has the ARIA role of slider, a screen reader will redundantly announce it as "Slider, slider," providing zero context.
**Action:** Always provide descriptive ARIA labels that describe exactly *what* is being adjusted (e.g., "Opacity", "Blur Amount", "Grid Size") when adding labels to range inputs. Avoid using emojis as aria-labels, as they are read literally (e.g., "Triangular ruler") and do not describe the action.
