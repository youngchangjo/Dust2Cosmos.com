/* Illustrative, genuinely rotating 3D sphere. No native app renderer or live feed.
   Texture attribution and transformations: /assets/earth/credits.json (CC BY 4.0).
   A single analytical sphere draw avoids a framework and mesh-edge aliasing. */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.earth-canvas');
  const button = document.querySelector('.earth-pause');
  if (!hero || !canvas || !button) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) canvas.dataset.state = 'reduced-motion';
  let initialized = false;
  let ready = false;
  let visible = true;
  let paused = false;
  let lost = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let draw = () => {};

  const animate = now => {
    frame = 0;
    if (!ready || !visible || paused || lost || motion.matches || document.hidden) return;
    if (!previous) previous = now;
    const delta = now - previous;
    // A stationary camera and a 16-minute revolution need only 30 rendered FPS.
    if (delta >= 1000 / 30 - 1) {
      elapsed += Math.min(delta, 100) / 1000;
      previous = now;
      draw(elapsed);
    }
    frame = requestAnimationFrame(animate);
  };
  const sync = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    button.hidden = !ready || motion.matches || lost;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? button.dataset.resume : button.dataset.pause);
    button.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
    if (ready && visible && !paused && !lost && !motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  };
  button.addEventListener('click', () => { paused = !paused; sync(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; });
  window.addEventListener('pageshow', sync);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    hero.classList.remove('earth-ready');
    canvas.dataset.state = 'fallback';
    sync();
  });

  const boot = async () => {
    if (initialized || motion.matches) return;
    initialized = true;
    let gl;
    try {
      gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power', depth: false, stencil: false });
      if (!gl) { canvas.dataset.state = 'fallback'; return; }
      const vertex = `#version 300 es
        void main() {
          vec2 positions[3] = vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
          gl_Position = vec4(positions[gl_VertexID],0.,1.);
        }`;
      const fragment = `#version 300 es
        precision highp float;
        uniform vec3 uGlobe;
        uniform float uTime;
        uniform sampler2D uDay;
        uniform sampler2D uClouds;
        uniform sampler2D uNight;
        uniform sampler2D uOcean;
        uniform sampler2D uNormal;
        out vec4 outColor;
        const float PI = 3.14159265359;
        mat3 rotateY(float a) { float s=sin(a),c=cos(a); return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
        mat3 rotateX(float a) { float s=sin(a),c=cos(a); return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
        mat3 rotateZ(float a) { float s=sin(a),c=cos(a); return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
        vec2 sphereUV(vec3 n) { return vec2(atan(n.x,n.z)/(2.*PI)+.5,asin(clamp(n.y,-1.,1.))/PI+.5); }
        vec3 linear(vec3 c) { return pow(c,vec3(2.2)); }
        vec3 displayColor(vec3 c) { return pow(max(c,vec3(0.)),vec3(1./2.2)); }
        vec4 sampleMap(sampler2D map, vec2 uv) {
          vec2 dx=dFdx(uv),dy=dFdy(uv);
          dx.x-=round(dx.x); dy.x-=round(dy.x);
          return textureGrad(map,uv,dx,dy);
        }
        float cloud(vec3 n, mat3 basis) { return smoothstep(.07,.83,sampleMap(uClouds,sphereUV(basis*normalize(n))).r); }
        void main() {
          vec2 p=(gl_FragCoord.xy-uGlobe.xy)/uGlobe.z;
          float radius=length(p);
          vec3 sun=normalize(vec3(1.25,.65,1.15));
          vec3 sky=linear(vec3(5.,6.,7.)/255.);
          // Light around the atmosphere is deliberately thin and sun-gated.
          if(radius>=1.) {
            vec3 edge=normalize(vec3(p,0.));
            float daylight=smoothstep(-.22,.7,dot(edge,sun));
            float glow=exp(-(radius-1.)*145.)*(1.-smoothstep(1.0,1.065,radius))*daylight;
            outColor=vec4(displayColor(sky+vec3(.035,.22,.52)*glow*.65),1.);
            return;
          }
          vec3 n=vec3(p,sqrt(1.-dot(p,p)));
          float angle=2.10-uTime*(2.*PI/960.);
          mat3 cameraBasis=rotateX(-.27)*rotateZ(-.13);
          mat3 basis=rotateY(angle)*cameraBasis;
          mat3 cloudBasis=rotateY(angle-uTime*.00011)*cameraBasis;
          vec3 world=basis*n;
          vec2 uv=sphereUV(world);
          vec3 albedo=linear(sampleMap(uDay,uv).rgb);
          float ocean=sampleMap(uOcean,uv).r;
          // Give the ocean its depth without shifting the land's measured map.
          albedo=mix(albedo,albedo*vec3(.42,.69,.92),ocean*.72);
          vec3 textureNormal=sampleMap(uNormal,uv).rgb*2.-1.;
          vec3 tangent=normalize(vec3(world.z,0.,-world.x));
          vec3 north=normalize(cross(world,tangent));
          vec3 mapped=normalize(world+(.025*(1.-ocean))*(tangent*textureNormal.x+north*textureNormal.y));
          vec3 normal=transpose(basis)*mapped;
          float ndl=dot(normal,sun);
          float lit=max(ndl,0.);
          float day=smoothstep(-.11,.12,ndl);
          // Intersect the ray to the Sun with the raised cloud shell for shadows.
          float shell=1.006;
          float ray=dot(n,sun);
          float shadowDistance=-ray+sqrt(ray*ray+shell*shell-1.);
          float shadow=cloud(n+sun*shadowDistance,cloudBasis)*day;
          vec3 surface=albedo*(.008+lit*1.65)*(1.-shadow*.38);
          vec3 halfVector=normalize(sun+vec3(0.,0.,1.));
          float fresnel=.024+.976*pow(1.-max(dot(n,vec3(0.,0.,1.)),0.),5.);
          float glint=pow(max(dot(n,halfVector),0.),110.)*fresnel*ocean*lit;
          surface+=vec3(1.,.95,.85)*glint*4.0*(1.-shadow);
          vec3 night=linear(sampleMap(uNight,uv).rgb);
          surface+=night*(1.-smoothstep(-.22,.10,ndl))*.75;
          vec3 cloudNormal=normalize(vec3(p,sqrt(shell*shell-dot(p,p))));
          float density=cloud(cloudNormal,cloudBasis);
          float cloudLight=max(dot(cloudNormal,sun),0.);
          float nearby=cloud(cloudNormal+sun*.0018,cloudBasis);
          float relief=clamp((density-nearby)*1.8,-.14,.18);
          vec3 cloudColor=vec3(.90,.94,1.)*(.014+cloudLight*1.28+relief*cloudLight);
          surface=mix(surface,cloudColor,density*.97);
          float air=pow(1.-n.z,3.8)*smoothstep(-.13,.8,dot(n,sun));
          surface+=vec3(.026,.12,.30)*air*.64;
          vec3 color=displayColor(surface/(1.+surface*.23));
          // Analytic pixel coverage keeps the limb smooth at any screen density.
          float coverage=1.-smoothstep(1.-1.2/uGlobe.z,1.,radius);
          outColor=vec4(mix(displayColor(sky),color,coverage),1.);
        }`;
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram();
      const shaders = [compile(gl.VERTEX_SHADER, vertex), compile(gl.FRAGMENT_SHADER, fragment)];
      shaders.forEach(shader => gl.attachShader(program, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.useProgram(program);
      const quality = innerWidth >= 900 && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096 ? 4096 : 2048;
      const channels = [['Day','day',quality], ['Clouds','clouds',quality], ['Night','night',2048], ['Ocean','ocean',2048], ['Normal','normal',2048]];
      const maps = await Promise.all(channels.map(async ([, name, width]) => {
        const image = new Image();
        image.src = `/assets/earth/${name}-${width}.webp`;
        await image.decode();
        return image;
      }));
      if (lost) return;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      maps.forEach((image, index) => {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(program, 'u' + channels[index][0]), index);
      });
      const time = gl.getUniformLocation(program, 'uTime');
      const globe = gl.getUniformLocation(program, 'uGlobe');
      draw = seconds => { gl.uniform1f(time, seconds); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      const resize = () => {
        if (lost) return;
        const { width, height } = hero.getBoundingClientRect();
        const pixelRatio = Math.min(devicePixelRatio || 1, width < 701 ? 1.6 : 1.75, 2300 / width);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        gl.viewport(0, 0, canvas.width, canvas.height);
        // The poster is this shader's first frame, including its 6.5% atmosphere
        // margin. Share its actual CSS bounds so loading never moves the globe.
        const poster = hero.querySelector('.hero-visual').getBoundingClientRect();
        const bounds = hero.getBoundingClientRect();
        const x = poster.left - bounds.left + poster.width / 2;
        const y = poster.top - bounds.top + poster.height / 2;
        const radius = poster.width / 2.13;
        gl.uniform3f(globe, x * pixelRatio, (height - y) * pixelRatio, radius * pixelRatio);
        draw(elapsed);
      };
      new ResizeObserver(resize).observe(hero);
      resize();
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Earth rendering failed');
      ready = true;
      canvas.dataset.state = 'ready';
      hero.classList.add('earth-ready');
      sync();
    } catch (error) {
      console.warn('Earth preview uses its poster:', error.message);
      canvas.dataset.state = 'fallback';
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      // Keep the matching first frame and readable page if GPU or loading fails.
      hero.classList.remove('earth-ready');
      button.hidden = true;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
  motion.addEventListener('change', () => { if (!initialized && !motion.matches) boot(); sync(); });
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1600 });
  else setTimeout(boot, 300);
})();
