// scroll_driver.js — Virtual scroll that maps interactions to progress [0..1]
// Export: initScrollDriver({ onProgress }) -> { get(), set(p) }

export function initScrollDriver({ onProgress } = {}){
  let p = 0; // progress 0..1
  const listeners = new Set();
  if (typeof onProgress === 'function') listeners.add(onProgress);

  // Lock page layout
  document.body.classList.add('locked');

  // Helpers
  const clamp = (n, min=0, max=1) => Math.max(min, Math.min(max, n));
  const emit = () => {
    for (const fn of listeners) fn(p);
    document.documentElement.style.setProperty('--p', String(p));
  };

  // API
  const api = {
    on(fn){ if (typeof fn === 'function') listeners.add(fn); },
    off(fn){ listeners.delete(fn); },
    get(){ return p; },
    set(v){ p = clamp(v); emit(); }
  };

  // Interaction mapping
  let touchStartY = null;
  let touchLastY = null;
  let touchDySum = 0;
  let touchStartP = 0;
  let lastMoveTs = 0;
  // Expose simple input markers for other modules (e.g., snap behavior)
  window.__virtualScrollTouchActive = false;
  window.__virtualScrollLastInput = 'none';

  // Target: 52 steps (13 months * 4 sub-takes)
  const MONTHS = 13;
  const SUB_TAKES = 4;
  const TOTAL_TAKES = MONTHS * SUB_TAKES; // 52

  // Small helper to animate to a target progress (used on touch end)
  let __raf = 0;
  function animateTo(target, ms = 260){
    cancelAnimationFrame(__raf);
    const start = performance.now();
    const from = p;
    const to = clamp(target);
    const dur = Math.max(60, ms|0);
    const easeOutCubic = (t)=> 1 - Math.pow(1 - t, 3);
    const step = (now)=>{
      const t = Math.min(1, (now - start) / dur);
      const k = easeOutCubic(t);
      p = from + (to - from) * k;
      emit();
      if (t < 1) __raf = requestAnimationFrame(step);
    };
    __raf = requestAnimationFrame(step);
  }

  function wheelHandler(e){
    // prevent native scroll and map delta to progress
    e.preventDefault();
    window.__virtualScrollLastInput = 'wheel';
    const delta = (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) || 0; // lines->px
    // Sensibilidade por "pixels por take": ~180 px por take no wheel
    const PIXELS_PER_TAKE_WHEEL = 180;
    const perPixel = 1 / (PIXELS_PER_TAKE_WHEEL * TOTAL_TAKES);
    p = clamp(p + delta * perPixel);
    emit();
  }

  function keyHandler(e){
    const k = e.key;
    if (['ArrowDown','PageDown',' ','Spacebar'].includes(k)){
      e.preventDefault();
      window.__virtualScrollLastInput = 'key';
      api.set(p + 1/TOTAL_TAKES); // advance one take per press
    } else if (['ArrowUp','PageUp'].includes(k)){
      e.preventDefault();
      window.__virtualScrollLastInput = 'key';
      api.set(p - 1/TOTAL_TAKES);
    } else if (k === 'Home'){
      e.preventDefault(); api.set(0);
    } else if (k === 'End'){
      e.preventDefault(); api.set(1);
    }
  }

  function touchStart(e){
    if (!e.touches || !e.touches.length) return;
    touchStartY = touchLastY = e.touches[0].clientY;
    touchDySum = 0;
    touchStartP = p;
    window.__virtualScrollTouchActive = true;
    window.__virtualScrollLastInput = 'touch';
    cancelAnimationFrame(__raf);
  }
  function touchMove(e){
    if (touchStartY == null) return;
    const y = e.touches[0].clientY;
    const dy = touchLastY - y; // swipe up -> positive
    touchLastY = y;
    e.preventDefault();
    // Sensibilidade: ~80 px por take no touch (bem responsivo)
    const PIXELS_PER_TAKE_TOUCH = 80;
    const perPixel = 1 / (PIXELS_PER_TAKE_TOUCH * TOTAL_TAKES);
    p = clamp(p + dy * perPixel);
    emit();
    touchDySum += dy;
    lastMoveTs = performance.now();
  }
  function touchEnd(){
    const dySum = touchDySum;
    const MIN_GESTURE = 16; // px
    const dir = Math.sign(dySum);
    // Decide target take baseado na intenção do gesto
    const takesFloat = p * TOTAL_TAKES;
    const startBoundary = Math.round(touchStartP * TOTAL_TAKES);
    let targetTake;
    if (Math.abs(dySum) < MIN_GESTURE){
      // Gesto muito curto: voltar para o boundary mais próximo da origem
      targetTake = startBoundary;
    } else {
      // Avança pelo menos 1 take na direção do gesto
      const base = dir>0 ? Math.ceil(takesFloat) : Math.floor(takesFloat);
      targetTake = base === startBoundary ? (startBoundary + (dir>0?1:-1)) : base;
    }
    targetTake = Math.max(0, Math.min(TOTAL_TAKES-1, targetTake|0));
    const targetP = targetTake / TOTAL_TAKES;
    animateTo(targetP, 260);

    touchStartY = touchLastY = null;
    touchDySum = 0;
    window.__virtualScrollTouchActive = false;
  }

  // Attach listeners (must be non-passive to prevent scroll)
  window.addEventListener('wheel', wheelHandler, { passive: false });
  window.addEventListener('keydown', keyHandler, { passive: false });
  window.addEventListener('touchstart', touchStart, { passive: false });
  window.addEventListener('touchmove', touchMove, { passive: false });
  window.addEventListener('touchend', touchEnd, { passive: true });

  // Initialize
  emit();
  return api;
}
