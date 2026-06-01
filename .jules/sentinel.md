## 2026-05-29 - [Removed Cross-Site Scripting (XSS) Vulnerability in MobilePanelWrapper]
**Vulnerability:** A `dangerouslySetInnerHTML` React attribute was used to inject arbitrary CSS content inline inside `components/MobilePanelWrapper.tsx`.
**Learning:** Hardcoded CSS injected via `dangerouslySetInnerHTML` exposes the React components to Cross-Site Scripting (XSS) vulnerabilities. While in this instance the string was hardcoded, relying on this API increases the risk of accidental string concatenation allowing execution of malicious scripts if user data ever gets evaluated here.
**Prevention:** Always use external standard CSS files like `index.css` to define component styles. React inline styles object `style={{}}` could also be used but global CSS classes keep styling unified and secure without relying on raw DOM mutation via `dangerouslySetInnerHTML`.

## 2026-05-30 - [Replaced Insecure new Function() Math Evaluation]
**Vulnerability:** A `new Function()` constructor was used to dynamically evaluate math expressions in `components/toolbar/ToolbarShared.tsx`.
**Learning:** Using `new Function()` or `eval()` to execute dynamic strings is a severe anti-pattern that violates the 'unsafe-eval' Content Security Policy (CSP). Even with rudimentary regex sanitization (e.g., stripping non-math characters), it exposes the application to potential code injection or application crash vectors and is heavily flagged by automated security scanners.
**Prevention:** Never use `new Function()` or `eval()` for parsing math or logic from strings. Always rely on a dedicated parser or a battle-tested library like `mathjs` which safely evaluates mathematical expressions without invoking the JavaScript runtime compiler.
## 2026-06-01 - Add SSRF Protection to CMYK Export API
**Vulnerability:** The `/api/export-cmyk.ts` endpoint allowed users to supply an arbitrary `imageUrl` via `req.body`, which was fetched directly. This resulted in a Server-Side Request Forgery (SSRF) vulnerability.
**Learning:** External user inputs like URLs should never be blindly passed to server-side `fetch` functions. Attackers can provide internal network ranges (like `169.254.169.254` or `127.0.0.1`) to access cloud metadata APIs or local services.
**Prevention:** Implement strict URL validation: parse the URL using `new URL()`, assert the protocol is `http:` or `https:`, and reject hosts resolving to or matching internal/local IPs, localhost, or `.internal` domains before making outgoing server requests.
