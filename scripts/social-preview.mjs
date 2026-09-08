import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { site, locales } from '../content/site.mjs';

const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const { chromium } = require('playwright');
const baseURL = process.env.DTC_PREVIEW_URL || 'http://127.0.0.1:8893';
const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ headless: true });
try {
  for (const [lang, t] of Object.entries(locales)) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto(baseURL);
    await page.setContent(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#050607;color:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo',sans-serif;position:relative;overflow:hidden}.earth{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#050607ef 0%,#05060790 35%,transparent 80%)}main{position:relative;padding:68px;width:720px}.brand{font-size:18px;color:#b6c5d0;display:flex;align-items:center;gap:12px}.brand img{width:35px;height:35px;border-radius:9px}h1{font-size:88px;line-height:1.02;font-weight:550;letter-spacing:-.06em;margin:60px 0 25px;max-width:630px;word-break:keep-all;text-wrap:balance}p{font-size:24px;letter-spacing:-.03em}.status{color:#b0dffa;font-size:16px;letter-spacing:.02em}.note{position:absolute;bottom:30px;left:68px;font-size:12px;color:#9eabb5}.domain{position:absolute;bottom:30px;right:40px;color:#a6b8c5;font-size:13px}
    </style></head><body><img class="earth" src="${baseURL}/assets/media/earth-hero-1672.webp" alt=""><div class="shade"></div><main><div class="brand"><img src="${baseURL}/assets/icons/app-icon-3.0.png" alt="">iPhone & iPad</div><h1>${t.heroTitle}</h1><p>${t.heroLead}</p><p class="status">${t.release}</p></main><div class="note">${t.concept}</div><div class="domain">${new URL(site.origin).host}</div></body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    await page.screenshot({ path: root + `assets/media/social-${lang}.jpg`, type: 'jpeg', quality: 90 });
    await page.close();
  }
} finally { await browser.close(); }
console.log('Generated two 1200×630 social cards from HTML and the generated hero asset.');
