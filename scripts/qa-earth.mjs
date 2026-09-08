import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const baseURL = process.env.DTC_PREVIEW_URL || 'http://127.0.0.1:8893';
const output = fileURLToPath(new URL('../docs/phase_reports/artifacts/landing_3_0/', import.meta.url));
await mkdir(output, { recursive: true });
const results = [];
const environment = { headless: process.env.DTC_HEADFUL !== '1' };
const test = async (name, fn) => { console.log('Checking: ' + name); try { const evidence = await fn(); results.push({ name, status: 'pass', evidence }); } catch (error) { results.push({ name, status: 'fail', error: error.message }); } console.log(results.at(-1).status + ': ' + name); };
const browser = await chromium.launch({ headless: environment.headless });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    window.earthDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas.classList.contains('earth-canvas')) window.earthDraws++;
      return draw.apply(this, args);
    };
  });
  await page.goto(baseURL + '/ko/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state === 'ready', null, { timeout: 30000 });
  environment.renderer = await page.evaluate(() => {
    const gl = document.querySelector('.earth-canvas').getContext('webgl2');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
  });
  await page.waitForTimeout(1400);
  await test('3D rotation changes the rendered globe pixels over five seconds', async () => {
    const first = await page.screenshot({ path: output + 'earth-rotation-start.png' });
    const start = await page.evaluate(() => window.earthDraws);
    await page.waitForTimeout(5000);
    const second = await page.screenshot({ path: output + 'earth-rotation-five-seconds.png' });
    const end = await page.evaluate(() => window.earthDraws);
    const a = await sharp(first).extract({ left: 720, top: 100, width: 650, height: 700 }).removeAlpha().raw().toBuffer();
    const b = await sharp(second).extract({ left: 720, top: 100, width: 650, height: 700 }).removeAlpha().raw().toBuffer();
    let changed = 0;
    for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]) > 12) changed++;
    assert.ok(changed > 3000, 'Rotating surface must visibly change; a static poster does not pass.');
    // This is a motion check, not a speed requirement for software WebGL in CI.
    assert.ok(end - start > 1, 'Multiple rendered frames expected.');
    return { changedGlobePixels: changed, inspectedPixels: a.length / 3, drawsDuringCapture: end - start, note: 'Five seconds of actual animation; screenshot readback is not a device performance benchmark.' };
  });
  await test('Pause holds the globe, then Resume restarts it', async () => {
    await page.locator('.earth-pause').click();
    assert.equal(await page.locator('.earth-pause').getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(100);
    const first = await page.evaluate(() => window.earthDraws);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.earthDraws), first);
    await page.locator('.earth-pause').click();
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(() => window.earthDraws) > first);
  });
  await test('Offscreen hero stops drawing and resumes when visible', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#pro').scrollIntoViewIfNeeded();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(250);
    const first = await page.evaluate(() => window.earthDraws);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.earthDraws), first);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(() => window.earthDraws) > first);
  });
  await test('Page visibility suspension stops GPU drawing', async () => {
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const first = await page.evaluate(() => window.earthDraws);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.earthDraws), first);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(() => window.earthDraws) > first);
    return 'Visibility event injection; offscreen suspension was checked through an actual scroll.';
  });
  await test('Reduced motion stops an already-running scene', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches, null, { polling: 100, timeout: 5000 });
    await page.waitForTimeout(250);
    const first = await page.evaluate(() => window.earthDraws);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.earthDraws), first);
    assert.equal(await page.locator('.earth-pause').isVisible(), false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await test('Phone and iPad sizes keep a live, correctly sized canvas', async () => {
    for (const [name, width, height] of [['phone', 390, 844], ['tablet', 1180, 820]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(350);
      const sizes = await page.locator('.earth-canvas').evaluate(canvas => ({ width: canvas.clientWidth, height: canvas.clientHeight, ready: canvas.dataset.state }));
      assert.equal(sizes.width, width);
      assert.equal(sizes.ready, 'ready');
      await page.screenshot({ path: output + `earth-live-${name}.png`, animations: 'disabled' });
    }
  });
  await test('WebGL context loss restores the matching first frame', async () => {
    await page.evaluate(() => document.querySelector('.earth-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(() => !document.querySelector('.hero').classList.contains('earth-ready'));
    assert.equal(await page.locator('.earth-pause').isVisible(), false);
    assert.equal(await page.locator('.earth-canvas').getAttribute('data-state'), 'fallback');
    await page.waitForTimeout(1300);
    assert.equal(await page.locator('.hero-visual').evaluate(element => getComputedStyle(element).opacity), '1');
  });
  await page.close();
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  const fetched = [];
  reducedPage.on('request', request => { if (request.url().includes('/assets/earth/')) fetched.push(request.url()); });
  await reducedPage.goto(baseURL + '/ko/', { waitUntil: 'networkidle' });
  await test('Initial reduced motion avoids all 3D texture downloads', async () => {
    assert.equal(await reducedPage.locator('.earth-canvas').getAttribute('data-state'), 'reduced-motion');
    assert.deepEqual(fetched, []);
    assert.equal(await reducedPage.locator('.earth-pause').isVisible(), false);
  });
  await reduced.close();
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); }; });
  await fallback.goto(baseURL + '/', { waitUntil: 'networkidle' });
  await test('Unavailable WebGL keeps the page and poster usable', async () => {
    await fallback.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state === 'fallback');
    assert.equal(await fallback.locator('.hero h1').isVisible(), true);
    assert.equal(await fallback.locator('.hero-actions .button').isVisible(), true);
    assert.equal(await fallback.locator('.earth-pause').isVisible(), false);
  });
  await fallback.close();
} finally { await browser.close(); }
const summary = { environment, passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, results };
await writeFile(output + 'earth-checks.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.failed ? 1 : 0;
