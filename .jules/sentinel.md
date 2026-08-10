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

## 2026-06-03 - [Replaced Predictable ID Generation using Math.random()]

**Vulnerability:** Weak PRNG `Math.random()` was used to generate security-sensitive identifiers, such as Share Links in `services/shareService.ts` and Guest User IDs in `App.tsx`.
**Learning:** `Math.random()` is not cryptographically secure and can be easily predicted, potentially leading to Insecure Direct Object Reference (IDOR) or unauthorized access if an attacker predicts a session or share link ID.
**Prevention:** Always use `crypto.randomUUID()` (or `crypto.getRandomValues()`) when generating unique identifiers, especially for resources like sharing URLs, session IDs, or guest accounts to ensure unguessability and avoid ID collisions.

## 2026-06-02 - Replace Math.random with Secure ID Generation

**Vulnerability:** Weak random number generation (`Math.random()`) was used extensively throughout the codebase to generate unique identifiers, including sensitive ones like share links and guest IDs. `Math.random()` is not cryptographically secure, leading to predictable IDs that could potentially be brute-forced or result in collisions.
**Learning:** Using `Math.random()` for any form of unique identification or token generation, especially those that might be exposed publicly (like a share ID), violates secure coding practices. Even if the ID is only used internally, relying on `Math.random()` sets a bad precedent and flags static analysis tools.
**Prevention:** Always use `crypto.randomUUID()` for generating universally unique identifiers. When a shorter or specific format string is required, use `crypto.getRandomValues()` to extract cryptographically secure entropy and format it accordingly.

## 2026-06-04 - [Prevent Error Information Leakage in API Endpoints]\n**Vulnerability:** The API endpoints `api/gemini.ts` and `api/export-cmyk.ts` directly returned `error.message` within their 500 status HTTP JSON responses upon catching errors.\n**Learning:** Returning raw system error messages directly to the client can inadvertently expose sensitive implementation details, stack traces, or environment paths. This information leakage can be leveraged by attackers to better understand the system architecture and discover further vulnerabilities.\n**Prevention:** Catch blocks in API routes should log the detailed `error` internally (e.g., using `console.error` or a secure logging service) but always return generic error messages (like `'Internal server error'`) in HTTP responses sent to users.

## 2026-06-05 - [Removed Exposed Secrets in Vite Client Build]

**Vulnerability:** In `vite.config.ts`, the `define` property was mapping `process.env.API_KEY` to `env.GEMINI_API_KEY`. This explicitly exposes server-side secrets (like Gemini API keys) into the client-side JavaScript bundle, allowing any user to extract the secrets by inspecting the source code.
**Learning:** The `define` configuration in Vite performs static replacement during the build process. Passing sensitive environment variables here bundles them directly into the frontend code. If you must avoid `ReferenceError`s due to legacy `process.env` calls in the client, you must nullify them with safe values like `JSON.stringify('')` instead of passing actual secrets.
**Prevention:** Never use Vite's `define` block to map server-side secrets to global variables. Rely on Vite's standard `import.meta.env.VITE_*` mechanism for client-safe variables, and keep server secrets strictly in the Node/server environment.

## 2026-06-06 - Add CSP and X-Frame-Options Security Headers\n**Vulnerability:** The application lacked (CSP) and headers, making it more vulnerable to Cross-Site Scripting (XSS) and Clickjacking attacks when deployed.\n**Learning:** In Vercel deployments, security headers must be explicitly defined in the configuration file, otherwise the application defaults to having no protective headers. Without these headers, an attacker could potentially embed the application in an iframe (clickjacking) or execute unauthorized scripts if an XSS vulnerability exists.\n**Prevention:** Always ensure that and (or ) are configured in the deployment platform's settings (e.g., for Vercel, for Next.js) to provide defense-in-depth against client-side attacks.

## 2026-06-06 - Add CSP and X-Frame-Options Security Headers

**Vulnerability:** The application lacked `Content-Security-Policy` (CSP) and `X-Frame-Options` headers, making it more vulnerable to Cross-Site Scripting (XSS) and Clickjacking attacks when deployed.
**Learning:** In Vercel deployments, security headers must be explicitly defined in the `vercel.json` configuration file, otherwise the application defaults to having no protective headers. Without these headers, an attacker could potentially embed the application in an iframe (clickjacking) or execute unauthorized scripts if an XSS vulnerability exists.
**Prevention:** Always ensure that `Content-Security-Policy` and `X-Frame-Options: DENY` (or `SAMEORIGIN`) are configured in the deployment platform's settings (e.g., `vercel.json` for Vercel, `next.config.js` for Next.js) to provide defense-in-depth against client-side attacks.

