## 2026-07-18 - Illustrator vs Kreathief: Vector PDF Export & Font Embedding

**Gap:** Illustrator exports true vector PDFs with embedded fonts, allowing text to remain sharp at infinite zoom and fully editable/searchable in Acrobat. Kreathief exports a rasterized PNG image wrapped inside a PDF container.
**Root cause:** Laziness in `exportService.ts`. The `exportToPrintPDF` function accepts an `imgDataUrl` (a rasterized screenshot of the canvas) and simply drops it into a PDF. There is no vector data, no text nodes, and therefore no ability to embed fonts.
**Proposal:** Rewrite `exportToPrintPDF` (and the underlying `pdf.worker.ts`) to accept the raw `HistoryState` (or an array of `Layer` objects) rather than a raster image. Use `jsPDF`'s native vector commands (`doc.rect()`, `doc.circle()`, `doc.path()`). For text layers, download the TTF/WOFF font file dynamically, register it via `doc.addFileToVFS()` and `doc.addFont()`, and render it as true text using `doc.text()`. Only rasterize individual image layers.
**Strategic note:** Print professionals cannot use a raster PDF. If a user tries to send a Kreathief PDF to a professional print shop, it will be rejected due to rasterized text. This blocks Kreathief from the entire print design market.

## 2026-07-18 - Figma vs Kreathief: Canvas Panning Performance

**Gap:** Figma renders 10,000 objects at 60fps with buttery-smooth panning. Kreathief drops to laggy frame rates at just 500+ objects when panning.
**Root cause:** Kreathief couples panning/zooming directly to React state (`setPanOffset`), forcing a full Virtual DOM reconciliation of the entire Canvas component tree on every `mousemove` event. Figma uses WebGL matrix transforms.
**Proposal:** Decouple camera from the React render loop. Apply `transform: translate(var(--pan-x), var(--pan-y)) scale(var(--zoom))` to the Canvas wrapper and directly mutate the DOM CSS variables on `mousemove` using `requestAnimationFrame`, committing state to Zustand only on `mouseup`.
**Strategic note:** Speed is a trust signal. If panning feels sluggish with a basic layout, professional users will immediately classify Kreathief as a toy tool and abandon it for Figma.
