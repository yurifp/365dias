// sticker_custom.js — Espaço para suas funções personalizadas de stickers
// Use window.StickerFns para declarar funções nomeadas que podem ser acionadas
// por sticker_actions.js via action { name: 'call', args: { fn: 'sticker1', params:{...} } }

(function(){
  const ns = window.StickerFns = window.StickerFns || {};

  // Helper: mostra/oculta listas de seletores (sem jQuery)
  function setDisplay(showSelectors = [], hideSelectors = []){
    const show = Array.isArray(showSelectors) ? showSelectors : [showSelectors];
    const hide = Array.isArray(hideSelectors) ? hideSelectors : [hideSelectors];
    show.filter(Boolean).forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'block'));
    hide.filter(Boolean).forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
  }

  // Conteúdo editável para modais disparados pelos stickers
  // Altere aqui o HTML que você quer ver dentro do modal para cada sticker
  ns.modalContent = {
    sticker1: '<h2 style="margin:0 0 12px;">Sticker 1</h2><p style="margin:0;">Conteúdo do modal do sticker 1. Edite em sticker_custom.js (ns.modalContent.sticker1).</p>',
    sticker2: '<h2 style="margin:0 0 12px;">Sticker 2</h2><p style="margin:0;">Conteúdo do modal do sticker 2. Edite em sticker_custom.js (ns.modalContent.sticker2).</p>'
  };

  // Exemplos equivalentes ao que você descreveu
  ns.sticker1 = function(ctx){
    setDisplay(['.radiobutton-8-Z0J2KN'], ['.radiobutton-7-Z0J2KN']);
    // Abrir modal para teste (conteúdo editável acima)
    ns.fancyModal(ctx, { html: ns.modalContent.sticker1 });
  };
  ns.sticker2 = function(ctx){
    setDisplay(['.radiobutton-7-Z0J2KN'], ['.radiobutton-8-Z0J2KN']);
    // Abrir modal para teste (conteúdo editável acima)
    ns.fancyModal(ctx, { html: ns.modalContent.sticker2 });
  };

  // Fancy modal usando anime.js (pode ser chamada via action { name: 'call', args: { fn: 'fancyModal', params:{ html: '...' } } })
  ns.fancyModal = function(ctx, params={}){
    const html = params.html || '<h2 style="margin:0 0 12px;">Modal Custom</h2><p style="margin:0;">Conteúdo padrão.</p>';
    // Reusar infraestrutura do show-modal
    const modal = document.querySelector('.sticker-modal') || (function(){
      const m = document.createElement('div');
      m.className = 'sticker-modal';
      m.innerHTML = `\n        <div class="sticker-modal-backdrop"></div>\n        <div class="sticker-modal-panel">\n          <button class="sticker-modal-close" aria-label="Fechar">×</button>\n          <div class="sticker-modal-content"></div>\n        </div>`;
      document.body.appendChild(m);
      const close = ()=> m.classList.remove('is-open');
      m.querySelector('.sticker-modal-backdrop').addEventListener('click', close);
      m.querySelector('.sticker-modal-close').addEventListener('click', close);
      return m;
    })();
    const panel = modal.querySelector('.sticker-modal-panel');
    const contentEl = modal.querySelector('.sticker-modal-content');
    contentEl.innerHTML = html;
    modal.classList.add('is-open');
    if (window.anime){
      const backdrop = modal.querySelector('.sticker-modal-backdrop');
      anime.set(panel, { opacity:0, scale:.9, rotateX: -8, translateY:12 });
      anime.set(backdrop, { opacity:0 });
      anime({ targets: backdrop, opacity:[0,1], duration:220, easing:'easeOutQuad' });
      anime({ targets: panel, opacity:[0,1], scale:[.9,1], rotateX:[-8,0], translateY:[12,0], duration:360, easing:'easeOutCubic' });
    }
  };

  // Você pode criar quantas funções quiser:
  // ns.minhaAcao = function(ctx, params){ ... };
})();