## 2026-06-07 - Add Rate Limiting to Heavy API Endpoints

**Vulnerability:** The `api/export-cmyk.ts` endpoint performs heavy image processing (fetching, decoding, and converting to CMYK PDF) but lacked rate limiting, exposing the application to potential Denial of Service (DoS) attacks from repeated requests.
**Learning:** Computationally expensive endpoints must always have rate limits applied to prevent malicious or accidental abuse that could exhaust server resources and block legitimate users.
**Prevention:** Implement rate limiting (e.g., using an in-memory Map for serverless functions or Redis for distributed systems) on all endpoints that perform heavy CPU or I/O tasks.

## 2026-06-07 - [Removed Client-Side Exposure of Gemini API Key in Fallback Logic]

**Vulnerability:** A fallback mechanism in `services/geminiService.ts` explicitly accessed `import.meta.env.VITE_GEMINI_API_KEY` to directly initialize the Gemini SDK in the browser when the backend proxy failed.
**Learning:** Hardcoding or conditionally falling back to client-side SDK initialization using environment variables prefixed with `VITE_` forces the bundler to include sensitive API keys in the client-side JavaScript. This allows malicious actors to easily extract the API key and abuse the service at the application's expense.
**Prevention:** Always route external API requests requiring secret keys through a server-side proxy or serverless function. Remove any client-side fallback logic that requires the frontend code to possess or access the secret key directly.
\n## 2026-06-07 - [Removed Client-Side Exposure of Vecteezy API Secret Key]\n**Vulnerability:** The application was fetching `import.meta.env.VITE_VECTEEZY_SECRET_KEY` on the client-side within `services/vecteezyService.ts`, directly exposing a secret API key to users via the compiled frontend bundle.\n**Learning:** In Vite, any environment variable prefixed with `VITE_` is statically injected into the client bundle at build time. Secret keys or tokens for backend services should never use this prefix if they are imported directly in client code.\n**Prevention:** If an external service requires a secret API key, implement a server-side proxy route (e.g., an Edge Function like `api/vecteezy.ts`) to handle the requests securely. The client should only interact with this proxy, and the secret key should be safely stored in the server's environment without the `VITE_` prefix.

## 2026-06-08 - [Removed Client-Side Exposure of Fal.ai API Secret Key]

**Vulnerability:** The application was fetching `import.meta.env.VITE_FAL_KEY` on the client-side within `services/aiModelsService.ts`, directly exposing a secret API key to users via the compiled frontend bundle.
**Learning:** In Vite, any environment variable prefixed with `VITE_` is statically injected into the client bundle at build time. Secret keys or tokens for backend services should never use this prefix if they are imported directly in client code.
**Prevention:** If an external service requires a secret API key, implement a server-side proxy route (e.g., an Edge Function like `api/fal.ts`) to handle the requests securely. The client should only interact with this proxy, and the secret key should be safely stored in the server's environment without the `VITE_` prefix.

## 2026-06-08 - Add Rate Limiting Memory Leak Cleanup to All Endpoints

**Vulnerability:** Several Serverless/Edge functions (`api/fal.ts`, `api/gemini.ts`, `api/vecteezy.ts`) used an in-memory `Map` to track client IPs for rate-limiting. However, unlike `export-cmyk.ts`, these endpoints did not implement a mechanism to periodically delete expired IP entries. Over time, this `rateLimitMap` would grow indefinitely with new IPs, resulting in a severe memory leak and eventual memory exhaustion Denial of Service (DoS).
**Learning:** Server-side in-memory data structures (e.g., using `Map` to track IP requests for rate limiting) must implement periodic cleanup of expired entries to prevent memory exhaustion Denial of Service (DoS) vulnerabilities. Unbounded state variables in long-running or warm lambda environments are a silent killer.
**Prevention:** Whenever using in-memory caches or state maps in backend functions, always implement and execute a garbage collection/cleanup routine to purge old entries, or alternatively use a robust distributed store like Redis with automatic TTLs.

## 2026-06-10 - Add Rate Limiting Memory Leak Cleanup to Remaining Endpoints

**Vulnerability:** Several Serverless/Edge functions (`api/freepik.ts`, `api/iconscout.ts`, `api/streamline.ts`, `api/unsplash.ts`) used an in-memory `Map` to track client IPs for rate-limiting. However, these endpoints did not implement a mechanism to periodically delete expired IP entries. Over time, this `rateLimitMap` would grow indefinitely with new IPs, resulting in a severe memory leak and eventual memory exhaustion Denial of Service (DoS).
**Learning:** Server-side in-memory data structures (e.g., using `Map` to track IP requests for rate limiting) must implement periodic cleanup of expired entries to prevent memory exhaustion Denial of Service (DoS) vulnerabilities. Unbounded state variables in long-running or warm lambda environments are a silent killer.
**Prevention:** Whenever using in-memory caches or state maps in backend functions, always implement and execute a garbage collection/cleanup routine to purge old entries, or alternatively use a robust distributed store like Redis with automatic TTLs.

