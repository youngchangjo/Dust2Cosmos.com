import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Capture the production shader at time zero; never substitute different artwork.
// Run against `npm run serve -- --port 8893` after changing the shader or its maps.
const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ headless: process.env.DTC_HEADFUL !== '1' });
let pixels;
try {
  const page = await browser.newPage({ viewport: { width: 2048, height: 2048 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    Object.defineProperty(document, 'hidden', { get: () => true });
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      draw.apply(this, args);
      if (this.canvas.classList.contains('earth-canvas')) window.earthFirstFrame = this.canvas.toDataURL('image/png');
    };
  });
  await page.route('**/assets/styles.css*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + '\n.hero { width:2048px; height:2048px; min-height:0; max-height:none; } .hero-visual { width:2048px; height:2048px; left:50%; top:50%; }' });
  });
  await page.goto((process.env.DTC_PREVIEW_URL || 'http://127.0.0.1:8893') + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.earthFirstFrame, null, { timeout: 30000 });
  pixels = Buffer.from((await page.evaluate(() => window.earthFirstFrame)).split(',')[1], 'base64');
} finally { await browser.close(); }
const variants = [];
for (const width of [1024, 2048]) {
  const file = `earth-first-frame-${width}.webp`;
  const info = await sharp(pixels).resize(width).webp({ quality: 92, effort: 6 }).toFile(root + 'assets/media/' + file);
  variants.push({ file, width, height: width, bytes: info.size });
}
const manifestPath = root + 'assets/media/manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.assets.earthPoster = {
  file: variants.at(-1).file, width: 2048, height: 2048,
  kind: 'renderer-first-frame', generated: false,
  source: 'assets/earth.js at uTime = 0; Solar System Scope maps (assets/earth/credits.json)',
  sourceSHA256: createHash('sha256').update(await readFile(root + 'assets/earth.js')).digest('hex'),
  variants,
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Captured matching Earth first frame:', variants);
