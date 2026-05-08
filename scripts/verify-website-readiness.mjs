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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function extractJsonLdObjects(relativePath) {
  const text = readText(relativePath);
  if (text === null) {
    return [];
  }

  const objects = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const jsonLdTypePattern = /\btype\s*=\s*(?:(["'])application\/ld\+json\1|application\/ld\+json(?:\s|$))/i;
  let match;
  let blockCount = 0;

  while ((match = scriptPattern.exec(text)) !== null) {
    const [, attributes, scriptBody] = match;
    if (!jsonLdTypePattern.test(attributes)) {
      continue;
    }

    blockCount += 1;
    const jsonText = scriptBody.trim();
    if (jsonText.length === 0) {
      recordFailure(`${relativePath} has empty JSON-LD block ${blockCount}`);
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      recordFailure(`${relativePath} has invalid JSON-LD block ${blockCount}: ${error.message}`);
      continue;
    }

    if (Array.isArray(parsed)) {
      parsed.forEach((entry, index) => {
        if (isPlainObject(entry)) {
          objects.push(entry);
          return;
        }

        recordFailure(`${relativePath} JSON-LD block ${blockCount} entry ${index + 1} is not an object`);
      });
      continue;
    }

    if (isPlainObject(parsed)) {
      objects.push(parsed);
      continue;
    }

    recordFailure(`${relativePath} JSON-LD block ${blockCount} is not an object`);
  }

  if (blockCount === 0) {
    recordFailure(`${relativePath} missing JSON-LD script blocks`);
  }

  return objects;
}

function getObjectPath(object, propertyPath) {
  return propertyPath.reduce((value, key) => {
    if (value === null || typeof value !== 'object') {
      return undefined;
    }

    return value[key];
  }, object);
}

function assertJsonLdEquals(relativePath, object, propertyPath, expected, label) {
  const actual = getObjectPath(object, propertyPath);
  if (actual !== expected) {
    recordFailure(`${relativePath} JSON-LD ${label} expected ${JSON.stringify(expected)} but found ${JSON.stringify(actual)}`);
  }
}

function assertJsonLdPriceZero(relativePath, object, propertyPath, label) {
  const actual = getObjectPath(object, propertyPath);
  if (actual !== '0' && actual !== 0) {
    recordFailure(`${relativePath} JSON-LD ${label} expected 0 but found ${JSON.stringify(actual)}`);
  }
}

function assertJsonLdArrayIncludes(relativePath, object, propertyPath, expected, label) {
  const actual = getObjectPath(object, propertyPath);
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    recordFailure(`${relativePath} JSON-LD ${label} missing ${expected}`);
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

function checkAnalytics() {
  assertFile('assets/analytics.js');

  [
    { path: 'index.html', script: '<script defer src="assets/analytics.js"></script>' },
    { path: 'privacy/index.html', script: '<script defer src="../assets/analytics.js"></script>' },
    { path: 'support/index.html', script: '<script defer src="../assets/analytics.js"></script>' },
    { path: '404.html', script: '<script defer src="/assets/analytics.js"></script>' },
  ].forEach(page => {
    assertIncludes(page.path, 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };');
    assertIncludes(page.path, '<script defer src="/_vercel/insights/script.js"></script>');
    assertIncludes(page.path, page.script);
  });

  assertIncludes('assets/analytics.js', 'const googleAnalyticsMeasurementId = ');
  assertIncludes('assets/analytics.js', 'https://www.googletagmanager.com/gtag/js?id=');
  assertIncludes('assets/analytics.js', "window.gtag('config', googleAnalyticsMeasurementId);");
  assertIncludes('privacy/index.html', 'The iOS and iPadOS app does not collect, store, or share your personal data.');
  assertIncludes('privacy/index.html', 'Website analytics are separate from the Dust to Cosmos app');
}

function checkHomepageShareMetadata() {
  assertFile('assets/og-image.png');

  [
    '<link rel="canonical" href="https://dust2cosmos.com/">',
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

function checkSecondaryPageMetadata() {
  [
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
  ].forEach(page => {
    [
      `<title>${page.title}</title>`,
      `<meta name="description" content="${page.description}">`,
      `<link rel="canonical" href="${page.url}">`,
      `<meta property="og:title" content="${page.title}">`,
      `<meta property="og:description" content="${page.description}">`,
      '<meta property="og:type" content="website">',
      `<meta property="og:url" content="${page.url}">`,
      '<meta property="og:site_name" content="Dust to Cosmos">',
      '<meta property="og:image" content="https://dust2cosmos.com/assets/og-image.png">',
      '<meta name="twitter:card" content="summary">',
      `<meta name="twitter:title" content="${page.title}">`,
      `<meta name="twitter:description" content="${page.description}">`,
      '<meta name="twitter:image" content="https://dust2cosmos.com/assets/og-image.png">',
      `<meta name="twitter:image:alt" content="Dust to Cosmos ${page.label} page">`,
    ].forEach(tag => assertIncludes(page.path, tag));
  });
}

function checkHomepageStructuredData() {
  const relativePath = 'index.html';
  const jsonLdObjects = extractJsonLdObjects(relativePath);
  const website = jsonLdObjects.find(object => object['@type'] === 'WebSite');
  const softwareApplication = jsonLdObjects.find(object => object['@type'] === 'SoftwareApplication');

  if (!website) {
    recordFailure(`${relativePath} missing WebSite JSON-LD object`);
  } else {
    assertJsonLdEquals(relativePath, website, ['@type'], 'WebSite', 'WebSite @type');
    assertJsonLdEquals(relativePath, website, ['name'], 'Dust to Cosmos', 'WebSite name');
    assertJsonLdEquals(relativePath, website, ['url'], 'https://dust2cosmos.com/', 'WebSite url');
    assertJsonLdEquals(relativePath, website, ['publisher', 'name'], 'SnapWorks Lab', 'WebSite publisher.name');
  }

  if (!softwareApplication) {
    recordFailure(`${relativePath} missing SoftwareApplication JSON-LD object`);
  } else {
    assertJsonLdEquals(relativePath, softwareApplication, ['@type'], 'SoftwareApplication', 'SoftwareApplication @type');
    assertJsonLdEquals(relativePath, softwareApplication, ['name'], 'Dust to Cosmos: Universe Scale', 'SoftwareApplication name');
    assertJsonLdEquals(relativePath, softwareApplication, ['alternateName'], '우주먼지: Dust to Cosmos', 'SoftwareApplication alternateName');
    assertJsonLdEquals(relativePath, softwareApplication, ['operatingSystem'], 'iOS, iPadOS', 'SoftwareApplication operatingSystem');
    assertJsonLdEquals(relativePath, softwareApplication, ['applicationCategory'], 'EducationalApplication', 'SoftwareApplication applicationCategory');
    assertJsonLdEquals(relativePath, softwareApplication, ['url'], 'https://dust2cosmos.com/', 'SoftwareApplication url');
    assertJsonLdEquals(relativePath, softwareApplication, ['downloadUrl'], 'https://apps.apple.com/us/app/dust-to-cosmos-universe-scale/id6760629100', 'SoftwareApplication downloadUrl');
    assertJsonLdEquals(relativePath, softwareApplication, ['image'], 'https://dust2cosmos.com/assets/og-image.png', 'SoftwareApplication image');
    [
      'https://dust2cosmos.com/assets/screenshots/slide-01.webp',
      'https://dust2cosmos.com/assets/screenshots/slide-03.webp',
      'https://dust2cosmos.com/assets/screenshots/slide-09.webp',
    ].forEach(url => assertJsonLdArrayIncludes(relativePath, softwareApplication, ['screenshot'], url, 'SoftwareApplication screenshot'));
    assertJsonLdEquals(relativePath, softwareApplication, ['description'], 'Explore connected worlds, black holes, and cosmic time through a smoother 3D universe-scale journey.', 'SoftwareApplication description');
    assertJsonLdEquals(relativePath, softwareApplication, ['offers', '@type'], 'Offer', 'SoftwareApplication offers.@type');
    assertJsonLdPriceZero(relativePath, softwareApplication, ['offers', 'price'], 'SoftwareApplication offers.price');
    assertJsonLdEquals(relativePath, softwareApplication, ['offers', 'priceCurrency'], 'USD', 'SoftwareApplication offers.priceCurrency');
    assertJsonLdEquals(relativePath, softwareApplication, ['publisher', 'name'], 'SnapWorks Lab', 'SoftwareApplication publisher.name');
    assertJsonLdEquals(relativePath, softwareApplication, ['publisher', 'url'], 'https://snapworkslab.com', 'SoftwareApplication publisher.url');
  }
}

const scope = process.argv[2] || 'all';
const supportedScopes = new Set(['all', 'platform', 'homepage-share', 'structured-data', 'secondary-metadata', 'analytics']);

if (!supportedScopes.has(scope)) {
  recordFailure(`Unsupported scope: ${scope}`);
}

if (scope === 'all' || scope === 'platform') {
  checkPlatform();
}

if (scope === 'all' || scope === 'homepage-share') {
  checkHomepageShareMetadata();
}

if (scope === 'all' || scope === 'structured-data') {
  checkHomepageStructuredData();
}

if (scope === 'all' || scope === 'secondary-metadata') {
  checkSecondaryPageMetadata();
}

if (scope === 'all' || scope === 'analytics') {
  checkAnalytics();
}

if (failures.length > 0) {
  console.error(`Website readiness failed (${failures.length}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Website readiness passed: ${scope}`);