## 2026-06-11 - [Removed Client-Side Exposure of Dynamic Mockups API Key]

**Vulnerability:** The application was loading `import.meta.env.VITE_DYNAMIC_MOCKUPS_API_KEY` into `config/index.ts` and passing it to the client-side `services/dynamicMockupsService.ts`, directly exposing a secret API key to users via the compiled frontend bundle.
**Learning:** In Vite, any environment variable prefixed with `VITE_` is statically injected into the client bundle at build time. Secret keys or tokens for backend services should never use this prefix if they are imported directly in client code.
**Prevention:** If an external service requires a secret API key, implement a server-side proxy route (e.g., an Edge Function like `api/dynamic-mockups.ts`) to handle the requests securely. The client should only interact with this proxy, and the secret key should be safely stored in the server's environment without the `VITE_` prefix.

## 2026-06-11 - Add Security Event Logging

**Vulnerability:** The application was missing security event logging for critical authentication events and data export events as recommended by the `AUDIT_SECURITY_COMPLIANCE.md` (P1 Priority). Lacking audit trails makes tracking and identifying compromised accounts or large-scale data breaches difficult.
**Learning:** For a system processing user data and authenticating users, establishing an audit trail is critical to trace back "who did what and when."
**Prevention:** Always log authentication attempts (success and failures) and critical data export/modification events securely (e.g. into `security_logs` table) to maintain an auditable footprint.

## 2026-06-12 - Fix Path Traversal Vulnerability in Freepik API Proxy

**Vulnerability:** The `api/freepik.ts` serverless edge function constructed a backend API request dynamically by appending user input (`url.searchParams.get('basePath')`) directly to the base URL in the `poll` action. This allowed a potential path traversal vulnerability where an attacker could provide arbitrary paths (like `../../some-other-endpoint`) to interact with unintended endpoints within the Freepik API under the application's authenticated context.
**Learning:** Avoid path traversal vulnerabilities by never appending untrusted user input directly to URLs or file paths. When dynamically routing requests based on user input, rely on explicit allowlists rather than attempting to sanitize paths.
**Prevention:** Always strictly validate or allowlist dynamic path segments from user input before constructing or appending them to base URLs or filesystem paths.

## 2026-06-12 - Prevent Path Traversal in Freepik API Proxy

**Vulnerability:** The `api/freepik.ts` endpoint allowed users to supply an arbitrary `basePath` via URL parameters in the `poll` action, which was then directly concatenated into the upstream API URL. This resulted in a path traversal vulnerability that could allow an attacker to make unauthorized requests to any Freepik API endpoint using the server's securely stored API key.
**Learning:** Dynamically constructing proxy request URLs from user input without validation allows attackers to bypass intended restrictions and access arbitrary endpoints on the target service, effectively turning the proxy into an open gateway for the provided service.
**Prevention:** Always use a strict allowlist for dynamic path segments when constructing URLs for downstream API requests to ensure users can only access explicitly permitted endpoints.

## 2026-06-12 - Prevent Backend Secret Leakage by Removing VITE\_ Prefix Fallbacks

**Vulnerability:** Several serverless proxy endpoints (`api/fal.ts`, `api/freepik.ts`, `api/iconscout.ts`, `api/streamline.ts`, `api/unsplash.ts`) used a fallback pattern of `process.env.VITE_API_KEY || process.env.API_KEY` for sensitive API secrets.
**Learning:** If a developer places a sensitive backend secret in their `.env` file using the `VITE_` prefix to satisfy the fallback, the Vite bundler will statically inject that secret into the client-side JavaScript bundle, resulting in a critical secret leakage vulnerability.
**Prevention:** Backend API proxy functions must exclusively rely on non-prefixed environment variables (e.g., `process.env.API_KEY`) for sensitive credentials. Removing the `VITE_` prefix fallbacks forces the correct configuration and inherently protects against bundler injection.

## 2026-06-13 - Prevent Path Traversal and Parameter Injection in API Proxies

