(() => {
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const getMotionScale = () => (reduceMotionQuery.matches ? 0.5 : 1);
  const canvas = document.getElementById('starfield');

  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let stars = [];
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let lastTime = 0;
  let driftX = 0;
  let driftY = 0;

  function createStars() {
    const area = width * height;
    const count = Math.min(340, Math.max(170, Math.floor(area / 7000)));

    stars = Array.from({ length: count }, () => {
      const isBright = Math.random() < 0.22;
      const x = Math.random() * width;
      const y = Math.random() * height;

      return {
        x,
        y,
        r: isBright ? Math.random() * 1.04 + 0.52 : Math.random() * 0.84 + 0.256,
        base: isBright ? Math.random() * 0.09 + 0.30 : Math.random() * 0.09 + 0.16, // Base alpha
        // Twinkle + sparkle parameters
        twinkle: isBright ? (Math.random() * 0.08 + 0.06) : (Math.random() * 0.04 + 0.03),
        twinkleSpd: isBright ? (Math.random() * 0.05 + 0.02) : (Math.random() * 0.035 + 0.012),
        sparkle: isBright ? (Math.random() * 0.32 + 0.16) : (Math.random() * 0.16 + 0.08),
        sparkleSpd: isBright ? (Math.random() * 0.15 + 0.05) : (Math.random() * 0.1 + 0.03),
        sparklePhase: Math.random() * Math.PI * 2,
        isBright,
        t: Math.random() * Math.PI * 2,
      };
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
  }

  function frame(timestamp) {
    const dt = Math.min(2, (timestamp - lastTime) / (1000 / 60));
    lastTime = timestamp;
    const motionScale = getMotionScale();
    driftX += dt * 0.048 * motionScale;
    driftY += dt * 0.022 * motionScale;
    driftX = ((driftX % width) + width) % width;
    driftY = ((driftY % height) + height) % height;

    const t = timestamp * 0.001;
    ctx.clearRect(0, 0, width, height);

    // Subtle background glow
    const gradient = ctx.createRadialGradient(width * 0.78, height * 0.2, 0, width * 0.78, height * 0.2, Math.max(width, height) * 0.65);
    gradient.addColorStop(0, 'rgba(112, 155, 255, 0.06)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const star of stars) {
      const x = (star.x + driftX) % width;
      const y = (star.y + driftY) % height;

      const wave = Math.sin(t * star.twinkleSpd + star.t) * star.twinkle;
      const spark = Math.pow(Math.max(0, Math.sin(t * star.sparkleSpd + star.sparklePhase)), 18);
      const alpha = Math.min(
        1,
        Math.max(0.10, star.base + wave + spark * star.sparkle)
      );

      const glowLevel = Math.min(1, Math.max(0, spark * 1.2 + Math.max(0, wave) * 0.3));
      if (glowLevel > 0.08) {
        const sparkSizeScale = 0.75;
        const baseLen = star.r * (3.3 + glowLevel * 10) * (star.isBright ? 1.10 : 0.93) * sparkSizeScale;
        const angleBase = t * 0.02 + star.t;
        const softLen = star.r * (2.8 + glowLevel * 10.5) * sparkSizeScale;

        ctx.save();
        ctx.translate(x, y);
        ctx.globalCompositeOperation = 'lighter';
        const widthPx = Math.max(0.18, 0.10 + glowLevel * 0.8);
        const peak = alpha * (0.2 + glowLevel * 1.0);

        const softGlow = ctx.createRadialGradient(0, 0, Math.max(0.1125, star.r * 0.15), 0, 0, softLen);
        softGlow.addColorStop(0, `rgba(210, 235, 255, ${Math.min(0.18, alpha * 0.16)})`);
        softGlow.addColorStop(0.38, `rgba(198, 224, 255, ${Math.min(0.10, alpha * (0.08 + glowLevel * 0.1))})`);
        softGlow.addColorStop(1, 'rgba(180, 220, 255, 0)');

        ctx.globalAlpha = 1;
        ctx.filter = 'blur(1.1px)';
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.fillStyle = softGlow;
        ctx.arc(0, 0, softLen, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';

        ctx.globalCompositeOperation = 'lighter';

        const crossLayers = [
          { scale: 1, angleOffset: 0, widthScale: 1 },
          { scale: 0.4, angleOffset: Math.PI / 4, widthScale: 0.75 }
        ];

        for (const layer of crossLayers) {
          const len = baseLen * layer.scale;
          const lineW = Math.max(0.05, widthPx * layer.widthScale * sparkSizeScale);
          for (let i = 0; i < 2; i++) {
            const a = angleBase + layer.angleOffset + i * Math.PI * 0.5;
            const dx = Math.cos(a);
            const dy = Math.sin(a);

            const sparkGlow = ctx.createLinearGradient(-dx * len, -dy * len, dx * len, dy * len);
            sparkGlow.addColorStop(0, 'rgba(210, 235, 255, 0)');
            sparkGlow.addColorStop(0.5, `rgba(210, 235, 255, ${Math.min(0.55, peak * 0.8)})`);
            sparkGlow.addColorStop(1, 'rgba(210, 235, 255, 0)');

            ctx.beginPath();
            ctx.strokeStyle = sparkGlow;
            ctx.lineWidth = lineW;
            ctx.lineCap = 'round';
            ctx.moveTo(-dx * len, -dy * len);
            ctx.lineTo(dx * len, dy * len);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  lastTime = performance.now();
  requestAnimationFrame((now) => frame(now));

  // Language Switching Logic
  const langEnBtn = document.getElementById('lang-en');
  const langKoBtn = document.getElementById('lang-ko');
  const translatableElements = document.querySelectorAll('[data-en]');

  function setLanguage(lang) {
    document.documentElement.lang = lang;
    translatableElements.forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        if (el.tagName === 'TITLE') {
          document.title = text;
        } else {
          el.innerHTML = text.replace(/\\n/g, '<br>');
        }
      }
    });

    // Update buttons
    if (lang === 'ko') {
      langKoBtn?.classList.add('active');
      langEnBtn?.classList.remove('active');
      langKoBtn?.setAttribute('aria-pressed', 'true');
      langEnBtn?.setAttribute('aria-pressed', 'false');
    } else {
      langEnBtn?.classList.add('active');
      langKoBtn?.classList.remove('active');
      langEnBtn?.setAttribute('aria-pressed', 'true');
      langKoBtn?.setAttribute('aria-pressed', 'false');
    }

    localStorage.setItem('preferred-lang', lang);
  }

  langEnBtn?.addEventListener('click', () => setLanguage('en'));
  langKoBtn?.addEventListener('click', () => setLanguage('ko'));

  // Init language
  const savedLang = localStorage.getItem('preferred-lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');
  setLanguage(savedLang);
})();
