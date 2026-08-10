# Microsoft Store release guide

Kreathief is distributed as a hosted Progressive Web App. The recommended Windows Store path is to package the production PWA with PWABuilder and submit the generated Windows packages through Microsoft Partner Center.

## Repository checks

Run the following commands from the repository root before packaging:

```bash
pnpm install --frozen-lockfile
pnpm run validate:pwa-store
pnpm run build:check
pnpm test -- --run
```

Deploy the resulting `dist` directory through the normal production deployment and verify the live HTTPS origin. Confirm that the manifest, icons, screenshots, `offline.html`, generated service worker, authentication routes, API routes, and export flows work from the deployed domain.

## Partner Center setup

Use a personal Microsoft account enrolled in the Windows Developer Program. In Partner Center, create a new **MSIX or PWA app**, reserve the Kreathief product name, and copy the Package ID, Publisher ID, and Publisher display name from Product Identity.

The Store listing should include a concise description, category, privacy policy URL, support URL, age-rating answers, pricing and market availability, and polished Windows screenshots. Because Kreathief supports accounts, cloud storage, analytics, AI services, and asset providers, the privacy policy must explain what data is collected, why it is processed, which service providers receive it, retention, security, and account or data deletion.

## PWABuilder packaging

1. Open [PWABuilder](https://www.pwabuilder.com) and enter the final production URL.
2. Resolve all report-card action items that affect manifest, icons, service-worker, HTTPS, or installability readiness.
3. Select **Package for Stores**, choose **Windows**, and enter the Partner Center Package ID, Publisher display name, and Publisher ID.
4. Download the generated package archive. It should contain the `.msixbundle` and `.classic.appxbundle` files needed for the Store submission.
5. Test installation, first launch, offline editing, authentication, export, cloud sync, AI failure states, update behavior, and uninstall/reinstall on clean Windows 10 and Windows 11 devices.

## Partner Center submission

Start a submission for the reserved app, complete pricing and availability, properties, age ratings, packages, Store listing, and submission options. Upload the generated Windows packages and submit for certification. Keep the production web origin stable because the Store package launches the hosted PWA and web updates are delivered through that origin.

## Important security rule

Never place provider secrets in browser-exposed `VITE_` variables. AI, image, icon, and other external-service secrets must remain in server-side API routes or Supabase Edge Functions. The installed PWA is still a browser application, so packaging it as an MSIX does not make client-side secrets private.

## References

- [Microsoft Learn: Publish a PWA to the Microsoft Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- [Microsoft Learn: Create app submission for MSIX apps](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission)
- [Microsoft Learn: Distribute your app and the WebView2 Runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)
