import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { site, locales } from '../content/site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const media = JSON.parse(await readFile(new URL('../assets/media/manifest.json', import.meta.url), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const arrow = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';

function image(key, alt, { eager = false, className = '', sizes = '100vw' } = {}) {
  const asset = media.assets[key];
  const srcset = asset.variants.map(v => `/assets/media/${v.file} ${v.width}w`).join(', ');
  return `<img class="${className}" data-media="${key}" src="/assets/media/${asset.file}" srcset="${srcset}" sizes="${sizes}" width="${asset.width}" height="${asset.height}" alt="${escape(alt)}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">`;
}

for (const [lang, t] of Object.entries(locales)) {
  const path = lang === 'en' ? '/' : '/ko/';
  const canonical = site.origin + path;
  const screenCaption = media.assets.devicesMockup.generated
    ? t.mockupNote : (lang === 'ko' ? '우주먼지의 실제 앱 화면입니다.' : 'Screens captured from the Dust to Cosmos app.');
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${site.origin}/#organization`, name: 'SnapWorks Lab', url: 'https://snapworkslab.com', contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'sunset@snapworkslab.com' } },
      { '@type': 'WebSite', '@id': `${site.origin}/#website`, name: 'Dust to Cosmos', url: site.origin + '/', inLanguage: ['en', 'ko'], publisher: { '@id': `${site.origin}/#organization` } },
      { '@type': 'SoftwareApplication', '@id': `${site.origin}/#app`, name: 'Dust to Cosmos', alternateName: '우주먼지', applicationCategory: 'EducationalApplication', operatingSystem: 'iOS, iPadOS', availableOnDevice: ['iPhone', 'iPad'], url: site.origin + '/', downloadUrl: site.appStore, sameAs: [site.appStore], description: t.truthText, publisher: { '@id': `${site.origin}/#organization` } },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: t.title, description: t.description, inLanguage: lang, dateModified: site.updated, isPartOf: { '@id': `${site.origin}/#website` }, about: { '@id': `${site.origin}/#app` }, primaryImageOfPage: { '@type': 'ImageObject', url: `${site.origin}/assets/media/social-${lang}.jpg`, caption: t.concept } },
    ],
  };
  const storeLink = (label, className = 'button button-primary') => `<a class="${className}" href="${site.appStore}" aria-label="${escape(t.download)}">${escape(label)}${arrow}</a>`;
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escape(t.title)}</title>
  <meta name="description" content="${escape(t.description)}">
  <meta name="theme-color" content="#050607">
  <meta name="color-scheme" content="dark">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="apple-itunes-app" content="app-id=6760629100">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${site.origin}/">
  <link rel="alternate" hreflang="ko" href="${site.origin}/ko/">
  <link rel="alternate" hreflang="x-default" href="${site.origin}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Dust to Cosmos">
  <meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ko_KR'}">
  <meta property="og:locale:alternate" content="${lang === 'en' ? 'ko_KR' : 'en_US'}">
  <meta property="og:title" content="${escape(t.title)}">
  <meta property="og:description" content="${escape(t.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/assets/media/social-${lang}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escape(t.heroTitle + ' · ' + t.release + ' · ' + t.concept)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(t.title)}">
  <meta name="twitter:description" content="${escape(t.description)}">
  <meta name="twitter:image" content="${site.origin}/assets/media/social-${lang}.jpg">
  <meta name="twitter:image:alt" content="${escape(t.heroAlt)}">
  <link rel="icon" href="/assets/icons/favicon-3.0.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-3.0.png" sizes="180x180">
  <link rel="preload" href="/assets/fonts/GmarketSansMedium.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/GmarketSansBold.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
  <script defer src="/assets/main.js"></script>
  <script defer src="/assets/earth.js"></script>
