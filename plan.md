## Issue Analysis

The `TextLayer` has a property `textTransform` which can be `'none' | 'uppercase' | 'lowercase'`.
In the canvas editor (`components/canvas/LayerItems.tsx`), `textTransform: textLayer.textTransform` is applied as an inline style to the `contentEditable` div.
However, in `utils/textRendering.ts`, `textTransform` is completely ignored during rendering (`renderMultilineText`, `renderTextOnPath`, `renderWarpedText`, `convertTextToOutlines`). This means exported text, thumbnail text, etc., will not have the transformation applied, leading to a visual inconsistency between the editor and exports.

## Plan

1.  **Extract `textTransform` applying function:**
    Create a helper function `applyTextTransform(text: string, transform?: 'none' | 'uppercase' | 'lowercase'): string` in `utils/textRendering.ts`.
2.  **Apply `textTransform` in `renderMultilineText`:**
    Call `applyTextTransform` on the `layer.text` before splitting into lines and wrapping.
3.  **Apply `textTransform` in `renderTextOnPath`:**
    Call `applyTextTransform` on `layer.text`.
4.  **Apply `textTransform` in `renderWarpedText`:**
    Call `applyTextTransform` on `layer.text`.
5.  **Apply `textTransform` in `convertTextToOutlines`:**
    Call `applyTextTransform` on `layer.text`.
6.  **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
7.  **Submit the change.**
