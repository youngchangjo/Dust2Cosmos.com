// Public marketing data only; actual payment pricing always comes from StoreKit.
export function campaignMarket(c, storefront, now) {
  if (!c || c.schemaVersion !== 1 || c.campaignID !== 'pro-3-0-launch' || c.enabled !== true ||
      c.productID !== 'com.dusttocosmos.app.pro' || c.minimumAppVersion !== '3.0') return null;
  const start = Date.parse(c.startsAt), end = Date.parse(c.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || now < start || now >= end) return null;
  const matches = c.markets?.filter(m => m.storefront === storefront) ?? [];
  if (matches.length !== 1) return null;
  const market = matches[0];
  if (!/^[A-Z]{3}$/.test(market.currency) || !(Number(market.price) > 0) || !(Number(market.regularPrice) > Number(market.price))) return null;
  try { new Intl.DateTimeFormat('en', {timeZone: market.timeZone}).format(end); } catch { return null; }
  return market;
}

export function startCampaignBanner(element, {endpoint = '/assets/pro-launch-campaign.json', fetcher = fetch, tick = () => performance.now()} = {}) {
  let receipt = null, generation = 0;
  const korean = document.documentElement.lang === 'ko';
  const region = korean ? 'KOR' : 'USA';
  const refresh = async () => {
    const requestGeneration = ++generation;
    if (document.hidden) return;
    try {
      const response = await fetcher(endpoint, {cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(8000)});
      const serverDate = Date.parse(response.headers.get('Date'));
      const age = Number(response.headers.get('Age') ?? 0);
      if (!response.ok || !Number.isFinite(serverDate) || !Number.isFinite(age) || age < 0 || age > 60 ||
          !response.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('Unavailable campaign');
      const body = await response.text();
      if (requestGeneration !== generation || document.hidden) return;
      if (body.length > 32768) throw new Error('Invalid campaign');
      receipt = {campaign: JSON.parse(body), date: serverDate + age * 1000, received: tick()};
      render();
    } catch {
      if (requestGeneration === generation) { receipt = null; element.hidden = true; }
    }
  };
  const render = () => {
    element.hidden = true;
    if (!receipt || document.hidden) return;
    const elapsed = tick() - receipt.received;
    if (elapsed < 0 || elapsed >= 300000) return;
    const c = receipt.campaign, market = campaignMarket(c, region, receipt.date + elapsed);
    if (!market) return;
    const date = new Intl.DateTimeFormat(korean ? 'ko-KR' : 'en-US', {month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:market.timeZone}).format(Date.parse(c.endsAt));
    element.querySelector('[data-campaign-title]').textContent = korean ? '3.0 출시 기념 혜택' : '3.0 launch offer';
    element.querySelector('[data-campaign-end]').textContent = (korean ? '종료 ' : 'Ends ') + date + ' · ' + (korean && market.timeZone === 'Asia/Seoul' ? '한국시간' : market.timeZone);
    element.querySelector('[data-campaign-note]').textContent = korean ? '한국 App Store 대상 · 3.0 출시 후 앱에서 행사 가격을 확인하세요. 한 번 구매 · 구독 없음.' : 'US App Store offer · Check the offer price in the app after 3.0 launches. One purchase, no subscription.';
    element.hidden = false;
  };
  const timer = setInterval(render, 1000);
  const reload = setInterval(refresh, 60000);
  const onVisibility = () => { if (document.hidden) { ++generation; receipt = null; element.hidden = true; } else refresh(); };
  document.addEventListener('visibilitychange', onVisibility);
  refresh();
  return () => { ++generation; clearInterval(timer); clearInterval(reload); document.removeEventListener('visibilitychange', onVisibility); element.hidden = true; };
}

if (typeof document !== 'undefined') {
  const element = document.querySelector('[data-pro-campaign]');
  if (element) startCampaignBanner(element);
}
