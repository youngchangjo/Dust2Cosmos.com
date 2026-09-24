(() => {
  const googleAnalyticsMeasurementId = 'G-XZEX3FRFBS';

  if (!googleAnalyticsMeasurementId) {
    return;
  }

  if (!/^G-[A-Z0-9]+$/.test(googleAnalyticsMeasurementId)) {
    console.warn('Dust to Cosmos analytics: invalid Google Analytics Measurement ID.');
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const googleTagScript = document.createElement('script');
  googleTagScript.async = true;
  googleTagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsMeasurementId)}`;
  document.head.appendChild(googleTagScript);

  window.gtag('js', new Date());
  window.gtag('config', googleAnalyticsMeasurementId);
})();
