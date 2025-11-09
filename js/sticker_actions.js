// sticker_actions.js — Registry and dispatcher for sticker click actions
// Cada sticker pode definir:
//   action: "nomeDaAcao" OU { name: "nomeDaAcao", args: { ... } }
// No JSON (slide.stickers[]) ou nos atributos data-action / data-action-args em sticker-slot.
// Este módulo expõe:
//   registerStickerAction(name, fn)
//   runStickerAction(def, ctx)
//   registerDefaultStickerActions()
// Context (ctx) fornecido para a função:
//   { element, id, index, slide, def } + qualquer args custom

const ACTIONS = new Map();

/**
 * Registra uma ação de sticker.
 * @param {string} name
 * @param {(ctx: object) => void|Promise<void>} fn
 */
export function registerStickerAction(name, fn){
  if (!name || typeof fn !== 'function') return;
  ACTIONS.set(name, fn);
}

/**
 * Executa a ação definida (string ou {name, args})
 * @param {string|{name:string, args?:object}} def
 * @param {object} ctx
 */
export function runStickerAction(def, ctx={}){
  if (!def) return;
  let name = null; let args = {};
  if (typeof def === 'string'){ name = def; }
  else if (typeof def === 'object'){ name = def.name; if (def.args && typeof def.args === 'object') args = def.args; }
  if (!name) return;
  const fn = ACTIONS.get(name);
  if (typeof fn === 'function'){
    try{
      fn({ ...ctx, def, args, name });
    }catch(err){
      console.warn('[sticker action error]', name, err);
    }
  } else {
    console.warn('[sticker action não registrada]', name);
  }
}

/**
 * Registra um conjunto pequeno de ações de exemplo.
 */
