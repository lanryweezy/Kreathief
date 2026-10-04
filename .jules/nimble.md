## YYYY-MM-DD — [Type 8]: Safe Area and Device-Specific Failures
**Issue:** The app layout uses `h-screen`, `min-h-screen`, and `100vh`, which fail on mobile browsers because they include browser chrome, causing content to be hidden under navigation bars on iOS Safari and Chrome Android.
**Device/browser:** iOS Safari, Chrome Android
**Root cause:** Use of `h-screen`, `min-h-screen` (which map to `100vh` in Tailwind by default without dynamic viewport units) and explicit `100vh` in component files.
**Fix:** Replaced `h-screen` with `h-dvh`, `min-h-screen` with `min-h-dvh`, and `100vh` with `100dvh` globally across the app to dynamically account for mobile browser UI.
**Desktop impact:** None, `100dvh` behaves identically to `100vh` on desktop browsers.
**Watch for:** Make sure modals or fixed elements using viewport heights are also updated to `dvh` units.
