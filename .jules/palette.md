## 2026-06-12 - Form Label Accessibility
**Learning:** Found multiple modals (CreateProjectModal, ExportModal) where `<input>` elements were wrapped by or placed near `<label>` tags without proper `id` and `htmlFor` bindings. This prevents screen readers from correctly associating the descriptive text with the input field and stops users from being able to click the label text to focus the input.
**Action:** Always ensure `<input>` elements have an `id` attribute that exactly matches the `htmlFor` attribute of their descriptive `<label>` tag.
