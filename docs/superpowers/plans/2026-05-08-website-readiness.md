# Dust2Cosmos Website Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `dust2cosmos.com` up to the SnapWorks Lab public website readiness baseline: deterministic metadata, structured data, manifest, root icons, branded 404, social card asset, and deployment verification.

**Architecture:** Keep the site static and framework-free. Add a small Node verification script using only built-in modules so readiness checks can run locally without package installation. Preserve the existing visual system and update only public website surface files.

**Tech Stack:** Static HTML/CSS/JS, macOS `sips` for image generation, built-in Node.js `fs`/`path`, GitHub/Vercel deployment through `origin/main`.

---

## File Structure

- Create `scripts/verify-website-readiness.mjs`: local readiness test runner. It validates platform files, metadata, schema, page links, sitemap, and 404 content.
- Create `manifest.webmanifest`: install/share metadata for the static site.
- Create `404.html`: branded not-found page with `noindex` and recovery links.
- Create `apple-touch-icon.png`: root-level 180x180 icon copied from `assets/icons/site-apple-icon.png`.
- Create `icon-192.png`: root-level 192x192 icon copied from `assets/icons/site-android-icon.png`.
- Create `icon-512.png`: root-level 512x512 icon generated from `assets/icons/site-favicon.png`.
- Create `assets/og-image.png`: PNG social card generated from `assets/og-image.svg`.
- Modify `index.html`: complete share metadata, root icon/manifest links, and `WebSite` + `SoftwareApplication` JSON-LD.
- Modify `privacy/index.html`: complete canonical/share metadata and root icon/manifest links.
- Modify `support/index.html`: complete canonical/share metadata and root icon/manifest links.
- Modify `README.md`: document readiness verification and release commands.
- Create `docs/ops/dust2cosmos-host-redirects.md`: document current apex/www redirect behavior and the recommended Vercel/Cloudflare 308 cleanup for `www`.

## Current Ground Truth

- Canonical host: `https://dust2cosmos.com/`
- App Store URL: `https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100`
- Current required public pages: `/`, `/privacy`, `/support`
- Existing icon sources:
  - `assets/icons/site-apple-icon.png` is 180x180 PNG.
  - `assets/icons/site-android-icon.png` is 192x192 PNG.
  - `assets/icons/site-favicon.png` is 1024x1024 PNG.
- Existing social card source: `assets/og-image.svg` is 1200x630 SVG.
- Known live gaps before this plan:
  - `/manifest.webmanifest` returns 404.
  - `/404.html` returns 404.
  - `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` return 404.
  - Homepage lacks JSON-LD.
  - Privacy and Support lack OG/Twitter metadata.
  - Homepage OG image metadata lacks secure URL, type, dimensions, and alt text.

---

### Task 1: Platform Files And Root Icons

**Files:**
- Create: `scripts/verify-website-readiness.mjs`
- Create: `manifest.webmanifest`
- Create: `404.html`
- Create: `apple-touch-icon.png`
- Create: `icon-192.png`
- Create: `icon-512.png`
- Modify: `index.html:23-30`
- Modify: `privacy/index.html:9-12`
- Modify: `support/index.html:9-12`

- [ ] **Step 1: Write the failing platform readiness test**

Create `scripts/verify-website-readiness.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`Missing file: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needle) {
  const text = readText(relativePath);
  if (!text.includes(needle)) {
    failures.push(`${relativePath} missing: ${needle}`);
  }
}

function assertJson(relativePath, predicate, label) {
  const json = JSON.parse(readText(relativePath));
  if (!predicate(json)) {
    failures.push(`${relativePath} failed JSON check: ${label}`);
  }
}

