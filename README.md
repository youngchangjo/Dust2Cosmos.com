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
- `/robots.txt`
- `/sitemap.xml`

## Deploy on Vercel
1. Create a new project and import this folder, or drag-and-drop the folder into Vercel.
2. Connect the domain `dust2cosmos.com`.
3. Set the preferred production domain.
4. Optional:
   - redirect `www` to apex, or apex to `www`
   - add email forwarding with an external mail provider

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
