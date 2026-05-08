# Dust to Cosmos — landing site

Static, framework-free landing page for `dust2cosmos.com`.

App Store: https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100

## Included
- `/index.html` — landing page
- `/privacy/index.html` — minimal privacy holding page
- `/support/index.html` — minimal support page
- `/assets/styles.css`
- `/assets/main.js`
- `/assets/icons/` — app icon and favicon assets
- `/assets/screenshots/` — optimized App Store screenshot assets for the landing page
- `/assets/og-image.svg`
- `/assets/og-image.png` — social card image
- `/manifest.webmanifest`
- `/404.html`
- `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`
- `/robots.txt`
- `/sitemap.xml`
- `/scripts/verify-website-readiness.mjs` — static readiness checker
- `/docs/ops/dust2cosmos-host-redirects.md` — host redirect notes
- `/docs/superpowers/plans/2026-05-08-website-readiness.md` — readiness implementation plan

## Deploy on Vercel
1. Create a new project and import this folder, or drag-and-drop the folder into Vercel.
2. Connect the domain `dust2cosmos.com`.
3. Set `dust2cosmos.com` as the canonical production domain.
4. Redirect `www.dust2cosmos.com` to `https://dust2cosmos.com/` at the host or edge layer, using a permanent redirect.
5. Optional: add email forwarding with an external mail provider.

## Notes
- The privacy page is a minimal website privacy placeholder, not a final in-app privacy policy.
- Update the year, contact copy, and launch copy whenever needed.

## Website readiness verification

Run the static readiness checks before shipping:

```bash
node scripts/verify-website-readiness.mjs all
```

The checker verifies:
- canonical and share metadata for `/`, `/privacy`, and `/support`
- homepage `WebSite` and `SoftwareApplication` JSON-LD
- `robots.txt` and `sitemap.xml`
- `manifest.webmanifest`
- branded `404.html`
- root icon files: `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`
- PNG social card: `/assets/og-image.png`
