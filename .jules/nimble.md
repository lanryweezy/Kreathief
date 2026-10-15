## 2024-10-11 — Type 2: Touch Target Failure: MobileTransformController D-Pad Buttons
**Issue:** The directional d-pad buttons and nudge multiplier toggles (`x10`, `x1`) in the mobile layout for element transformation were explicitly sized to 40x40px or smaller, violating the minimum 44x44px touch target requirement.
**Device/browser:** Simulated iPhone 11 (375x812), all mobile viewports.
**Root cause:** Components in `MobileTransformController.tsx` used fixed sizes `w-10 h-10` and smaller default flex sizing for multipliers, which lacked the guaranteed 44x44px dimensions.
**Fix:** Increased padding and min-width/height sizes. The primary d-pad buttons were bumped from `w-10 h-10` to `w-11 h-11` (44x44px) and multiplier buttons were given `min-w-[44px] h-11`.
**Desktop impact:** Confirmed none, as `MobileTransformController` is strictly rendered on mobile breakpoints or environments flagged as mobile.
**Watch for:** Other toolbar and transformation controls rendered conditionally inside panels that might have hard-coded touch targets beneath the 44px threshold.

## 2026-10-15 — Type 7: Mobile-Specific Layout Adaptation and Touch Targets
**Issue:** `h-screen` causing layout issues and various touch targets (close buttons, visibility toggles) under 44px
**Device/browser:** Chrome Android, iOS Safari
**Root cause:** Hardcoded `vh` and `h-screen` units ignore mobile browser chrome (address bar), and padding-based buttons do not guarantee the 44px mobile requirement.
**Fix:** Changed `h-screen` to `h-dvh` across layouts and replaced `p-2` with `min-w-[44px] min-h-[44px] flex items-center justify-center`.
**Desktop impact:** No desktop impact; `dvh` functions identically to `vh` on desktop and explicit sizing does not affect desktop layout.
**Watch for:** Other `vh` usages or generic `p-2` on newly added components.
