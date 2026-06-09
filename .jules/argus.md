## 2026-06-09 - Replaced silent catch block in Serverless PDF Export
**Learning:** The Serverless API route in `services/exportService.ts` caught an error with a plain `console.error` instead of structured logger which drops context like requested color profiles and parameters.
**Action:** Add structured `log.error` to include `fileName, options, width, height` on PDF generation fallback
