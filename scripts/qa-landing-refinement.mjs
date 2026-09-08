import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const base = process.env.DTC_PREVIEW_URL || 'http://127.0.0.1:8893';
const output = fileURLToPath(new URL('../docs/phase_reports/artifacts/landing_3_0/', import.meta.url));
await mkdir(output, { recursive: true });
const results = [];
const check = async (name, fn) => {
  try { results.push({ name, status: 'pass', evidence: await fn() }); }
  catch (error) { results.push({ name, status: 'fail', error: error.message }); }
  console.log(results.at(-1));
};
const browser = await chromium.launch({ headless: process.env.DTC_HEADFUL !== '1' });
try {
  for (const [width, height] of [[390, 844], [1180, 820], [1440, 960]]) {
    await check(`First Earth frame remains aligned after delayed texture loading at ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      // Hold only the animation clock so the before/after comparison is time zero.
      await page.addInitScript(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/assets/earth/*.webp', async route => { await gate; await route.continue(); });
      try {
        await page.goto(base + '/ko/', { waitUntil: 'domcontentloaded' });
        await page.addStyleTag({ content: '.hero-content > * { animation:none !important; }' });
        await page.locator('.hero-visual img').evaluate(img => img.decode());
        assert.equal(await page.locator('.earth-canvas').getAttribute('data-state'), 'loading');
        const beforeBounds = await page.locator('.hero-visual').boundingBox();
        const clip = { x: Math.floor(width * .5), y: Math.floor(height * .20), width: Math.floor(width * .48), height: Math.floor(height * .63) };
        const before = await page.screenshot({ path: output + `arrival-${width}-before.png`, clip });
        release();
        await page.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state === 'ready', null, { timeout: 30000 });
        await page.waitForTimeout(350);
        const after = await page.screenshot({ path: output + `arrival-${width}-after.png`, clip });
        assert.deepEqual(await page.locator('.hero-visual').boundingBox(), beforeBounds);
        const a = await sharp(before).removeAlpha().raw().toBuffer();
        const b = await sharp(after).removeAlpha().raw().toBuffer();
        let difference = 0, largeChanges = 0;
        for (let i = 0; i < a.length; i += 3) {
          const delta = (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2])) / 3;
          difference += delta;
          if (delta > 24) largeChanges++;
        }
        const meanDifference = difference / (a.length / 3);
        const changedFraction = largeChanges / (a.length / 3);
        assert.ok(meanDifference < 4, `Mean color difference ${meanDifference.toFixed(2)} exceeds compression/resampling tolerance`);
        assert.ok(changedFraction < .035, `${(changedFraction*100).toFixed(2)}% of pixels changed substantially`);
        return { meanDifference, changedFraction, note: 'Identical geometry and time-zero scene; WebP compression and texture resampling may differ slightly.' };
      } finally { release(); await page.close(); }
    });
  }
  for (const lang of ['en', 'ko']) {
    for (const [width, height] of [[320, 844], [390, 844], [768, 1024], [1440, 960]]) {
      await check(`${lang} ${width}px: readable type, hero, recognition and real device mockup layout`, async () => {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        try {
          await page.goto(base + (lang === 'ko' ? '/ko/' : '/'), { waitUntil: 'networkidle' });
          assert.equal(await page.locator('.release-label').count(), 0);
          assert.equal(await page.locator('.hero-content > :first-child').evaluate(el => el.tagName), 'H1');
          assert.equal(await page.locator('.explorer-tabs svg, .truth-symbol, .ipad-frame, .iphone-frame').count(), 0);
          const layout = await page.evaluate(() => {
            const small = [...document.querySelectorAll('a,p,span,dt,dd,button,figcaption,time')].filter(el => el.getClientRects().length && [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) && Number.parseFloat(getComputedStyle(el).fontSize) < 14).map(el => ({ text: el.textContent.trim().slice(0,60), size: getComputedStyle(el).fontSize }));
            const note = document.querySelector('.hero-note').getBoundingClientRect();
            const bottom = document.querySelector('.hero-bottom').getBoundingClientRect();
            const brand = document.querySelector('.brand').getBoundingClientRect();
            const actions = document.querySelector('.header-actions').getBoundingClientRect();
            return { small, overflow: document.documentElement.scrollWidth - innerWidth, heroGap: bottom.top - note.bottom, headerGap: actions.left-brand.right, awardSize: getComputedStyle(document.querySelector('.recognition-title')).fontSize };
          });
          assert.deepEqual(layout.small, []);
          assert.ok(layout.overflow <= 1, `Horizontal overflow: ${layout.overflow}`);
          assert.ok(layout.heroGap >= 15, `Hero note overlaps lower controls: ${layout.heroGap}`);
          assert.ok(layout.headerGap >= 0, `Header items overlap: ${layout.headerGap}`);
          assert.ok(parseFloat(layout.awardSize) >= 37);
          assert.match(await page.locator('.recognition').innerText(), /Best New Apps and Updates/);
          assert.equal(await page.locator('.recognition time').getAttribute('datetime'), '2026-07');
          await page.locator('#ipad').scrollIntoViewIfNeeded();
          const img = page.locator('[data-media="devicesMockup"]');
          await img.evaluate(img => img.decode());
          assert.ok(await img.evaluate(img => img.naturalWidth > 0 && /devices-studio-\d+\.webp$/.test(img.currentSrc)));
          await page.locator('.device-stage').screenshot({ path: output + `devices-refined-${lang}-${width}.png` });
          await page.locator('.recognition').screenshot({ path: output + `recognition-refined-${lang}-${width}.png` });
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: output + `hero-refined-${lang}-${width}.png` });
          return layout;
        } finally { await page.close(); }
      });
    }
  }
} finally { await browser.close(); }
const summary = { passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, results };
await writeFile(output + 'refinement-checks.json', JSON.stringify(summary, null, 2) + '\n');
process.exitCode = summary.failed ? 1 : 0;