function checkPlatform() {
  [
    'manifest.webmanifest',
    '404.html',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'robots.txt',
    'sitemap.xml',
  ].forEach(assertFile);

  assertIncludes('robots.txt', 'Sitemap: https://dust2cosmos.com/sitemap.xml');
  assertIncludes('sitemap.xml', '<loc>https://dust2cosmos.com/</loc>');
  assertIncludes('sitemap.xml', '<loc>https://dust2cosmos.com/privacy</loc>');
  assertIncludes('sitemap.xml', '<loc>https://dust2cosmos.com/support</loc>');

  assertIncludes('index.html', '<link rel="manifest" href="/manifest.webmanifest">');
  assertIncludes('index.html', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">');
  assertIncludes('privacy/index.html', '<link rel="manifest" href="/manifest.webmanifest">');
  assertIncludes('privacy/index.html', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">');
  assertIncludes('support/index.html', '<link rel="manifest" href="/manifest.webmanifest">');
  assertIncludes('support/index.html', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">');

  assertIncludes('404.html', '<meta name="robots" content="noindex">');
  assertIncludes('404.html', '<a class="chip chip-link" href="/">Home</a>');
  assertIncludes('404.html', '<a class="chip chip-link" href="/support/">Support</a>');

  assertJson('manifest.webmanifest', json => json.name === 'Dust to Cosmos: Universe Scale', 'name');
  assertJson('manifest.webmanifest', json => json.short_name === 'Dust to Cosmos', 'short_name');
  assertJson('manifest.webmanifest', json => json.start_url === '/', 'start_url');
  assertJson('manifest.webmanifest', json => json.display === 'standalone', 'display');
  assertJson('manifest.webmanifest', json => json.icons.some(icon => icon.src === '/icon-192.png' && icon.sizes === '192x192'), '192 icon');
  assertJson('manifest.webmanifest', json => json.icons.some(icon => icon.src === '/icon-512.png' && icon.sizes === '512x512'), '512 icon');
}

const scope = process.argv[2] || 'platform';

if (scope !== 'platform') {
  failures.push(`Unsupported scope in current script: ${scope}`);
}

if (scope === 'platform') {
  checkPlatform();
}

if (failures.length > 0) {
  console.error(`Website readiness failed (${failures.length}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Website readiness passed: ${scope}`);
```

- [ ] **Step 2: Run platform test to verify it fails**

Run:

```bash
node scripts/verify-website-readiness.mjs platform
```

Expected: FAIL with at least these lines:

```text
Missing file: manifest.webmanifest
Missing file: 404.html
Missing file: apple-touch-icon.png
Missing file: icon-192.png
Missing file: icon-512.png
```

- [ ] **Step 3: Create platform files and root icons**

Run:

```bash
cp assets/icons/site-apple-icon.png apple-touch-icon.png
cp assets/icons/site-android-icon.png icon-192.png
sips -z 512 512 assets/icons/site-favicon.png --out icon-512.png
```

Create `manifest.webmanifest`:

```json
{
  "name": "Dust to Cosmos: Universe Scale",
  "short_name": "Dust to Cosmos",
  "description": "Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#02040a",
  "theme_color": "#04060e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Create `404.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Page not found — Dust to Cosmos: Universe Scale</title>
  <meta name="description" content="The requested Dust to Cosmos page could not be found.">
  <meta name="theme-color" content="#02040a">
  <link rel="canonical" href="https://dust2cosmos.com/404.html">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/assets/icons/site-favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="page-sub">
  <div class="aurora aurora-a" aria-hidden="true"></div>
  <div class="aurora aurora-b" aria-hidden="true"></div>

  <div class="site-shell sub-shell">
    <header class="sub-topbar">
      <a class="ghost-link" href="/">Dust to Cosmos: Universe Scale</a>
      <a class="chip chip-link" href="https://snapworkslab.com" target="_blank" rel="noopener noreferrer">SnapWorks Lab</a>
    </header>

    <main class="content-card">
      <p class="doc-label">404</p>
      <h1>Page not found</h1>
      <p>
        This page is outside the current Dust to Cosmos route map.
      </p>
      <p>
        Return to the landing page or contact support if you expected a public page here.
      </p>
      <div class="signal-row" aria-label="Recovery links">
        <a class="chip chip-link" href="/">Home</a>
        <a class="chip chip-link" href="/support/">Support</a>
      </div>
    </main>
  </div>
</body>
</html>
```

Modify each page head.

In `index.html`, replace:

```html
  <link rel="apple-touch-icon" href="assets/icons/site-apple-icon.png" sizes="180x180">
```

with:

```html
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
```

In `privacy/index.html` and `support/index.html`, replace:

```html
  <link rel="apple-touch-icon" href="../assets/icons/site-apple-icon.png" sizes="180x180">
```

with:

```html
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
```

- [ ] **Step 4: Run platform test to verify it passes**

Run:

```bash
node scripts/verify-website-readiness.mjs platform
```

Expected:

```text
Website readiness passed: platform
```

- [ ] **Step 5: Commit platform surface**

Run:

```bash
git add scripts/verify-website-readiness.mjs manifest.webmanifest 404.html apple-touch-icon.png icon-192.png icon-512.png index.html privacy/index.html support/index.html
git commit -m "Add website platform readiness surface"
```

---

### Task 2: Homepage Share Metadata And PNG Social Card

**Files:**
- Modify: `scripts/verify-website-readiness.mjs`
- Create: `assets/og-image.png`
- Modify: `index.html:14-23`

- [ ] **Step 1: Extend the readiness test for homepage share metadata**

In `scripts/verify-website-readiness.mjs`, replace:

```js
const scope = process.argv[2] || 'platform';

if (scope !== 'platform') {
  failures.push(`Unsupported scope in current script: ${scope}`);
}

if (scope === 'platform') {
  checkPlatform();
}
```

with:

```js
function checkHomepageShareMetadata() {
  assertFile('assets/og-image.png');

  const requiredHomeTags = [
    '<meta property="og:title" content="Dust to Cosmos: Universe Scale">',
    '<meta property="og:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">',
    '<meta property="og:type" content="website">',
    '<meta property="og:url" content="https://dust2cosmos.com/">',
    '<meta property="og:site_name" content="Dust to Cosmos">',
    '<meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">',
    '<meta property="og:image:secure_url" content="https://dust2cosmos.com/assets/og-image.png">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Dust to Cosmos: Universe Scale landing page artwork">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="Dust to Cosmos: Universe Scale">',
    '<meta name="twitter:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">',
    '<meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">',
    '<meta name="twitter:image:alt" content="Dust to Cosmos: Universe Scale landing page artwork">',
  ];

  requiredHomeTags.forEach(tag => assertIncludes('index.html', tag));
}

const scope = process.argv[2] || 'all';
const scopes = scope === 'all' ? ['platform', 'homepage-share'] : [scope];

for (const requestedScope of scopes) {
  if (requestedScope === 'platform') {
    checkPlatform();
  } else if (requestedScope === 'homepage-share') {
    checkHomepageShareMetadata();
  } else {
    failures.push(`Unsupported scope: ${requestedScope}`);
  }
}
```

- [ ] **Step 2: Run homepage share test to verify it fails**

Run:

```bash
node scripts/verify-website-readiness.mjs homepage-share
```

Expected: FAIL with at least these lines:

```text
Missing file: assets/og-image.png
index.html missing: <meta property="og:site_name" content="Dust to Cosmos">
index.html missing: <meta property="og:image:type" content="image/png">
index.html missing: <meta name="twitter:image:alt" content="Dust to Cosmos: Universe Scale landing page artwork">
```

- [ ] **Step 3: Generate PNG social card and update homepage meta**

Run:

```bash
sips -s format png assets/og-image.svg --out assets/og-image.png
```

In `index.html`, replace the current Open Graph and Twitter block:

```html
  <meta property="og:title" content="Dust to Cosmos: Universe Scale">
  <meta property="og:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://dust2cosmos.com/">
  <meta property="og:image" content="https://dust2cosmos.com/assets/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Dust to Cosmos: Universe Scale">
  <meta name="twitter:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">
  <meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.svg">
```

with:

```html
  <meta property="og:title" content="Dust to Cosmos: Universe Scale">
  <meta property="og:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://dust2cosmos.com/">
  <meta property="og:site_name" content="Dust to Cosmos">
  <meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta property="og:image:secure_url" content="https://dust2cosmos.com/assets/og-image.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Dust to Cosmos: Universe Scale landing page artwork">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Dust to Cosmos: Universe Scale">
  <meta name="twitter:description" content="Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.">
  <meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta name="twitter:image:alt" content="Dust to Cosmos: Universe Scale landing page artwork">
```

- [ ] **Step 4: Run homepage share test to verify it passes**

Run:

```bash
node scripts/verify-website-readiness.mjs homepage-share
```

Expected:

```text
Website readiness passed: homepage-share
```

- [ ] **Step 5: Commit homepage share metadata**

Run:

```bash
git add scripts/verify-website-readiness.mjs assets/og-image.png index.html
git commit -m "Complete homepage share metadata"
```

---

### Task 3: Homepage Structured Data

**Files:**
- Modify: `scripts/verify-website-readiness.mjs`
- Modify: `index.html:30-31`

- [ ] **Step 1: Extend the readiness test for homepage JSON-LD**

In `scripts/verify-website-readiness.mjs`, add this function after `checkHomepageShareMetadata()`:

```js
function extractJsonLdObjects(relativePath) {
  const text = readText(relativePath);
  const matches = [...text.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)];
  return matches.map(match => JSON.parse(match[1].trim()));
}

function checkHomepageStructuredData() {
  const objects = extractJsonLdObjects('index.html');
  const website = objects.find(object => object['@type'] === 'WebSite');
  const app = objects.find(object => object['@type'] === 'SoftwareApplication');

  if (!website) {
    failures.push('index.html missing WebSite JSON-LD');
  } else {
    if (website.name !== 'Dust to Cosmos') failures.push('WebSite JSON-LD name mismatch');
    if (website.url !== 'https://dust2cosmos.com/') failures.push('WebSite JSON-LD url mismatch');
    if (website.publisher?.name !== 'SnapWorks Lab') failures.push('WebSite JSON-LD publisher mismatch');
  }

  if (!app) {
    failures.push('index.html missing SoftwareApplication JSON-LD');
  } else {
    if (app.name !== 'Dust to Cosmos: Universe Scale') failures.push('SoftwareApplication JSON-LD name mismatch');
    if (app.operatingSystem !== 'iOS, iPadOS') failures.push('SoftwareApplication JSON-LD operatingSystem mismatch');
    if (app.applicationCategory !== 'EducationalApplication') failures.push('SoftwareApplication JSON-LD category mismatch');
    if (app.offers?.price !== '0') failures.push('SoftwareApplication JSON-LD price mismatch');
    if (app.downloadUrl !== 'https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100') failures.push('SoftwareApplication JSON-LD downloadUrl mismatch');
  }
}
```

Then replace the scope dispatch block:

```js
  } else if (requestedScope === 'homepage-share') {
    checkHomepageShareMetadata();
  } else {
```

with:

```js
  } else if (requestedScope === 'homepage-share') {
    checkHomepageShareMetadata();
  } else if (requestedScope === 'structured-data') {
    checkHomepageStructuredData();
  } else {
```

- [ ] **Step 2: Run structured data test to verify it fails**

Run:

```bash
node scripts/verify-website-readiness.mjs structured-data
```

Expected:

```text
index.html missing WebSite JSON-LD
index.html missing SoftwareApplication JSON-LD
```

- [ ] **Step 3: Add WebSite and SoftwareApplication JSON-LD**

In `index.html`, insert this block immediately before `</head>`:

```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Dust to Cosmos",
    "url": "https://dust2cosmos.com/",
    "publisher": {
      "@type": "Organization",
      "name": "SnapWorks Lab",
      "url": "https://snapworkslab.com"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Dust to Cosmos: Universe Scale",
    "alternateName": "우주먼지: Dust to Cosmos",
    "operatingSystem": "iOS, iPadOS",
    "applicationCategory": "EducationalApplication",
    "url": "https://dust2cosmos.com/",
    "downloadUrl": "https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100",
    "image": "https://dust2cosmos.com/assets/og-image.png",
    "screenshot": [
      "https://dust2cosmos.com/assets/screenshots/slide-01.webp",
      "https://dust2cosmos.com/assets/screenshots/slide-03.webp",
      "https://dust2cosmos.com/assets/screenshots/slide-09.webp"
    ],
    "description": "Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SnapWorks Lab",
      "url": "https://snapworkslab.com"
    }
  }
  </script>
```

- [ ] **Step 4: Run structured data test to verify it passes**

Run:

```bash
node scripts/verify-website-readiness.mjs structured-data
```

Expected:

```text
Website readiness passed: structured-data
```

- [ ] **Step 5: Commit structured data**

Run:

```bash
git add scripts/verify-website-readiness.mjs index.html
git commit -m "Add app structured data"
```

---

### Task 4: Privacy And Support Share Metadata

**Files:**
- Modify: `scripts/verify-website-readiness.mjs`
- Modify: `privacy/index.html:6-13`
- Modify: `support/index.html:6-13`

- [ ] **Step 1: Extend the readiness test for secondary page metadata**

In `scripts/verify-website-readiness.mjs`, add this function after `checkHomepageStructuredData()`:

```js
function checkSecondaryPageMetadata() {
  const pages = [
    {
      path: 'privacy/index.html',
      title: 'Privacy — Dust to Cosmos: Universe Scale',
      description: 'Privacy information for Dust to Cosmos: Universe Scale.',
      url: 'https://dust2cosmos.com/privacy',
      label: 'Privacy',
    },
    {
      path: 'support/index.html',
      title: 'Support — Dust to Cosmos: Universe Scale',
      description: 'Support information for Dust to Cosmos: Universe Scale.',
      url: 'https://dust2cosmos.com/support',
      label: 'Support',
    },
  ];

  for (const page of pages) {
    assertIncludes(page.path, `<title>${page.title}</title>`);
    assertIncludes(page.path, `<meta name="description" content="${page.description}">`);
    assertIncludes(page.path, `<link rel="canonical" href="${page.url}">`);
    assertIncludes(page.path, `<meta property="og:title" content="${page.title}">`);
    assertIncludes(page.path, `<meta property="og:description" content="${page.description}">`);
    assertIncludes(page.path, '<meta property="og:type" content="website">');
    assertIncludes(page.path, `<meta property="og:url" content="${page.url}">`);
    assertIncludes(page.path, '<meta property="og:site_name" content="Dust to Cosmos">');
    assertIncludes(page.path, '<meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">');
    assertIncludes(page.path, '<meta name="twitter:card" content="summary">');
    assertIncludes(page.path, `<meta name="twitter:title" content="${page.title}">`);
    assertIncludes(page.path, `<meta name="twitter:description" content="${page.description}">`);
    assertIncludes(page.path, '<meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">');
    assertIncludes(page.path, `<meta name="twitter:image:alt" content="Dust to Cosmos ${page.label} page">`);
  }
}
```

Then replace the scope dispatch block:

```js
  } else if (requestedScope === 'structured-data') {
    checkHomepageStructuredData();
  } else {
```

with:

```js
  } else if (requestedScope === 'structured-data') {
    checkHomepageStructuredData();
  } else if (requestedScope === 'secondary-metadata') {
    checkSecondaryPageMetadata();
  } else {
```

- [ ] **Step 2: Run secondary metadata test to verify it fails**

Run:

```bash
node scripts/verify-website-readiness.mjs secondary-metadata
```

Expected: FAIL with missing `og:title`, `og:description`, `twitter:card`, and `twitter:image:alt` lines for both `privacy/index.html` and `support/index.html`.

- [ ] **Step 3: Add Privacy page metadata**

In `privacy/index.html`, replace the head block from `<title>` through the icon links with:

```html
  <title>Privacy — Dust to Cosmos: Universe Scale</title>
  <meta name="description" content="Privacy information for Dust to Cosmos: Universe Scale.">
  <meta name="theme-color" content="#02040a">
  <meta property="og:title" content="Privacy — Dust to Cosmos: Universe Scale">
  <meta property="og:description" content="Privacy information for Dust to Cosmos: Universe Scale.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://dust2cosmos.com/privacy">
  <meta property="og:site_name" content="Dust to Cosmos">
  <meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Privacy — Dust to Cosmos: Universe Scale">
  <meta name="twitter:description" content="Privacy information for Dust to Cosmos: Universe Scale.">
  <meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta name="twitter:image:alt" content="Dust to Cosmos Privacy page">
  <link rel="canonical" href="https://dust2cosmos.com/privacy">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="../assets/icons/site-favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
```

- [ ] **Step 4: Add Support page metadata**

In `support/index.html`, replace the head block from `<title>` through the icon links with:

```html
  <title>Support — Dust to Cosmos: Universe Scale</title>
  <meta name="description" content="Support information for Dust to Cosmos: Universe Scale.">
  <meta name="theme-color" content="#02040a">
  <meta property="og:title" content="Support — Dust to Cosmos: Universe Scale">
  <meta property="og:description" content="Support information for Dust to Cosmos: Universe Scale.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://dust2cosmos.com/support">
  <meta property="og:site_name" content="Dust to Cosmos">
  <meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Support — Dust to Cosmos: Universe Scale">
  <meta name="twitter:description" content="Support information for Dust to Cosmos: Universe Scale.">
  <meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">
  <meta name="twitter:image:alt" content="Dust to Cosmos Support page">
  <link rel="canonical" href="https://dust2cosmos.com/support">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="../assets/icons/site-favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
```

- [ ] **Step 5: Run secondary metadata test to verify it passes**

Run:

```bash
node scripts/verify-website-readiness.mjs secondary-metadata
```

Expected:

```text
Website readiness passed: secondary-metadata
```

- [ ] **Step 6: Commit secondary metadata**

Run:

```bash
git add scripts/verify-website-readiness.mjs privacy/index.html support/index.html
git commit -m "Complete secondary page share metadata"
```

---

### Task 5: Documentation And Final Release Verification

**Files:**
- Modify: `README.md`
- Create: `docs/ops/dust2cosmos-host-redirects.md`

- [ ] **Step 1: Run full local readiness test**

Run:

```bash
node scripts/verify-website-readiness.mjs all
```

Expected:

```text
Website readiness passed: all
```

- [ ] **Step 2: Document local readiness commands in README**

Append this section to `README.md`:

````markdown
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
```
````

- [ ] **Step 3: Document host redirect expectations**

Create `docs/ops/dust2cosmos-host-redirects.md`:

````markdown
# dust2cosmos.com Host Redirect Notes

Canonical host: `https://dust2cosmos.com/`

## Current target behavior

- `http://dust2cosmos.com/*` should redirect to `https://dust2cosmos.com/*`.
- `https://www.dust2cosmos.com/*` should redirect to `https://dust2cosmos.com/*`.
- Canonical URLs, Open Graph URLs, structured data URLs, `robots.txt`, and `sitemap.xml` should all point at `https://dust2cosmos.com/`.

## Recommended production status

Use HTTP redirects at the hosting or edge layer. Prefer `308 Permanent Redirect` for both host and protocol normalization because the canonical host is stable.

Recommended rules:

```text
http://dust2cosmos.com/*        -> https://dust2cosmos.com/:splat      308
https://www.dust2cosmos.com/*   -> https://dust2cosmos.com/:splat      308
```

## Verification commands

Run:

```bash
curl -I http://dust2cosmos.com/
curl -I https://www.dust2cosmos.com/
curl -I https://dust2cosmos.com/
```

Expected:

```text
http://dust2cosmos.com/      returns 308 with Location: https://dust2cosmos.com/
https://www.dust2cosmos.com/ returns 308 with Location: https://dust2cosmos.com/
https://dust2cosmos.com/     returns 200
```

If Vercel or Cloudflare currently returns `307` for `www`, the site remains crawlable because the homepage canonical points at the apex. Clean it up to `308` in the hosting dashboard when touching domain configuration.
```
````

- [ ] **Step 4: Commit docs**

Run:

```bash
git add README.md docs/ops/dust2cosmos-host-redirects.md
git commit -m "Document website readiness checks"
```

- [ ] **Step 5: Run pre-push local HTTP verification**

Run:

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

In another shell, run:

```bash
curl -I http://127.0.0.1:4174/manifest.webmanifest
curl -I http://127.0.0.1:4174/apple-touch-icon.png
curl -I http://127.0.0.1:4174/icon-192.png
curl -I http://127.0.0.1:4174/icon-512.png
curl -I http://127.0.0.1:4174/assets/og-image.png
curl -I http://127.0.0.1:4174/404.html
```

Expected: every command returns `HTTP/1.0 200 OK`.

Stop the server:

```bash
lsof -ti tcp:4174 | xargs -r kill
```

- [ ] **Step 6: Push release**

Run:

```bash
git status --short --branch
git push origin main
```

Expected:

```text
## main...origin/main
```

before push except intentionally ignored `.DS_Store` files, then a successful `main -> main` push.

- [ ] **Step 7: Verify live deployment**

Run:

```bash
curl -L --max-time 20 -s https://dust2cosmos.com/ | rg -n 'application/ld\\+json|og:image:type|twitter:image:alt|manifest.webmanifest'
curl -I --max-time 20 -s https://dust2cosmos.com/manifest.webmanifest
curl -I --max-time 20 -s https://dust2cosmos.com/apple-touch-icon.png
curl -I --max-time 20 -s https://dust2cosmos.com/icon-192.png
curl -I --max-time 20 -s https://dust2cosmos.com/icon-512.png
curl -I --max-time 20 -s https://dust2cosmos.com/assets/og-image.png
curl -I --max-time 20 -s https://dust2cosmos.com/404.html
curl -I --max-time 20 -s https://www.dust2cosmos.com/
```

Expected:

```text
Homepage HTML contains application/ld+json, og:image:type, twitter:image:alt, and manifest.webmanifest.
/manifest.webmanifest returns 200.
/apple-touch-icon.png returns 200.
/icon-192.png returns 200.
/icon-512.png returns 200.
/assets/og-image.png returns 200.
/404.html returns 200.
https://www.dust2cosmos.com/ redirects to https://dust2cosmos.com/.
```

---

## Self-Review

**Spec coverage:**  
This plan covers page-level metadata, homepage structured data, platform files, robots/sitemap verification, branded 404, manifest, root icons, PNG social image, host redirect documentation, local verification, live verification, and release.

**Placeholder scan:**  
The plan contains concrete file paths, snippets, commands, and expected outputs. It does not require unspecified metadata, unspecified schema, or unspecified test coverage.

**Type consistency:**  
The verification script uses stable function names throughout: `assertFile`, `assertIncludes`, `assertJson`, `checkPlatform`, `checkHomepageShareMetadata`, `checkHomepageStructuredData`, and `checkSecondaryPageMetadata`. Scope names are consistent: `platform`, `homepage-share`, `structured-data`, `secondary-metadata`, and `all`.