**Vulnerability:** The API proxies for third-party services (`api/freepik.ts`, `api/iconscout.ts`, `api/streamline.ts`, `api/unsplash.ts`, `api/vecteezy.ts`) appended user-supplied URL query parameters (like `page`, `type`, `resourceId`, `uuid`, `hash`) directly into outgoing upstream HTTP requests. This created a parameter injection vulnerability where an attacker could inject `&` to override upstream API parameters, and a path traversal vulnerability where an attacker could use `../` to access unintended upstream endpoints under the server authenticated context.
**Learning:** Unsanitized user inputs placed directly into upstream URL paths or query strings allow attackers to manipulate the backend request structure. This can bypass rate limits, access hidden data, or hijack the server API quotas.
**Prevention:** Always use `encodeURIComponent()` when dynamically constructing URLs using user-provided input to ensure special characters like `&`, `=`, `/`, and `?` are safely encoded as literal string values.

## 2026-06-14 - Fix Path Traversal in Freepik API Proxy

**Vulnerability:** The `api/freepik.ts` endpoint constructed a proxy request URL using the `taskId` parameter directly from user input without URL encoding in the `poll` action. This allowed for a potential path traversal vulnerability where an attacker could provide an arbitrary path to access unintended Freepik API endpoints using the server's securely stored API key.
**Learning:** Even when the base path is allowlisted, failing to encode subsequent path segments derived from user input still leaves the proxy vulnerable to path traversal attacks (e.g., `123/../../other-endpoint`).
**Prevention:** Always apply `encodeURIComponent()` to any user-provided string that is injected into a URL path or query parameter, ensuring the browser treats the input as literal data rather than structural URL syntax.

## 2026-06-17 - Prevent Backend Secret Leakage by Removing VITE\_ Prefix for Vecteezy API

**Vulnerability:** The serverless proxy endpoint `api/vecteezy.ts` explicitly accessed backend secrets using `process.env.VITE_VECTEEZY_ACCOUNT_ID` and `process.env.VITE_VECTEEZY_SECRET_KEY`.
**Learning:** If a developer places a sensitive backend secret in their `.env` file using the `VITE_` prefix as requested by the server logic, the Vite bundler will statically inject that secret into the client-side JavaScript bundle, resulting in a critical secret leakage vulnerability.
**Prevention:** Backend API proxy functions must exclusively rely on non-prefixed environment variables (e.g., `process.env.VECTEEZY_ACCOUNT_ID`) for sensitive credentials. Removing the `VITE_` prefixes forces the correct configuration and inherently protects against bundler injection.

## 2026-06-21 - Removed Client-Side Exposure of External API Keys

**Vulnerability:** The application was loading `import.meta.env.VITE_UNSPLASH_ACCESS_KEY`, `VITE_STREAMLINE_API_KEY`, `VITE_FREEPIK_API_KEY`, `VITE_VECTEEZY_API_KEY`, and `VITE_ICONSCOUT_CLIENT_ID`/`SECRET_KEY` into `config/index.ts`'s `apis` object, exposing these backend secret keys to users via the compiled frontend bundle if developers used the `VITE_` prefix.
**Learning:** In Vite, any environment variable prefixed with `VITE_` is statically injected into the client bundle at build time. Since external API proxies (`api/unsplash.ts`, etc.) already load these via non-prefixed `process.env` variables securely, storing them in the client `config` was unnecessary and dangerous.
**Prevention:** Remove all client-side configuration objects that map backend secrets to `VITE_` prefixed variables. Frontend code should only need the proxy endpoints, not the API keys themselves.

## 2026-06-21 - Restrict CORS Origins in Edge API Functions

**Vulnerability:** Almost all Edge API functions in the `api/` directory (e.g., `iconscout.ts`, `freepik.ts`, `export-cmyk.ts`, `unsplash.ts`, `gemini.ts`, `streamline.ts`, `dynamic-mockups.ts`, `error-log.ts`, `config.ts`, `vecteezy.ts`) were configured with overly permissive CORS headers (`Access-Control-Allow-Origin: *`). This allowed any arbitrary domain to make cross-origin requests to the application's backend proxies.
**Learning:** Using a wildcard `*` for the `Access-Control-Allow-Origin` header in authenticated or sensitive proxy endpoints exposes the backend to Cross-Origin Resource Sharing vulnerabilities, potentially allowing malicious sites to exploit the proxy or leak data if combined with other vulnerabilities.
**Prevention:** Always restrict the `Access-Control-Allow-Origin` header to the explicit frontend domain URL (e.g., `process.env.VITE_FRONTEND_URL`) instead of a wildcard `*` to ensure that only the trusted frontend application can consume the APIs.

## 2026-06-26 - Prevent PostgREST Filter Injection

