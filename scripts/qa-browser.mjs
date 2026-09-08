import { createRequire } from 'node:module';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const { chromium, webkit } = require('playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const baseURL = process.env.DTC_PREVIEW_URL || 'http://127.0.0.1:8893';
const evidence = root + 'docs/phase_reports/artifacts/landing_3_0/';
const axePath = process.env.DTC_AXE_PATH || root + '.qa/node_modules/axe-core/axe.min.js';
await mkdir(evidence, { recursive: true });
const results = { checkedAt: new Date().toISOString(), baseURL, checks: [], screenshots: [], accessibility: [], performance: [], limitations: [] };
const test = async (name, fn) => {
  try { await fn(); results.checks.push({ name, status: 'pass' }); }
  catch (error) { results.checks.push({ name, status: 'fail', error: error.message }); }
};
const browser = await chromium.launch({ headless: true });
try {
  for (const lang of ['en', 'ko']) {
    const route = lang === 'en' ? '/' : '/ko/';
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.text().startsWith('Earth preview uses')) errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(baseURL)) errors.push(response.status() + ' ' + response.url()); });
    await page.addInitScript(() => {
      window.siteMetrics = { cls: 0, lcp: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.siteMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => { window.siteMetrics.lcp = list.getEntries().at(-1).startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const response = await page.goto(baseURL + route, { waitUntil: 'load' });
    await page.locator('.hero h1').waitFor();
    await page.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state === 'ready');
    await page.waitForTimeout(1300);
    await test(`${lang}: loopback preview is noindex`, async () => assert.match(response.headers()['x-robots-tag'], /noindex/));
    await test(`${lang}: dark-only page with either OS theme`, async () => {
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme });
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
        const background = await page.locator('#ipad').evaluate(element => getComputedStyle(element).backgroundColor);
        assert.ok(background.match(/\d+/g).slice(0, 3).every(channel => Number(channel) < 32), background);
      }
    });
    await page.screenshot({ path: evidence + `desktop-${lang}.png`, animations: 'disabled' });
    results.screenshots.push(`desktop-${lang}.png`);
    results.performance.push({ lang, viewport: '1440×960, unthrottled loopback', ...(await page.evaluate(() => ({ ...window.siteMetrics, resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, bytes: r.transferSize })), domBytes: document.documentElement.outerHTML.length }))) });
    await test(`${lang}: all four exploration destinations and keyboard navigation`, async () => {
      const tabs = page.getByRole('tab');
      for (let i = 0; i < 4; i++) {
        await tabs.nth(i).click();
        assert.equal(await tabs.nth(i).getAttribute('aria-selected'), 'true');
        assert.equal(await page.getByRole('tabpanel').count(), 1);
        assert.equal(await page.locator(`#explorer-panel-${i}`).isVisible(), true);
      }
      await tabs.last().press('ArrowRight');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      await tabs.first().press('End');
      assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
      await tabs.last().press('Home');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
    });
    await test(`${lang}: FAQ opens and closes with keyboard`, async () => {
      const first = page.locator('details').first();
      await first.locator('summary').focus();
      await first.locator('summary').press('Enter');
      assert.equal(await first.getAttribute('open'), '');
      assert.equal(await first.locator('p').isVisible(), true);
      await first.locator('summary').press('Enter');
      assert.equal(await first.getAttribute('open'), null);
    });
    for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [1180, 820], [1440, 960]]) {
      await page.setViewportSize({ width, height });
      await test(`${lang}: layout fits ${width}×${height}`, async () => {
        const layout = await page.evaluate(() => {
          const cta = document.querySelector('.hero-actions .button').getBoundingClientRect();
          return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, ctaTop: cta.top + scrollY, ctaBottom: cta.bottom + scrollY };
        });
        assert.ok(layout.scrollWidth <= width + 1, JSON.stringify(layout));
        assert.ok(layout.ctaBottom < height, 'Primary CTA must fit in the first viewport: ' + JSON.stringify(layout));
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL + route, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state !== 'loading', null, { polling: 100 });
    assert.equal(await page.locator('.earth-canvas').getAttribute('data-state'), 'ready', JSON.stringify(errors));
    await page.waitForTimeout(1300);
    await page.screenshot({ path: evidence + `phone-${lang}.png`, animations: 'disabled' });
    results.screenshots.push(`phone-${lang}.png`);
    await test(`${lang}: mobile menu opens, closes on Escape and navigates`, async () => {
      const toggle = page.locator('.menu-toggle');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      await toggle.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.menu-toggle')), true);
      await toggle.click();
      await page.locator('.primary-nav a[href="#ipad"]').click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.ok(page.url().endsWith('#ipad'));
    });
    await test(`${lang}: language links use dedicated static routes`, async () => {
      const other = lang === 'en' ? '/ko/' : '/';
      await page.locator(`.language-switch a[href="${other}"]`).click();
      assert.equal(new URL(page.url()).pathname, other);
      assert.equal(await page.locator('html').getAttribute('lang'), lang === 'en' ? 'ko' : 'en');
    });
    await page.goto(baseURL + route, { waitUntil: 'load' });
    for (const selector of ['#ipad', '.voyage-figure', '.final-cta']) await page.locator(selector).scrollIntoViewIfNeeded();
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    await test(`${lang}: every page image decodes`, async () => assert.equal(await page.evaluate(() => [...document.images].every(image => image.naturalWidth > 0)), true));
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.locator('#ipad').scrollIntoViewIfNeeded();
    await page.evaluate(() => Promise.all([...document.querySelectorAll('#ipad img')].map(image => image.decode())));
    await page.locator('#ipad').screenshot({ path: evidence + `ipad-section-${lang}.png`, animations: 'disabled' });
    results.screenshots.push(`ipad-section-${lang}.png`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await test(`${lang}: reduced motion removes CSS animations and smooth scrolling`, async () => {
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      const animation = await page.locator('.hero-content h1').evaluate(element => getComputedStyle(element).animationName);
      assert.equal(animation, 'none');
    });
    for (const [width, height] of [[390, 844], [1440, 960]]) {
      await page.setViewportSize({ width, height });
      await page.addScriptTag({ path: axePath });
      const report = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
      results.accessibility.push({ lang, width, violations: report.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), passes: report.passes.length, incomplete: report.incomplete.map(v => v.id) });
      await test(`${lang}: axe accessibility at ${width}px`, async () => assert.equal(report.violations.length, 0, JSON.stringify(results.accessibility.at(-1).violations)));
    }
    await test(`${lang}: no browser errors or broken local requests`, async () => assert.deepEqual(errors, []));
    await page.close();
    console.log(`Completed Chromium checks for ${lang}.`);
  }
  for (const lang of ['en', 'ko']) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(baseURL + (lang === 'en' ? '/' : '/ko/'));
    await test(`${lang}: no-JavaScript content and navigation`, async () => {
      for (let i = 0; i < 4; i++) assert.equal(await page.locator(`#explorer-panel-${i}`).isVisible(), true);
      assert.equal(await page.locator('.primary-nav').isVisible(), true);
      assert.equal(await page.locator('.menu-toggle').isVisible(), false);
      await page.locator('details summary').first().click();
      assert.equal(await page.locator('details p').first().isVisible(), true);
    });
    await context.close();
  }
  for (const route of ['/privacy/', '/support/']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(baseURL + route);
    await page.addScriptTag({ path: axePath });
    const report = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
    await test(`${route}: readable layout and accessibility`, async () => {
      assert.equal(await page.locator('h1').isVisible(), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(report.violations.length, 0, JSON.stringify(report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))));
    });
    await page.close();
  }
} finally { await browser.close(); }

