// frame_content.js — Fixed-stage content that changes per take (52 frames = 13 meses × 4)
// Exports: initFrameContent(driver), setFrameContentMap(array)

let FRAMES = null;     // array de 52 itens: { title, caption, image, date? }
let deck = null;       // container fixo
let card = null;       // único card polaroid reutilizado
let svgEl = null;      // SVG da moldura (inline)
let photoNode = null;  // <image> dentro do SVG
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

async function loadPolaroidSVG(){
  // Carrega e inlina o SVG do usuário
  try{
    const res = await fetch('./assets/images/polaroid.svg', { cache:'no-store' });
    const txt = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(txt, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) throw new Error('SVG inválido');
    // Cria o nó <image> na região útil (x=11,y=12,w=207,h=178) com cover
    const XLINK = 'http://www.w3.org/1999/xlink';
    const ns = 'http://www.w3.org/2000/svg';
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('x', '11');
    img.setAttribute('y', '12');
    img.setAttribute('width', '207');
    img.setAttribute('height', '178');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('opacity', '1');
    img.setAttributeNS(XLINK, 'href', '');
    // Insere a imagem como primeira camada, moldura por cima
    if (svg.firstChild) svg.insertBefore(img, svg.firstChild);
    else svg.appendChild(img);
    return { svg, img };
  }catch(err){
    console.warn('[polaroid] Falha ao carregar SVG, caindo no fallback:', err);
    return { svg: null, img: null };
  }
}

async function ensureDeckAndCard(){
  if (!deck){
    deck = document.createElement('div');
    deck.className = 'frame-deck';
    deck.setAttribute('aria-live', 'polite');
    document.body.appendChild(deck);
  }
  if (!card){
    card = document.createElement('div');
    card.className = 'frame-card';
    // Carrega e injeta o SVG do usuário como a ÚNICA hub da polaroid
    const loaded = await loadPolaroidSVG();
    svgEl = loaded.svg;
    photoNode = loaded.img;
    if (svgEl) card.appendChild(svgEl);
    // Metadados (fora do SVG)
    const title = document.createElement('h3');
    title.className = 'title';
    const caption = document.createElement('span');
    caption.className = 'caption';
    card.appendChild(title);
    card.appendChild(caption);
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px) scale(0.98)';
    deck.appendChild(card);
    // animate in once
    if (window.anime){
      anime({ targets: card, opacity:[0,1], translateY:[10,0], scale:[0.98,1], duration:520, easing:'easeOutQuad' });
    } else {
      card.style.opacity = '1';
      card.style.transform = 'none';
    }
  }
}

async function show(i){
  const frames = FRAMES || buildDefaultFrames();
  const n = frames.length || 52;
  const idx = Math.min(n-1, Math.max(0, i|0));
  if (idx === current) return;
  current = idx;
  await ensureDeckAndCard();

  const item = frames[idx] || frames[0];
  const titleEl = card.querySelector('.title');
  const captionEl = card.querySelector('.caption');

  // Atualiza título e legenda
  titleEl.textContent = item.title || '';
  captionEl.textContent = item.caption || '';
  titleEl.style.display = item.title ? '' : 'none';
  captionEl.style.display = item.caption ? '' : 'none';

  // Troca de imagem dentro do SVG (xMidYMid slice) com pequena transição
  const nextSrc = item.image || '';
  if (photoNode && nextSrc){
    const XLINK = 'http://www.w3.org/1999/xlink';
    const currentHref = photoNode.getAttribute('href') || photoNode.getAttributeNS(XLINK, 'href') || '';
    if (currentHref !== nextSrc){
      if (window.anime){
        anime({ targets: photoNode, opacity:[1,0], duration:140, easing:'easeOutQuad', complete(){
          photoNode.setAttribute('href', nextSrc);
          photoNode.setAttributeNS(XLINK, 'href', nextSrc);
          anime({ targets: photoNode, opacity:[0,1], duration:220, easing:'easeOutQuad' });
        }});
      } else {
        photoNode.setAttribute('opacity', '0');
        photoNode.setAttribute('href', nextSrc);
        photoNode.setAttributeNS(XLINK, 'href', nextSrc);
        requestAnimationFrame(()=>{ photoNode.setAttribute('opacity', '1'); });
      }
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
