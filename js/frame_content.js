// frame_content.js — Fixed-stage content that changes per take (52 frames = 13 meses × 4)
// Exports: initFrameContent(driver), setFrameContentMap(array)

let FRAMES = null;     // array de 52 itens: { title, caption, image, date? }
let deck = null;       // container
let current = -1;      // índice atual
let ready = false;     // se init foi chamado

function buildDefaultFrames(){
  const monthLabels = ['Nov 2024','Dez 2024','Jan 2025','Fev 2025','Mar 2025','Abr 2025','Mai 2025','Jun 2025','Jul 2025','Ago 2025','Set 2025','Out 2025','Nov 2025'];
  const monthSlugs  = ['nov_2024','dez_2024','jan_2025','fev_2025','mar_2025','abr_2025','mai_2025','jun_2025','jul_2025','ago_2025','set_2025','out_2025','nov_2025'];
  const partLabels  = ['1/4','2/4','3/4','4/4'];
  const frames = [];
  for (let m=0;m<monthLabels.length;m++){
    for (let s=0;s<4;s++){
      const slug = monthSlugs[m];
      frames.push({
        title: `${monthLabels[m]} — Parte ${partLabels[s]}`,
        caption: `Legenda da parte ${partLabels[s]}`,
        image: `./assets/images/${slug}_${s+1}.jpg`
      });
    }
  }
  return frames;
}

function ensureDeck(){
  if (!deck){
    deck = document.createElement('div');
    deck.className = 'frame-deck';
    deck.setAttribute('aria-live', 'polite');
    document.body.appendChild(deck);
  }
}

function createCard(item){
  const title = item.title || '';
  const caption = item.caption || '';
  const img = item.image || '';
  const card = document.createElement('div');
  card.className = 'polaroid frame-card';
  card.innerHTML = `
    <img alt="${title || caption}" src="${img}" />
    ${title ? `<h3 class="title">${title}</h3>` : ''}
    ${caption ? `<span class="caption">${caption}</span>` : ''}
  `;
  return card;
}

function show(i){
  const frames = FRAMES || buildDefaultFrames();
  const n = frames.length || 52;
  const idx = Math.min(n-1, Math.max(0, i|0));
  if (idx === current) return;
  current = idx;
  ensureDeck();
  const item = frames[idx] || frames[0];

  const next = createCard(item);
  next.style.opacity = '0';
  next.style.transform = 'translateY(10px) scale(0.98)';
  deck.appendChild(next);

  if (window.anime){
    anime({ targets: next, opacity:[0,1], translateY:[10,0], scale:[0.98,1], duration:520, easing:'easeOutQuad' });
  } else {
    next.style.opacity = '1';
    next.style.transform = 'none';
  }

  const cards = deck.querySelectorAll('.frame-card');
  if (cards.length > 1){
    const prev = cards[0];
    if (window.anime){
      anime({ targets: prev, opacity:[1,0], translateY:[0,-10], duration:360, easing:'easeOutQuad', complete(){ prev.remove(); } });
    } else {
      prev.remove();
    }
  }
}

export function setFrameContentMap(arr){
  // Espera 52 itens; tolera menos e preenche com defaults
  if (!Array.isArray(arr) || !arr.length){
    FRAMES = null;
  } else {
    const base = buildDefaultFrames();
    FRAMES = base.map((fallback, i) => {
      const v = arr[i] || {};
      return {
        title: (typeof v.title === 'string' && v.title) || fallback.title,
        caption: (typeof v.caption === 'string' && v.caption) || fallback.caption,
        image: (typeof v.image === 'string' && v.image) || fallback.image,
        date: (typeof v.date === 'string' || v.date == null) ? v.date : fallback.date
      };
    });
  }
  // Se já inicializado, re-renderiza o take atual
  if (ready){
    const idx = Math.max(0, current);
    current = -1; // força repaint
    show(idx);
  }
}

export function initFrameContent(driver){
  if (!driver) return;
  ready = true;

  driver.on((p)=>{
    const n = 52;
    const idx = Math.min(n-1, Math.floor(p * n));
    show(idx);
  });

  show(0);
}
