// starry.js — "Noite Estrelada" premium background
// Canvas2D + Perlin noise + parallax + twinkling stars
// Export: initStarryNight(canvasId = 'bgParticles')

function lerp(a,b,t){ return a + (b-a)*t }

// Lightweight Perlin noise 2D (based on improved Perlin)
class Perlin2D {
  constructor(seed=1337){
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    let s = seed >>> 0;
    const rand = () => (s = (s*1664525 + 1013904223) >>> 0) / 0xffffffff;
    for (let i=0;i<256;i++) perm[i]=i;
    for (let i=255;i>0;i--){ const j = Math.floor(rand()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]] }
    for (let i=0;i<512;i++) this.p[i]=perm[i & 255];
  }
  fade(t){ return t*t*t*(t*(t*6-15)+10) }
  grad(h, x, y){
    const u = (h & 1) ? x : -x;
    const v = (h & 2) ? y : -y;
    return u + v;
  }
  noise(x, y){
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = this.fade(x); const v = this.fade(y);
    const A = this.p[X] + Y; const B = this.p[X+1] + Y;
    const g1 = this.grad(this.p[A], x, y);
    const g2 = this.grad(this.p[B], x-1, y);
    const g3 = this.grad(this.p[A+1], x, y-1);
    const g4 = this.grad(this.p[B+1], x-1, y-1);
    const lerp1 = lerp(g1, g2, u);
    const lerp2 = lerp(g3, g4, u);
    return lerp(lerp1, lerp2, v); // approx in [-2,2]
  }
  octave(x, y, oct=3, falloff=0.5){
    let amp=1, freq=1, sum=0, norm=0;
    for (let i=0;i<oct;i++){ sum += this.noise(x*freq, y*freq)*amp; norm += amp; amp *= falloff; freq *= 2 }
    return sum/norm; // roughly [-1,1]
  }
}

export function initStarryNight(canvasId='bgParticles'){
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, devicePixelRatio || 1);

  let W=0, H=0; 
  let t=0; // time
  const perlin = new Perlin2D(20241101);

  // Stars
  const stars = []; // {x:0..1, y:0..1, r, base, speed, phase}
  function seedStars(){
    stars.length = 0;
    const count = Math.floor((W*H) / 14000); // density scales with area
    for (let i=0;i<count;i++){
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random()*1.6 + 0.6,
        base: Math.random()*0.5 + 0.3,
        speed: Math.random()*1.2 + 0.4,
        phase: Math.random()*Math.PI*2,
      });
    }
  }

  // Brush texture (offscreen) — Van Gogh-ish strokes
  let off, octx;
  function buildBrushTexture(){
    off = document.createElement('canvas');
    octx = off.getContext('2d');
    off.width = Math.max(640, Math.floor(W*1.2));
    off.height = Math.max(640, Math.floor(H*1.2));

    // base gradient (deep blue to near black)
    const g = octx.createLinearGradient(0,0,0,off.height);
    g.addColorStop(0, '#0c1020');
    g.addColorStop(1, '#080a12');
    octx.fillStyle = g; octx.fillRect(0,0,off.width,off.height);

    // stroke lines influenced by noise
    octx.globalAlpha = 0.12;
    octx.lineWidth = 2.0; octx.lineCap = 'round';
    const colors = ['#2e3b7b', '#1b264f', '#37428a', '#25305f'];
    const rowStep = 7; // distance between sweep rows
    const amp = 16; // amplitude of noise displacement

    for (let y=0; y<off.height; y+=rowStep){
      octx.strokeStyle = colors[y % colors.length];
      octx.beginPath();
      let first = true;
      for (let x=0; x<off.width; x+=6){
        const nx = (x/200);
        const ny = (y/200);
        const disp = perlin.octave(nx+0.3, ny+0.7, 3, 0.55) * amp;
        const yy = y + disp;
        if (first){ octx.moveTo(x, yy); first=false; }
        else { octx.lineTo(x, yy); }
      }
      octx.stroke();
    }

    // Swirl dabs (short arcs following noise angle)
    octx.globalAlpha = 0.10;
    const step = 36;
    for (let y=step/2; y<off.height; y+=step){
      for (let x=step/2; x<off.width; x+=step){
        const nx = x/180, ny = y/180;
        const a = perlin.octave(nx, ny, 2, 0.6) * Math.PI*2;
        const len = 10 + Math.random()*12;
        const x2 = x + Math.cos(a)*len;
        const y2 = y + Math.sin(a)*len;
        octx.strokeStyle = '#3f4ba6';
        octx.lineWidth = 1.6;
        octx.beginPath(); octx.moveTo(x, y); octx.lineTo(x2, y2); octx.stroke();
      }
    }
  }

  // Parallax inputs
  let pointer = { x: 0.5, y: 0.5 }, smooth = { x:0.5, y:0.5 };
  addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left)/rect.width; pointer.y = (e.clientY - rect.top)/rect.height;
  }, { passive: true });

  let scrollFactor = 0; // 0..1
  addEventListener('scroll', ()=>{
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollFactor = max>0 ? scrollY/max : 0;
  }, { passive: true });

  function resize(){
    W = innerWidth; H = innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    seedStars(); buildBrushTexture();
  }
  resize();
  addEventListener('resize', resize);

  function drawStars(){
    for (const s of stars){
      const px = (s.x*W); const py = (s.y*H);
      const tw = s.base + 0.5*(Math.sin(t*s.speed + s.phase) * 0.5 + 0.5);
      const r = s.r * (0.6 + 0.6*tw);
      const grd = ctx.createRadialGradient(px, py, 0, px, py, r*6);
      grd.addColorStop(0, 'rgba(255,245,220,0.9)');
      grd.addColorStop(0.4, 'rgba(255,210,150,0.25)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
    }
  }

  function frame(){
    t += 0.016;

    smooth.x = lerp(smooth.x, pointer.x, 0.05);
    smooth.y = lerp(smooth.y, pointer.y, 0.05);

    // Background gradient for subtle depth
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#07090f');
    bg.addColorStop(1, '#05060b');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Parallax offsets
    const ox = (smooth.x - 0.5) * 40; // pointer parallax
    const oy = (smooth.y - 0.5) * 20 + (scrollFactor-0.5)*40; // scroll drift

    // Draw brush texture with tint + slight motion
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.translate(-off.width*0.1 + ox*0.6, -off.height*0.1 + oy*0.4);
    ctx.drawImage(off, 0, 0);
    ctx.restore();

    // Stars on top
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawStars();
    ctx.restore();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
