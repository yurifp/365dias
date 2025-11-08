// js/intro.js — Cinematic intro overlay shown only on first visit
// Requires anime.js (already included via CDN in index.html)
(function(){
  const STORAGE_KEY = 'scrapbook_intro_shown_v1';
  const qs = new URLSearchParams(location.search);
  const forceIntro = qs.get('intro') === '1'; // optional: ?intro=1 forces the intro

  if (!forceIntro && localStorage.getItem(STORAGE_KEY) === '1') return; // already seen — do nothing, don't toggle classes

  let cancelled = false;

  function injectStyles(){
    if (document.getElementById('introStyles')) return;
    const style = document.createElement('style');
    style.id = 'introStyles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;600&display=swap');
      /* While intro is active, hide everything else to avoid bleeding from high z-index elements */
      html.intro-active body > *:not(.intro-container):not(style):not(script){ visibility: hidden !important; }
      .intro-container{ position:fixed; inset:0; background:#000; z-index:20000000; display:grid; grid-template-rows:1fr auto; align-items:center; justify-items:center; color:rgba(255,255,255,.92); font-family:'Playfair Display', serif; padding:24px; }
      .intro-text-container{ display:grid; place-items:center; text-align:center; gap:12px; min-height:60vh; }
      .intro-text{ opacity:0; transform:translateY(8px) scale(.98); will-change:transform, opacity; }
      .intro-text.line-cursive{ font-family:'Great Vibes', 'La Belle Aurore', cursive; font-size:clamp(36px, 7vw, 72px); letter-spacing:.5px; font-weight:400; }
      .intro-text.line-serif{ font-family:'Playfair Display', serif; font-size:clamp(16px, 2.6vw, 28px); opacity:.86; }
      .intro-skip{ margin:16px 0 24px; background:transparent; color:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.28); padding:8px 14px; border-radius:999px; cursor:pointer; transition:all .2s; }
      .intro-skip:hover{ color:#fff; border-color:rgba(255,255,255,.4); }
      .intro-skip:focus{ outline:none; box-shadow:0 0 0 2px rgba(255,255,255,.35) inset; }
    `;
    document.head.appendChild(style);
  }

  function createOverlay(){
    const root = document.createElement('div');
    root.className = 'intro-container';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.innerHTML = `
      <div class="intro-text-container" aria-live="polite" aria-atomic="true"></div>
      <button class="intro-skip" type="button" aria-label="Skip intro">Skip ⟶</button>
    `;
    const container = root.querySelector('.intro-text-container');
    const skipBtn = root.querySelector('.intro-skip');
    return { root, container, skipBtn };
  }

  function delay(ms){ return new Promise(res => setTimeout(res, ms)); }

  async function showMessage(lines, opts){
    const container = opts.container;
    const els = [];
    lines.forEach(def => {
      const el = document.createElement('div');
      el.className = 'intro-text ' + (def.className || '');
      el.textContent = def.text || '';
      container.appendChild(el);
      els.push(el);
    });

    if (!window.anime){
      // Fallback: simple show/hide if anime isn't available
      els.forEach(el => el.style.opacity = 1);
      await delay(opts.hold || 2200);
      els.forEach(el => el.remove());
      return;
    }

    const animIn = anime({
      targets: els,
      opacity: [0, 1],
      scale: [0.98, 1],
      translateY: [8, 0],
      duration: 900,
      delay: anime.stagger(120),
      easing: 'easeOutCubic'
    });
    await animIn.finished;
    if (cancelled) return;

    await delay(opts.hold || 2300);
    if (cancelled) return;

    const animOut = anime({
      targets: els,
      opacity: [1, 0],
      translateY: [0, -10],
      duration: 650,
      easing: 'easeInQuad'
    });
    await animOut.finished;
    els.forEach(el => el.remove());
  }

  async function playIntro(){
    injectStyles();
    // Mark intro active only now (we are going to show it)
    document.documentElement.classList.add('intro-active');
    const { root, container, skipBtn } = createOverlay();
    document.body.appendChild(root);

    const end = () => {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        localStorage.setItem(STORAGE_KEY, '1');
      }
      // Revela o conteúdo principal novamente
      document.documentElement.classList.remove('intro-active');
      if (window.anime){
        anime({ targets: root, opacity: [1, 0], duration: 480, easing: 'easeOutQuad', complete: () => root.remove() });
      } else {
        root.remove();
      }
    };

    const onSkip = () => { if (cancelled) return; cancelled = true; end(); };
    skipBtn.addEventListener('click', onSkip);
    skipBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkip(); }
    });

    // Sequence
    await showMessage([
      { text: 'you ♡ me', className: 'line-cursive' },
      { text: 'our love story', className: 'line-serif' }
    ], { container, hold: 2400 });
    if (cancelled) return;

    // Placeholders — edite os textos abaixo para sua narrativa
    await showMessage([{ text: '— 365 dias ao seu lado —', className: 'line-serif' }], { container, hold: 2200 });
    if (cancelled) return;
    await showMessage([{ text: '—  —', className: 'line-serif' }], { container, hold: 2200 });
    if (cancelled) return;
    // opcional: terceira
    await showMessage([{ text: '— terceira frase opcional —', className: 'line-serif' }], { container, hold: 2000 });

    if (!cancelled) end();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playIntro, { once: true });
  } else {
    playIntro();
  }
})();