export function registerDefaultStickerActions(){
  if (ACTIONS.size) return; // evita duplo registro se init rodar mais de uma vez

  registerStickerAction('log', ({ id, index, slide, args }) => {
    console.log('[sticker:log]', { id, index, slideId: slide?.id, args });
  });

  registerStickerAction('pulse', ({ element }) => {
    if (!element) return;
    element.style.transition = 'transform .4s ease';
    element.style.transform += ' scale(1.15)';
    setTimeout(()=>{
      element.style.transform = element.style.transform.replace(/scale\([^)]*\)/,'');
    }, 420);
  });

  registerStickerAction('toggle-class', ({ element, args }) => {
    if (!element) return;
    const cls = args?.class || 'active';
    element.classList.toggle(cls);
  });

  registerStickerAction('open-url', ({ args }) => {
    if (!args?.url) return;
    window.open(args.url, args.target || '_blank');
  });

  // === show-modal ===
  registerStickerAction('show-modal', ({ args }) => {
    const modal = ensureModal();
    const panel = modal.querySelector('.sticker-modal-panel');
    const contentEl = modal.querySelector('.sticker-modal-content');
    const html = args?.html;
    const text = args?.text;
    const selector = args?.selector;
    let content = '';
    if (selector){
      const el = document.querySelector(selector);
      if (el) content = el.outerHTML;
    } else if (html){
      content = String(html);
    } else if (text){
      content = `<div style="padding:12px 16px;">${escapeHtml(String(text))}</div>`;
    }
    contentEl.innerHTML = content || '<div style="padding:12px 16px;">(sem conteúdo)</div>';

    modal.classList.add('is-open');

    // Anime.js: backdrop fade e painel scale-in
    try{
      const backdrop = modal.querySelector('.sticker-modal-backdrop');
      if (window.anime){
        anime.set(panel, { opacity: 0, scale: .92, translateY: 8 });
        anime.set(backdrop, { opacity: 0 });
        anime({ targets: backdrop, opacity: [0, 1], duration: 200, easing: 'easeOutQuad' });
        anime({ targets: panel, opacity: [0, 1], scale: [.92, 1], translateY: [8, 0], duration: 260, easing: 'easeOutQuad' });
      }
    }catch{}
  });

  // === play-sound ===
  registerStickerAction('play-sound', ({ args }) => {
    const src = args?.src || args?.url; if (!src) return;
    const vol = Math.max(0, Math.min(1, Number(args?.volume ?? 1)));
    const audio = new Audio(src);
    audio.volume = vol;
    audio.play().catch(()=>{});
  });

  // === show-tooltip ===
  registerStickerAction('show-tooltip', ({ element, args }) => {
    if (!element) return;
    const tip = ensureTooltip();
    tip.textContent = args?.text || '';
    const rect = element.getBoundingClientRect();
    tip.style.left = Math.round(rect.left + rect.width/2) + 'px';
    tip.style.top = Math.round(rect.top - 10) + 'px';
    tip.classList.add('is-show');
    const dur = Number(args?.duration ?? 1800);
    clearTimeout(tip._tid); tip._tid = setTimeout(()=> tip.classList.remove('is-show'), dur);
  });

  // === navigate-slide ===
  registerStickerAction('navigate-slide', ({ args }) => {
    const nav = window.carouselControl; if (!nav) return;
    if (typeof args?.to === 'number'){ nav.show(args.to); return; }
    const dir = String(args?.dir || 'next');
    if (dir === 'prev') nav.prev(); else nav.next();
  });

  // === animate (custom animation) ===
  registerStickerAction('animate', ({ element, args }) => {
    if (!element) return;
    const from = args?.from || { scale: 1 };
    const to = args?.to || { scale: 1.15 };
    const dur = Number(args?.duration ?? 400);
    const easing = args?.easing || 'easeOutQuad';
    if (window.anime){
      anime({ targets: element, ...from, ...{ duration: 0 }, complete(){
        anime({ targets: element, ...to, duration: dur, easing });
      }});
    } else if (element.animate){
      element.animate([from, to], { duration: dur, easing: 'ease-out' });
    } else {
      element.style.transform += ' scale(1.15)';
      setTimeout(()=>{ element.style.transform = element.style.transform.replace(/scale\([^)]*\)/,''); }, dur);
    }
  });

  // === camera-effect (simula câmera instantânea) ===
  registerStickerAction('camera-effect', ({ element, args }) => {
    if (!element) return;
    
    // Import camera widget dynamically
    import('./cameraWidget.js').then(({ createCameraEffect }) => {
      // Repassa todos os argumentos relevantes (antes só enviava photoSrc)
      const config = {
        photoSrc: args?.photoSrc || './assets/images/cine4.svg',
        photoFactor: args?.photoFactor,
        photoWidth: args?.photoWidth,
        photoHeight: args?.photoHeight,
        useCssSize: args?.useCssSize === true,
        labelText: args?.labelText
      };
      createCameraEffect(element, config);
    }).catch(err => {
      console.warn('[camera effect error]', err);
    });
  });

  // === call (executa função nomeada definida pelo usuário) ===
  registerStickerAction('call', ({ args, ...ctx }) => {
    const fnName = args?.fn || args?.name; if (!fnName) return;
    const ns = window.StickerFns || {};
    const fn = ns[fnName];
    if (typeof fn === 'function'){
      try{ fn(ctx, args?.params || args); }catch(err){ console.warn('[sticker call error]', fnName, err); }
    } else {
      console.warn('[sticker call missing]', fnName);
    }
  });
}

// Helpers (privados)
function ensureModal(){
  let modal = document.querySelector('.sticker-modal');
  if (!modal){
    modal = document.createElement('div');
    modal.className = 'sticker-modal';
    modal.innerHTML = `
      <div class="sticker-modal-backdrop"></div>
      <div class="sticker-modal-panel">
        <button class="sticker-modal-close" aria-label="Fechar">×</button>
        <div class="sticker-modal-content"></div>
      </div>`;
    document.body.appendChild(modal);
    const close = ()=> modal.classList.remove('is-open');
    modal.querySelector('.sticker-modal-backdrop').addEventListener('click', close);
    modal.querySelector('.sticker-modal-close').addEventListener('click', close);
  }
  return modal;
}

function ensureTooltip(){
  let tip = document.querySelector('.sticker-tooltip');
  if (!tip){
    tip = document.createElement('div');
    tip.className = 'sticker-tooltip';
    document.body.appendChild(tip);
  }
  return tip;
}

function escapeHtml(s){
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return s.replace(/[&<>"']/g, c => map[c]);
}

// Sugestões futuras:
// - show-modal
// - play-sound
// - show-tooltip
// - navigate-slide
// - custom animation