**Vulnerability:** In Supabase/PostgREST queries, user input (like search `query`) was directly interpolated into the `.or()` filter string (e.g., `.or(\`name.ilike.%${query}%\`)`). If an attacker provided a query containing a comma `,`(the PostgREST OR separator) and a quote`"`, they could inject arbitrary filter conditions, such as `,status.eq.rejected`, potentially bypassing authorization checks or leaking hidden database rows.
**Learning:** Using raw string interpolation for the `.or()`method in`supabase-js`without escaping or sanitizing commas and double quotes creates a high-severity filter injection vulnerability, as the comma acts as a logical operator separator.
**Prevention:** To prevent PostgREST/Supabase filter injection vulnerabilities, always sanitize user inputs by stripping commas and quotes (e.g.,`query.replace(/[",]/g, '')`) before interpolating them into a Supabase `.or()` filter string, or use the object syntax if available.

## 2026-06-28 - [Fix PostgREST Filter Injection in Asset Service]

**Vulnerability:** The `services/assetService.ts` explicitly interpolated an unsanitized search `query` into a Supabase `.or()` condition, allowing filter injection via commas and quotes.
**Learning:** Using raw string interpolation for the `.or()` method in `supabase-js` without escaping or sanitizing commas and double quotes creates a high-severity filter injection vulnerability, as the comma acts as a logical operator separator.

## 2026-06-28 - [Fix PostgREST Filter Injection in Asset Service]

**Vulnerability:** The `services/assetService.ts` explicitly interpolated an unsanitized search `query` into a Supabase `.or()` condition, allowing filter injection via commas and quotes.
**Learning:** Using raw string interpolation for the `.or()` method in `supabase-js` without escaping or sanitizing commas and double quotes creates a high-severity filter injection vulnerability, as the comma acts as a logical operator separator.
**Prevention:** Always sanitize user inputs by stripping commas and quotes (e.g., `query.replace(/[",]/g, '')`) before interpolating them into a Supabase `.or()` filter string, or use the object syntax if available.

## 2026-07-04 - Fix SSRF and DNS Rebinding Bypass in CMYK Export

**Vulnerability:** The `api/export-cmyk.ts` endpoint included basic SSRF protection by checking the requested hostname against a static blocklist of strings like 'localhost' and '127.0.0.1'. This approach is heavily flawed as it does not prevent bypasses such as IPv6 representations (`[::1]`), or DNS rebinding (pointing a custom, benign-looking domain to `127.0.0.1` or internal IP addresses), allowing an attacker to fetch internal services via the API.
**Learning:** Static string matching of URLs for SSRF protection is insufficient. Attackers can always obfuscate localhost representations or use DNS rebinding. To mitigate this effectively, the server must resolve the hostname's IP addresses and validate that none of the resolved IPs fall within the private, loopback, or reserved IP address blocks before proceeding with the fetch.
**Prevention:** Use Node.js's native `dns.promises.lookup` to retrieve the IP address for the hostname derived from the untrusted URL. Check the resulting IP address string to ensure it does not start with `127.`, `10.`, `192.168.`, `169.254.` or match the `172.16.0.0/12` block. For IPv6, check against `::1`, `::`, `fc00:`, `fd00:`, `fe80:`, and IPv4-mapped IPv6 formats before initiating an HTTP request.

## 2026-07-15 - Prevent SSRF TOCTOU / DNS Rebinding in CMYK Export API

**Vulnerability:** The `api/export-cmyk.ts` endpoint included basic SSRF protection by resolving the hostname of the provided `imageUrl` and checking against a blocklist of private IPs. However, it still used the original `imageUrl` for the subsequent `fetch()` call. This pattern is vulnerable to Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks, where the DNS record changes between the validation step and the actual fetch, potentially pointing to an internal IP.
**Learning:** Performing a DNS lookup to validate an IP is insufficient if the subsequent HTTP request relies on a separate DNS resolution (which `fetch` does natively). The IP validated must be the exact IP used for the connection.
**Prevention:** When validating URLs against SSRF, resolve the hostname to an IP address, validate that specific IP, and then explicitly use that validated IP in the actual HTTP request URL (e.g., `http://<safe_ip>/path`). Ensure you manually set the `Host` header to the original hostname so the upstream server routes the request correctly (Server Name Indication / Virtual Hosting).

## 2026-07-15 - Fix SSRF IPv6 Loopback Bypass in CMYK Export API

