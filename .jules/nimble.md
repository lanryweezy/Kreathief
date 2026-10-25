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
## 2026-10-18 — Type 2: Touch Target Failure on Toolbar IconButton\n**Issue:** Icon buttons in toolbars (using ToolbarShared.tsx) had touch targets smaller than 44x44px, making them hard to tap on mobile devices.\n**Device/browser:** Mobile (all devices/browsers)\n**Root cause:** Shared `IconButton` component had `p-2` padding with a 16px icon, yielding a total touch target of 32x32px, below the 44px minimum.\n**Fix:** Added `min-w-[44px] min-h-[44px]` to the `IconButton` class list, which symmetrically expands the touch target using flexbox centering without distorting the visual layout.\n**Desktop impact:** Buttons are slightly larger on desktop but remain visually balanced and centered.\n**Watch for:** Ensure this shared change doesn't inadvertently blow out specific dense UI layouts, though flex items should absorb the minimum size gracefully.
## 2026-10-19 — Type 2: Touch Target Failure on Mobile Color Picker & Dialog
**Issue:** The "Recent Colors" grid (`grid-cols-8`) on `MobileColorPicker` forced buttons to squish well below 44px on a 375px mobile screen. Additionally, the confirmation buttons in `MobileToolbar`'s "Clear All" dialog had insufficient vertical touch targets.
**Device/browser:** Mobile viewports (<= 375px)
**Root cause:** Hardcoded dense grid layouts without minimum width constraints for color items, and insufficient vertical padding (`py-2.5`) for text buttons without explicit minimum height constraints.
**Fix:** Switched `MobileColorPicker`'s dense grid to a horizontally scrollable list (`flex overflow-x-auto`) with explicit 48x48px (`w-12 h-12`) targets. Added `min-h-[44px]` to `MobileToolbar`'s dialog buttons.
**Desktop impact:** Confirmed none. Both components are strictly scoped to the mobile viewport.
**Watch for:** Other dense grids (like preset color palettes) mapped directly from desktop configurations that lack responsive reflowing or horizontal scrolling on mobile.
## 2026-10-21 — Type 2: Touch Target Failure on MobileTransformController Delete Button
**Issue:** The 'Delete Layer' button in the `MobileTransformController` had a vertical touch target of less than 44px, making it difficult to tap on mobile viewports.
**Device/browser:** Mobile (all devices/browsers)
**Root cause:** The button had a text size of `text-[10px]` and vertical padding of `py-2` without an explicit minimum height constraint, yielding a touch target smaller than the required 44x44px.
**Fix:** Added `min-h-[44px]` to the 'Delete Layer' button's class list to ensure it explicitly meets the 44px minimum vertical touch target requirement.
**Desktop impact:** None, as `MobileTransformController` is strictly conditionally rendered on mobile viewports (via `md:hidden` and mobile device checks).
**Watch for:** Other conditionally rendered quick action or confirmation buttons (like those inside floating panels or popovers) that might lack explicit 44px minimum touch target dimensions.
## 2026-10-24 — Type 2: Touch Target Failure on Modal & Toast Close Buttons
**Issue:** The close button in generic Modals and dismiss button in Toasts (`ToastContainer`) were significantly smaller than the minimum 44x44px touch target requirement, making it difficult to dismiss them reliably on mobile touchscreens without mistapping.
**Device/browser:** Mobile (all devices/browsers)
**Root cause:** The Modal close button relied on simple `p-1` padding surrounding a 14x14px SVG, yielding a total clickable area of only 22x22px. The Toast dismiss button lacked any explicit padding or minimum size.
**Fix:** Added explicit minimum dimensions `min-w-[44px] min-h-[44px]` along with `flex items-center justify-center` to both the Modal close button and the Toast dismiss button in `DesignSystem.tsx`. This expands the invisible tappable area to 44x44px while keeping the icon itself visually centered and unchanged in size.
**Desktop impact:** None. Since both the Modal header and the Toast container use responsive flexbox layouts that tolerate the slightly wider bounding box of the button, the desktop design remains visually identical and balanced.
**Watch for:** Ensure that adding `flex items-center justify-center` alongside generic `p-1` padding does not inadvertently cause misalignment inside other deeply nested floating UI components that might expect rigid inline-block button behaviors.