</head>
<body class="page-home">
  <a href="#main" class="skip-link">${t.skip}</a>
  <header class="site-header">
    <a class="brand" href="${path}" aria-label="${escape(t.brand + ' · ' + t.home)}"><img src="/assets/icons/app-icon-3.0.png" width="32" height="32" alt="">${t.brand}<span class="brand-version">3.0</span></a>
    <nav class="primary-nav" id="navigation" aria-label="${lang === 'ko' ? '주요 메뉴' : 'Main navigation'}">
      ${['new', 'ipad', 'explore', 'faq'].map((id, i) => `<a href="#${id}">${t.nav[i]}</a>`).join('')}
    </nav>
    <div class="header-actions"><nav class="language-switch" aria-label="${lang === 'ko' ? '언어' : 'Language'}"><a href="/" lang="en" hreflang="en" ${lang === 'en' ? 'aria-current="page"' : ''}>EN</a><span aria-hidden="true">/</span><a href="/ko/" lang="ko" hreflang="ko" ${lang === 'ko' ? 'aria-current="page"' : ''}>한국어</a></nav>${storeLink(t.storeShort, 'header-store')}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation" aria-label="${t.menu}" data-open-label="${t.menu}" data-close-label="${t.closeMenu}"><span></span><span></span></button></div>
  </header>
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-visual">${image('earthPoster', t.earthAlt, { eager: true, sizes: '(max-width: 700px) 226vw, 128vh' })}</div>
      <canvas class="earth-canvas" aria-hidden="true" data-state="loading"></canvas>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-content">
        <h1 id="hero-title">${t.heroTitle}</h1>
        <p class="hero-lead">${t.heroLead}</p>
        <p class="hero-description">${t.heroText}</p>
        <div class="hero-actions">${storeLink(t.store)}<a class="text-link" href="#new">${t.discover}${arrow}</a></div>
        <p class="hero-note">${t.heroNote}</p>
      </div>
      <div class="hero-bottom"><a href="#new" class="scroll-cue"><span aria-hidden="true">↓</span>${t.scroll}</a><div class="earth-controls"><button type="button" class="earth-pause" hidden aria-pressed="false" aria-label="${lang === 'ko' ? '지구 자전 멈추기' : 'Pause Earth rotation'}" data-pause="${lang === 'ko' ? '지구 자전 멈추기' : 'Pause Earth rotation'}" data-resume="${lang === 'ko' ? '지구 자전 재생' : 'Resume Earth rotation'}"><span aria-hidden="true">Ⅱ</span></button><span class="poster-note">${lang === 'ko' ? '지구 연출 이미지' : 'Illustrative Earth'}</span><span class="earth-note">${lang === 'ko' ? '지구 자전 연출' : 'Earth in motion'}</span></div></div>
    </section>

    <aside class="recognition" aria-label="${t.featuredIntro}">
      <div class="recognition-main"><img class="recognition-laurel" src="/assets/laurel.svg" width="640" height="165" alt=""><p class="recognition-meta"><span>${t.featuredIntro}</span><time datetime="${site.featuring.month}">${t.featuredMonth}</time></p><h2 class="recognition-title" lang="en">${site.featuring.title}</h2><a class="recognition-link" href="${site.featuring.us}">${t.featuredRegion} ↗</a></div>
      <div class="recognition-detail"><img class="recognition-laurel" src="/assets/laurel.svg" width="640" height="165" alt=""><p class="recognition-secondary" lang="en">${site.featuring.canadaTitle}</p><a class="recognition-link" href="${site.featuring.canada}">${t.featuredCanada} ↗</a></div>
    </aside>

    <section class="cinema section-pad" id="new" aria-labelledby="cinema-title">
      <div class="section-intro"><p class="eyebrow accent">${t.cinemaLabel}</p><h2 id="cinema-title">${t.cinemaTitle}</h2><p class="section-description">${t.cinemaIntro}</p></div>
      <div class="cinema-details">${t.cinemaDetails.map(([title, text], i) => `<article class="feature-line"><span class="index">0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>
      <a class="text-link" href="#pro">${t.cinemaLink}${arrow}</a>
    </section>

    <section class="device-section section-pad" id="ipad" aria-labelledby="ipad-title">
      <div class="device-intro"><p class="eyebrow">${t.ipadLabel}</p><h2 id="ipad-title">${t.ipadTitle}</h2><p class="section-description">${t.ipadIntro}</p></div>
      <figure class="device-figure">
        <div class="device-stage"><div class="actual-devices"><img class="actual-ipad" src="/assets/screens/${lang}-ipad.webp" width="2752" height="2064" alt="${escape(t.devicesAlt)}" loading="lazy"><img class="actual-iphone" src="/assets/screens/${lang}-iphone.webp" width="1206" height="2622" alt="${escape(t.devicesAlt)}" loading="lazy"></div></div>
        <figcaption>${t.mockupNote}</figcaption>
      </figure>
      <div class="device-benefits">${t.devices.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
    </section>

    <section class="voyage" aria-labelledby="voyage-title">
      <div class="voyage-head section-pad"><p class="eyebrow accent">${t.voyageLabel}</p><h2 id="voyage-title">${t.voyageTitle}</h2><p class="section-description">${t.voyageIntro}</p></div>
      <figure class="voyage-figure"><img src="/assets/screens/${lang}-voyage.webp" width="2752" height="2064" alt="${escape(t.voyageAlt)}" loading="lazy"><figcaption>${t.voyageNote}</figcaption></figure>
      <div class="voyage-statistics section-pad">${t.voyageFacts.map(([number, label]) => `<div><span>${number}</span><p>${label}</p></div>`).join('')}</div>
      <div class="journey-details section-pad">${t.journeys.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
    </section>

    <section class="explore-section section-pad" id="explore" aria-labelledby="explore-title">
      <p class="eyebrow accent">${t.exploreLabel}</p><h2 id="explore-title">${t.exploreTitle}</h2>
      <div class="explorer">
        <div class="explorer-tabs" aria-label="${t.tabsLabel}">${t.tabs.map((tab, i) => `<button type="button" id="explorer-tab-${i}" data-explorer-tab="${i}" aria-controls="explorer-panel-${i}"><span>${tab.name}</span><span class="tab-number">${tab.number}</span></button>`).join('')}</div>
        <div class="explorer-content">${t.tabs.map((tab, i) => `<div class="explorer-panel" id="explorer-panel-${i}" aria-labelledby="explorer-heading-${i}"><div class="explorer-panel-intro"><span class="panel-number" aria-hidden="true">${tab.number}</span><h3 id="explorer-heading-${i}">${tab.title}</h3><p>${tab.text}</p></div><dl>${tab.items.map(([title, text]) => `<div><dt>${title}</dt><dd>${text}</dd></div>`).join('')}</dl></div>`).join('')}</div>
      </div>
    </section>

    <section class="pro-section section-pad" id="pro" aria-labelledby="pro-title"><div class="pro-intro"><p class="eyebrow accent">${t.proLabel}</p><h2 id="pro-title">${t.proTitle}</h2><p class="section-description">${t.proIntro}</p><p class="fine-print">${t.proNote}</p></div><div class="pro-details"><ul>${t.proList.map(item => `<li><span aria-hidden="true">↗</span>${item}</li>`).join('')}</ul><div class="free-note"><h3>${t.freeTitle}</h3><p>${t.freeText}</p></div></div></section>

    <section class="truth-section section-pad" id="sources" aria-labelledby="truth-title"><figure class="science-figure">${image('scienceArt', t.scienceAlt, { sizes: '(max-width: 700px) 90vw, 35vw' })}<figcaption>${t.scienceNote}</figcaption></figure><div><h2 id="truth-title">${t.truthTitle}</h2><p>${t.truthText}</p><nav class="source-links" aria-label="${t.sourceLabel}"><a href="https://science.nasa.gov/">NASA Science ↗</a><a href="https://ssd.jpl.nasa.gov/horizons/">JPL Horizons ↗</a><a href="https://naif.jpl.nasa.gov/naif/">NAIF ↗</a><a href="https://exoplanetarchive.ipac.caltech.edu/">NASA Exoplanet Archive ↗</a></nav><p class="fine-print">${t.sourceNote}</p><p class="fine-print earth-credit">${lang === 'ko' ? '메인 지구 텍스처: ' : 'Hero Earth textures: '}<a href="https://www.solarsystemscope.com/textures/">Solar System Scope / INOVE</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. ${lang === 'ko' ? 'NASA 기반 자료를 축소·변환하고 조명·대기·빠르게 흐르는 자전 연출을 더했습니다. 현재 구름 관측이나 실제 앱 렌더 캡처는 아닙니다.' : 'NASA-based maps, resized and converted, with illustrative lighting, atmosphere and accelerated rotation. Not current cloud observations or a native app capture.'}</p></div></section>

    <section class="faq-section section-pad" id="faq" aria-labelledby="faq-title"><h2 id="faq-title">${t.faqTitle}</h2><div class="faq-list">${t.faq.map(([question, answer]) => `<details><summary>${question}<span aria-hidden="true">+</span></summary><p>${answer}</p></details>`).join('')}</div></section>

    <section class="final-cta section-pad" aria-labelledby="final-title"><img class="final-icon" src="/assets/icons/app-icon-3.0.png" width="80" height="80" alt="" loading="lazy"><p class="eyebrow accent">${t.release}</p><h2 id="final-title">${t.finalTitle}</h2><p>${t.finalText}</p>${storeLink(t.store)}<p class="fine-print">${t.download} · iPhone & iPad</p></section>
  </main>
  <footer class="site-footer section-pad"><div><a class="footer-brand" href="${path}">${t.brand}</a><p>${t.footerText}</p></div><nav aria-label="${lang === 'ko' ? '하단 메뉴' : 'Footer navigation'}"><a href="/privacy/">${t.privacy}</a><a href="/support/">${t.support}</a><a href="#sources">${t.sources}</a><a href="https://snapworkslab.com">SnapWorks Lab ↗</a></nav><div class="footer-bottom"><span>© 2026 SnapWorks Lab</span><time datetime="${site.updated}">${t.updated}</time></div></footer>
</body>
</html>
`;
  await mkdir(root + path, { recursive: true });
  await writeFile(root + path + 'index.html', html);
}

const alternates = Object.keys(locales).map(lang => `<xhtml:link rel="alternate" hreflang="${lang}" href="${site.origin}${lang === 'en' ? '/' : '/ko/'}"/>`).join('');
await writeFile(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${['/', '/ko/', '/privacy/', '/support/'].map(path => `  <url><loc>${site.origin}${path}</loc><lastmod>${site.updated}</lastmod>${path === '/' || path === '/ko/' ? alternates + `<xhtml:link rel="alternate" hreflang="x-default" href="${site.origin}/"/>` : ''}</url>`).join('\n')}\n</urlset>\n`);
console.log('Built English and Korean static landing pages and sitemap.');

// Keep the optional machine-readable summary aligned with visible copy. It is
// a convenience for readers, not a special requirement for AI search inclusion.
await writeFile(root + 'llms.txt', `# Dust to Cosmos — 우주먼지\n\n> ${locales.en.truthText}\n\nUpdated: ${site.updated}. Version 3.0 is upcoming; the App Store link opens the currently published version.\n\n## Official pages\n- [English](${site.origin}/)\n- [한국어](${site.origin}/ko/)\n- [App Store](${site.appStore})\n- [Support](${site.origin}/support/)\n- [Privacy](${site.origin}/privacy/)\n\n## Product facts\n${locales.en.faq.map(([q,a])=>`### ${q}\n${a}`).join('\n\n')}\n\n## Pro experiences\n${locales.en.proList.map(s=>'- '+s).join('\n')}\n\n## Scientific context\nRecent cloud observations may be delayed or missing. Data timestamps remain visible. Flight obstacles, early Earth environments and black hole effects are explanatory models. The website globe is illustrative, not the native app renderer or a live weather feed.\n\n- [NASA Science](https://science.nasa.gov/)\n- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)\n- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)\n`);