**Vulnerability:** The `api/export-cmyk.ts` endpoint included basic SSRF protection by checking the requested hostname against a blocklist of private IPs. However, its IPv6 loopback check only strictly matched `::1` or `::`. This allowed attackers to bypass the blocklist by using alternative valid representations of the IPv6 loopback address (e.g., `0:0:0:0:0:0:0:1` or `0000:0000:0000:0000:0000:0000:0000:0001`).
**Learning:** String equality checks for IPv6 addresses are insufficient due to the multiple valid string representations of the same address (zero compression, leading zero omission).
**Prevention:** When validating IPv6 addresses against a blocklist, either use a robust IP parsing library that normalizes the address to its canonical form before comparison, or use comprehensive regular expressions that account for zero compression and expansion (e.g., `/^0*:0*:0*:0*:0*:0*:0*:1$/`).

## 2026-07-16 - Prevent SSRF TOCTOU / DNS Rebinding in CMYK Export API

**Vulnerability:** The `api/export-cmyk.ts` endpoint included basic SSRF protection by resolving the hostname of the provided `imageUrl` and checking against a blocklist of private IPs. However, it still used the original `imageUrl` for the subsequent `fetch()` call. This pattern is vulnerable to Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks, where the DNS record changes between the validation step and the actual fetch, potentially pointing to an internal IP.
**Learning:** Performing a DNS lookup to validate an IP is insufficient if the subsequent HTTP request relies on a separate DNS resolution (which `fetch` does natively). The IP validated must be the exact IP used for the connection.
**Prevention:** When validating URLs against SSRF, resolve the hostname to an IP address, validate that specific IP, and then explicitly use that validated IP in the actual HTTP request URL (e.g., `http://<safe_ip>/path`). Ensure you manually set the `Host` header to the original hostname so the upstream server routes the request correctly (Server Name Indication / Virtual Hosting).

## 2026-07-16 - Removed Client-Side Exposure of GetIllustration API Key

**Vulnerability:** The application was fetching `import.meta.env.VITE_GETILLUSTRATION_KEY` on the client-side within `services/getillustrationService.ts`, directly exposing a secret API key to users via the compiled frontend bundle.
**Learning:** In Vite, any environment variable prefixed with `VITE_` is statically injected into the client bundle at build time. Secret keys or tokens for backend services should never use this prefix if they are imported directly in client code.
**Prevention:** If an external service requires a secret API key, implement a server-side proxy route (e.g., an Edge Function like `api/getillustration.ts`) to handle the requests securely. The client should only interact with this proxy, and the secret key should be safely stored in the server's environment without the `VITE_` prefix.

## 2026-07-20 - Missing Authentication on AI API Proxy Endpoints

**Vulnerability:** The AI proxy endpoints (`api/gemini.ts`, `api/openrouter.ts`, `api/fal.ts`) had their `requireAuth` check commented out, leaving these endpoints entirely unauthenticated.
**Learning:** Removing authentication checks from backend proxy endpoints—even temporarily "for a build fix"—exposes the backend's secret API keys to unauthenticated public access, essentially turning the server into an open proxy for expensive third-party AI APIs. This leads directly to quota exhaustion and financial loss.
**Prevention:** Never remove or comment out authentication layers on proxy endpoints that utilize secure backend secrets. If the build or tests are failing due to auth, mock the authentication in tests or fix the calling client to provide the correct token, rather than lowering security on the server.

## 2026-07-21 - Missing Authentication on Third-Party Proxy Endpoints

**Vulnerability:** The proxy endpoint `api/dynamic-mockups.ts` was missing an authentication check (`requireAuth`), leaving the endpoint unauthenticated.
**Learning:** Removing or omitting authentication checks from backend proxy endpoints exposes backend secret API keys (e.g., `DYNAMIC_MOCKUPS_API_KEY`) to unauthenticated public access. This turns the server into an open proxy for expensive third-party APIs, leading to quota exhaustion and financial loss.
**Prevention:** Never omit authentication layers on proxy endpoints that utilize secure backend secrets. Always ensure that `requireAuth` (or equivalent middleware) protects all endpoints interacting with external API keys.

## 2026-07-19 - Prevent Crashes from Thrown Non-Response Errors in API Auth

**Vulnerability:** The API proxy endpoints using `requireAuth` (like `api/freepik.ts`) had a `try/catch` block that caught any thrown exception and blindly cast and returned it as a `Response` object (`return response as Response;`).
**Learning:** In JavaScript/TypeScript, caught exceptions are of type `unknown` or `any`. If `requireAuth(req)` throws a standard `Error` (e.g., due to a database/network failure, a missing environment variable, or an internal bug), the code attempts to return that `Error` object directly. The Edge runtime expects a valid HTTP `Response` instance; returning an `Error` object results in a runtime crash or an improper response format, potentially leading to a 500 Internal Server Error without a clean fallback.
**Prevention:** Proper handling requires checking if the caught error is an `instanceof Response`, and if not, falling back to returning a generic 500 `Response`, e.g.: `if (error instanceof Response) return error; return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });`

