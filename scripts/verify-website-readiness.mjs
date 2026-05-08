import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function recordFailure(message) {
  if (!failures.includes(message)) {
    failures.push(message);
  }
}

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      recordFailure(`Missing file: ${relativePath}`);
      return null;
    }

    recordFailure(`${relativePath} could not be read: ${error.message}`);
    return null;
  }
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    recordFailure(`Missing file: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needle) {
  const text = readText(relativePath);
  if (text === null) {
    return;
  }

  if (!text.includes(needle)) {
    recordFailure(`${relativePath} missing: ${needle}`);
  }
}

function assertJson(relativePath, predicate, label) {
  const text = readText(relativePath);
  if (text === null) {
    return;
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    recordFailure(`${relativePath} has invalid JSON: ${error.message}`);
    return;
  }

  let passed;
  try {
    passed = predicate(json);
  } catch (error) {
    recordFailure(`${relativePath} failed JSON check: ${label} (${error.message})`);
    return;
  }

  if (!passed) {
    recordFailure(`${relativePath} failed JSON check: ${label}`);
  }
}

function hasManifestIcon(json, src, sizes) {
  return Array.isArray(json.icons) && json.icons.some(icon => icon.src === src && icon.sizes === sizes);
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
  assertJson('manifest.webmanifest', json => hasManifestIcon(json, '/icon-192.png', '192x192'), '192 icon');
  assertJson('manifest.webmanifest', json => hasManifestIcon(json, '/icon-512.png', '512x512'), '512 icon');
}

function checkHomepageShareMetadata() {
  assertFile('assets/og-image.png');

  [
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
  ].forEach(tag => assertIncludes('index.html', tag));
}

const scope = process.argv[2] || 'all';
const supportedScopes = new Set(['all', 'platform', 'homepage-share']);

if (!supportedScopes.has(scope)) {
  recordFailure(`Unsupported scope: ${scope}`);
}

if (scope === 'all' || scope === 'platform') {
  checkPlatform();
}

if (scope === 'all' || scope === 'homepage-share') {
  checkHomepageShareMetadata();
}

if (failures.length > 0) {
  console.error(`Website readiness failed (${failures.length}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Website readiness passed: ${scope}`);