try {
  await access(webkit.executablePath());
  const safari = await webkit.launch({ headless: true });
  try {
    const page = await safari.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
    await test('WebKit: live 3D Earth and pause control', async () => {
      await page.goto(baseURL + '/ko/', { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelector('.earth-canvas').dataset.state === 'ready', null, { timeout: 30000 });
      await page.locator('.earth-pause').click();
      assert.equal(await page.locator('.earth-pause').getAttribute('aria-pressed'), 'true');
      await page.waitForTimeout(1300);
      await page.screenshot({ path: evidence + 'webkit-earth.png', animations: 'disabled' });
      results.screenshots.push('webkit-earth.png');
    });
    await test('WebKit: iPad viewport, images and feature switching', async () => {
      await page.goto(baseURL + '/ko/', { waitUntil: 'load' });
      await page.getByRole('tab').nth(2).click();
      assert.equal(await page.locator('#explorer-panel-2').isVisible(), true);
      await page.locator('#ipad').scrollIntoViewIfNeeded();
      await page.evaluate(() => Promise.all([...document.querySelectorAll('#ipad img')].map(image => image.decode())));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#ipad').screenshot({ path: evidence + 'webkit-ipad.png', animations: 'disabled' });
      results.screenshots.push('webkit-ipad.png');
    });
  } finally { await safari.close(); }
} catch (error) { results.limitations.push('WebKit unavailable in this runtime: ' + error.message); }
results.summary = { passed: results.checks.filter(c => c.status === 'pass').length, failed: results.checks.filter(c => c.status === 'fail').length };
await writeFile(evidence + 'browser-checks.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify({ ...results.summary, failures: results.checks.filter(c => c.status === 'fail'), limitations: results.limitations }, null, 2));
process.exitCode = results.summary.failed ? 1 : 0;