## 2026-07-21 - Missing Authentication on Freepik API Proxy

**Vulnerability:** The AI proxy endpoint for freepik (`api/freepik.ts`) did not have the `requireAuth` check, leaving it entirely unauthenticated.
**Learning:** Removing authentication checks from backend proxy endpoints—even temporarily "for a build fix"—exposes the backend's secret API keys to unauthenticated public access. This leads directly to quota exhaustion and financial loss.
**Prevention:** Never remove or comment out authentication layers on proxy endpoints that utilize secure backend secrets.

## 2026-07-22 - Strengthened Share Link ID Generation to Prevent IDOR

**Vulnerability:** In `services/shareService.ts`, the `generateId` method was creating 8-character base36 strings for share link identifiers using `crypto.getRandomValues(new Uint8Array(6))`. While using cryptographically secure random values is good, 8 characters of base36 only provides ~41 bits of entropy (36^8 combinations). This makes the share links susceptible to offline generation analysis and brute-force IDOR (Insecure Direct Object Reference) attacks, allowing unauthorized users to discover and access private shared designs.
**Learning:** For public-facing, unguessable identifiers (like share links, password reset tokens, or invite codes), short alphanumeric strings do not provide sufficient entropy against modern brute-force capabilities. The convenience of a short URL should not override the security requirement of true unguessability.
**Prevention:** Always use `crypto.randomUUID()` (which provides 122 bits of entropy) for generating secure, universally unique identifiers that act as access tokens or unauthenticated reference keys.

## 2026-07-22 - Fix Insecure Pseudo-Random Number Generation for IDs
**Vulnerability:** The `src/components/Canvas.tsx` component used `Math.random()` combined with `Date.now()` to generate unique IDs for canvas nodes. This approach is not cryptographically secure and could lead to ID collisions, which can cause state corruption or React reconciliation failures.
**Learning:** Insecure pseudo-random number generators like `Math.random()` should not be used for generating unique identifiers where collisions can lead to unpredictable application state, especially during rapid node creations.
**Prevention:** Always use `crypto.randomUUID()` (which provides 122 bits of entropy) for generating secure, universally unique identifiers that act as access tokens or unauthenticated reference keys.

## 2026-07-23 - Restrict CORS Origins Fallback in Edge API Functions

**Vulnerability:** The `api/getillustration.ts` edge function used an overly permissive CORS fallback (`process.env.VITE_FRONTEND_URL || '*'`). If the environment variable was missing or misconfigured, it fell back to allowing any domain to make cross-origin requests to the application's backend proxy.
**Learning:** Using a wildcard `*` as a fallback for the `Access-Control-Allow-Origin` header in authenticated or sensitive proxy endpoints exposes the backend to Cross-Origin Resource Sharing vulnerabilities in the event of environment misconfiguration, potentially allowing malicious sites to exploit the proxy or leak data.
**Prevention:** Never use a wildcard `*` fallback for `Access-Control-Allow-Origin`. Always strictly check if the required origin environment variable is set. If it is missing, fail securely by returning a `500 Server misconfigured` error rather than lowering security requirements.

## 2026-07-22 - Secure CORS and Error Handling in Icon API Routes
**Vulnerability:** Icon API endpoints (`api/lucideIcons.ts`, `api/materialIcons.ts`, `api/phosphorIcons.ts`) fell back to a wildcard `*` origin if `VITE_FRONTEND_URL` was missing. Additionally, non-Response errors thrown during `requireAuth` were unsafely cast and returned as HTTP Responses, potentially leading to server crashes or information leakage.
**Learning:** Relying on permissive CORS wildcards as fallbacks defeats cross-origin protections in misconfigured environments. Blindly casting caught errors as Responses in edge functions can expose internal errors or crash the runtime.
**Prevention:** Always restrict CORS to explicit origins and fail securely (e.g., return a 500 status) if required origin environment variables are missing. Safely check `if (error instanceof Response)` in authentication catch blocks, returning generic 500 errors for all other exception types.

## 2026-07-26 - Missing Authentication Check in Streamline API Edge Route
**Vulnerability:** The `api/streamline.ts` edge route was missing the `requireAuth` check, allowing unauthorized access to the paid Streamline API using the application's server API key.
**Learning:** Edge functions acting as proxies to third-party APIs can be easily overlooked when enforcing global authentication checks. Missing `requireAuth` enables abuse of paid resources, leading to financial impact.
**Prevention:** Always ensure that all edge API routes serving as proxies to third-party services include the `await requireAuth(req)` check in a `try/catch` block, immediately after the CORS `OPTIONS` preflight handler.

