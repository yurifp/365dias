// heart_particles.js — Optimized particle heart (Canvas 2D + Anime.js intro, RAF pulse)
// Export: initHeartParticles()

let HEART_API = null;

export function initHeartParticles(){
  const mount = document.getElementById('heartSvg');
  if (!mount) return;

  // Replace SVG node with a Canvas to cut DOM cost (much faster on mobile)
  const parent = mount.parentNode;
  const canvas = document.createElement('canvas');
  canvas.id = 'heartCanvas';
  canvas.className = 'heart-canvas';
  // Keep ARIA label
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Coração animado');
  parent.replaceChild(canvas, mount);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Implicit heart in normalized space
  const isHeart = (x, y) => {
    const a = x*x + y*y - 1;
    return (a*a*a - x*x*y*y*y) <= 0;
  };

  // Normalized bounds that frame the heart nicely
  const scaleX = 1.25, scaleY = 1.3;

  // State
  let particles = [];
  let cssW = 0, cssH = 0, scalePx = 1;
  let running = true;
  let inView = true;
  const intro = { t: 0 };

  // Single Anime.js tween for reveal (cheap)
  if (window.anime){
    anime({ targets: intro, t: 1, duration: 650, easing: 'easeOutBack' });
  } else {
    intro.t = 1;
  }

  // Responsive density cap
  function computeSpacingPx(){
    const maxDots = (innerWidth < 768) ? 900 : 1400;
    const occupancy = 0.52; // fraction of grid points inside the heart
    const hexK = Math.sqrt(3)/2; // hex cell area factor
    const raw = Math.sqrt((cssW*cssH*occupancy)/(maxDots*hexK));
    return Math.min(18, Math.max(8, raw)); // clamp for aesthetics
  }

  function buildParticles(){
    particles = [];
    // Determine CSS size
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    // HiDPI backing store
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels

    // Map normalized coords -> pixels (preserve aspect)
    scalePx = Math.min(cssW/(2*scaleX), cssH/(2*scaleY));
    const cx = cssW/2, cy = cssH/2;

    const sPx = computeSpacingPx();
    const dx = sPx/scalePx; // normalized spacing
    const dy = dx * 0.86;   // hex packing

    // Base radius from local spacing
    const rBasePx = Math.max(0.9, Math.min(sPx, sPx*0.86) * 0.36);

    for (let r=0, y=-scaleY; y<=scaleY + 1e-6; r++, y+=dy){
      const offset = (r % 2) ? dx/2 : 0;
      for (let c=0, x=-scaleX+offset; x<=scaleX + 1e-6; c++, x+=dx){
        if (!isHeart(x, y)) continue;
        const px = cx + x*scalePx;
        const py = cy - y*scalePx; // flip Y
        // center-weighted base radius
        const nx = x/scaleX, ny = y/scaleY;
        const d = Math.sqrt(nx*nx + (ny+0.15)*(ny+0.15));
        const w = 1 - Math.min(1, d);
        const r = Math.max(0.9, rBasePx * (0.86 + 0.28*w));
        const ph = (d*6.283) % (Math.PI*2);
        particles.push({ x: px, y: py, r, ph });
      }
    }
  }

  // Draw once per frame when visible
  let t0 = performance.now();
  let color = '#ff5c70';
  let ampCfg = 0.14;
  let speedCfg = 2.6;
  function draw(now){
    // In locked mode, always render (background stage)
    const locked = document.body.classList.contains('locked');
    if (!locked){
      // Non-locked fallback: pause when offscreen
      const coverEl = document.getElementById('cover');
      const coverActive = coverEl ? coverEl.classList.contains('is-active') : true;
      if (!running || !inView || !coverActive) { requestAnimationFrame(draw); return; }
    } else if (!running) { requestAnimationFrame(draw); return; }
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.save();
  ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(255,92,112,0.45)';
    ctx.shadowBlur = 8.5;

    ctx.beginPath();
  const amp = ampCfg;
  const speed = speedCfg;
    const introT = Math.max(0, Math.min(1, intro.t || 0));
    for (let i=0;i<particles.length;i++){
      const p = particles[i];
      const s = 1 + amp * Math.sin(t*speed + p.ph);
      const rr = Math.max(0, p.r * s * introT);
      // Build a single path for all circles (fewer draw calls)
      ctx.moveTo(p.x + rr, p.y);
      ctx.arc(p.x, p.y, rr, 0, Math.PI*2);
    }
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(draw);
  }

  // Visibility + on-screen pausing
  function handleVisibility(){
    running = document.visibilityState !== 'hidden';
  }
  document.addEventListener('visibilitychange', handleVisibility);

  const cover = document.getElementById('cover');
  try{
    const io = new IntersectionObserver((entries)=>{
      for (const e of entries){
        if (e.target === cover) inView = e.isIntersecting || e.intersectionRatio > 0.1;
      }
    }, { threshold: [0, 0.1, 0.5, 1] });
    if (cover) io.observe(cover);
  }catch{ /* Safari < 12 fallback: keep running */ }

  // Resize (debounced)
  let resizeTid;
  function scheduleRebuild(){
    clearTimeout(resizeTid);
    resizeTid = setTimeout(()=>{
      buildParticles();
    }, 120);
  }
  window.addEventListener('resize', scheduleRebuild, { passive:true });

  // Initial build (wait a frame to ensure CSS sizing applied)
  requestAnimationFrame(()=>{
    buildParticles();
    requestAnimationFrame(draw);
  });

  // expose a tiny API so frames can adjust mood
  HEART_API = {
    setMood({ color: c, amp, speed } = {}){
      if (typeof c === 'string') color = c;
      if (typeof amp === 'number') ampCfg = amp;
      if (typeof speed === 'number') speedCfg = speed;
    }
  };
}

export function setHeartMood(cfg){
  if (HEART_API) HEART_API.setMood(cfg);
}
