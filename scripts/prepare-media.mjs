import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Optional authoring dependency only; the site and its build need no packages.
const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../assets/media/', import.meta.url));
const [key, source, kind = 'ui-concept'] = process.argv.slice(2);
const names = { earthHero: 'earth-hero', ipadMockup: 'ipad-earth', iphoneMockup: 'iphone-saturn', voyageArt: 'voyage-saturn' };
if (!names[key] || !source || !['ui-concept', 'concept-art', 'screenshot'].includes(kind)) {
  throw new Error('Usage: node scripts/prepare-media.mjs <earthHero|ipadMockup|iphoneMockup|voyageArt> <source-image> <ui-concept|concept-art|screenshot>');
}
await mkdir(root, { recursive: true });
let manifest;
try { manifest = JSON.parse(await readFile(root + 'manifest.json', 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; manifest = { updated: '2026-09-08', assets: {} }; }
const input = await readFile(source);
const metadata = await sharp(input).metadata();
const widths = key === 'iphoneMockup' ? [360, 600, Math.min(metadata.width, 1000)] : [640, 1080, Math.min(metadata.width, 1920)];
const variants = [];
for (const width of [...new Set(widths)].sort((a, b) => a - b)) {
  const file = `${names[key]}-${width}.webp`;
  const info = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: key.includes('Mockup') ? 88 : 83, effort: 6 }).toFile(root + file);
  variants.push({ file, width: info.width, height: info.height, bytes: info.size });
}
const largest = variants.at(-1);
manifest.assets[key] = {
  file: largest.file, width: largest.width, height: largest.height, kind,
  generated: kind !== 'screenshot',
  sourceSHA256: createHash('sha256').update(input).digest('hex'),
  variants,
};
await writeFile(root + 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${key}: ${kind}, ${variants.map(v => `${v.width}px / ${Math.round(v.bytes / 1024)}KB`).join(', ')}`);
