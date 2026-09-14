// Ah! `fixOverlappingText` might modify `y` and NOT snap it to the grid!
// Wait, looking back at `fixOverlappingText`:
// It had: `yOverrides.set(next.id, { y: currY + Math.max(0, Math.round((currH - textH) / 2)), height: textH });`
// And then: `const adjustedY = snapToGrid(Math.max(20, override.y - compressionShift));`
// So the ones with overrides are snapped!
// BUT if a layer is NOT in `yOverrides` (or not foreground content), it is returned UNCHANGED from `fixOverlappingText`.
// Wait, before `fixOverlappingText`, all layers were snapped.
// So if they are returned unchanged, they should remain snapped.
// What if `applyAutoLayout(layers)` doesn't snap to grid?