## 2026-08-01 - Prevent Crashes and API Key Exposure in Tenor Proxy Route

**Vulnerability:**
1. In `api/tenor.ts`, the `requireAuth` block unsafely caught all thrown errors and cast them to `Response`, which caused the edge function to crash or leak data if standard `Error` objects were thrown instead of HTTP responses.
2. The proxy also used a fallback to `process.env.VITE_TENOR_API_KEY`. As a Vite frontend application, variables prefixed with `VITE_` are statically injected into the client bundle at build time, directly exposing this backend secret API key to users via the compiled frontend code if it were configured using the `VITE_` prefix.

**Learning:**
1. Blindly casting caught errors as `Response` in Edge APIs violates TypeScript safety and can lead to unhandled server crashes when utility functions throw native errors instead of returning error responses.
2. Relying on `VITE_` prefixed environment variables for backend API keys creates a severe risk of secret exposure. A developer fulfilling the fallback could unintentionally leak the secret to the public bundle.

**Prevention:**
1. Always securely check if an error is an HTTP response (`if (error instanceof Response) return error;`) and return a generic 500 error structure otherwise.
2. Never prefix backend secrets with `VITE_`. Strict usage of purely server-side environment variables (`TENOR_API_KEY`) is mandatory to prevent accidental client-side injection.
## 2024-03-20 - [Removed Stack Trace Leak in ErrorFallback UI]
**Vulnerability:** The application was directly rendering `error.stack` inside `components/ErrorFallback.tsx` when catching unexpected React component errors.
**Learning:** Displaying raw stack traces in the user interface (Information Exposure) can inadvertently leak sensitive system paths, file structures, library versions, or other implementation details. This gives attackers deep insight into the application's architecture which could be used to exploit other vulnerabilities.
**Prevention:** Never render `error.stack` directly to users in error boundaries, fallback UIs, or API responses. Catch blocks and error components should log the detailed error (including stack traces) securely internally (e.g., via Sentry or a secure logging service) but present only a generic, safe error message to the user.
## 2026-08-05 - Missing Authentication on CMYK Export API Proxy

**Vulnerability:** The `api/export-cmyk.ts` endpoint did not have the `requireAuth` check, leaving it entirely unauthenticated. It allowed arbitrary users to consume expensive image processing operations without an active session.
**Learning:** Removing authentication checks from backend proxy endpoints exposes the backend's resources and functions to unauthenticated public access. This leads directly to quota exhaustion and Denial-of-Service vectors. Furthermore, when adding `requireAuth` to Node.js runtime API routes (`runtime: 'nodejs'`), `req.headers` is a plain object. The `requireAuth` logic expects a Web Request instance (with `req.headers.get`), so `.get` must be manually mocked.
**Prevention:** Never remove or comment out authentication layers on proxy endpoints that perform heavy computations or consume external resources. Always ensure proper mocking of `.get` when adapting Node.js `req.headers` for Edge-compatible authentication helpers.

## 2026-08-09 - Remove XSS vulnerability with dangerouslySetInnerHTML for SVG
**Vulnerability:** The application was using the `dangerouslySetInnerHTML` React attribute to render dynamically fetched SVG data (even when sanitized with DOMPurify) in `components/panels/ElementsPanel.tsx`.
**Learning:** Using `dangerouslySetInnerHTML` is an anti-pattern and increases the risk of Cross-Site Scripting (XSS) via accidental string concatenation or bypasses in sanitization libraries. It should be avoided when safer alternatives exist.
**Prevention:** To render dynamic SVG data securely, construct a Data URI using `encodeURIComponent` (e.g., `data:image/svg+xml;utf8,...`) and render it natively through an `<img>` tag's `src` attribute. This completely prevents arbitrary script execution within the DOM.

## 2026-08-10 - [Replace Math.random with crypto.randomUUID for Secure ID Generation]
**Vulnerability:** Weak pseudo-random number generators (`Math.random()`) were used in `services/psdParser.ts` and `services/stickerService.ts` for generating unique IDs (PSD node tracking and Tenor sticker fallback IDs).
**Learning:** `Math.random()` provides insufficient entropy and is predictable, which can lead to ID collisions or expose the internal state of the PRNG, especially when used repeatedly in rapid succession (like parsing a large PSD). SAST tools heavily flag the usage of `Math.random()` for any form of unique identification as it violates secure coding standards.
**Prevention:** Always use the cryptographically secure `crypto.randomUUID()` (which provides 122 bits of true entropy) built into modern browsers and Node.js for generating universally unique identifiers to guarantee unguessability and zero-collision rates.
