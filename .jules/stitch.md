
**Learning:** Found a wired-but-empty UI implementation where a component prop (`effects` on `TextEffectsPanel`) exists and is passed but always receives an empty object `{}`, and the `onChange` prop receives an empty function `() => {}`. This happens in `components/SidePanel.tsx`. The `TextLayer` interface in `types.ts` defines the various text effects properties.
**Action:** When finding incomplete integrations, wire up the component to the state so that the effects are properly read from and written to the selected text layer.
