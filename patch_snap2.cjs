// It says it fails on `tests/unit/aiDesignSystem.test.ts:194:23`.
// If `generateMultiLayerDesign` uses `polishDesignOutput`, then `l.y` MUST be snapped to 4, UNLESS it's mutated *after* `polishDesignOutput`.
// Or maybe `applyAutoLayout` modifies the positions *after* `snapToGrid` is called? Let's check `polishDesignOutput`.
