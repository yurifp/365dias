// polaroid_carousel.js — Reusable polaroid carousel with arrows + swipe
// Usage:
//   const carousel = await initPolaroidCarousel({
//     mount: '#polaroidCarousel',
//     slides: [{ id:'foto1', title:'..', caption:'..', date:'..', image:'...' }, ...],
//     onChange: (idx, slide) => { /* update external content */ }
//   })

export async function initPolaroidCarousel({ mount, slides = [], onChange } = {}){
  const container = typeof mount === 'string' ? document.querySelector(mount) : mount;
  if (!container) throw new Error('mount container not found');
  const ns = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';

  // Build shell
  container.classList.add('polaroid-carousel');
  container.innerHTML = `
    <button class="nav nav-prev" aria-label="Anterior" type="button">◀</button>
    <div class="polaroid-stage">
      <div class="frame-card"></div>
    </div>
    <button class="nav nav-next" aria-label="Próximo" type="button">▶</button>
  `;
  const card = container.querySelector('.frame-card');

  async function loadPolaroidSVG(){
    const res = await fetch('./assets/images/polaroid.svg', { cache:'no-store' });
    const txt = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(txt, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) throw new Error('SVG inválido');
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('x','11');
    img.setAttribute('y','12');
    img.setAttribute('width','207');
    img.setAttribute('height','223');
    img.setAttribute('preserveAspectRatio','xMidYMid slice');
    img.setAttributeNS(XLINK, 'href','');
    if (svg.firstChild) svg.insertBefore(img, svg.firstChild); else svg.appendChild(img);
    return { svg, img };
  }

  const { svg, img: photoNode } = await loadPolaroidSVG();
  card.appendChild(svg);

  let idx = 0;
  const n = slides.length;

  function setPhoto(src){
    const cur = photoNode.getAttribute('href') || photoNode.getAttributeNS(XLINK, 'href') || '';
    if (src && src !== cur){
      if (window.anime){
        anime({ targets: photoNode, opacity:[1,0], duration:160, easing:'easeOutQuad', complete(){
          photoNode.setAttribute('href', src);
          photoNode.setAttributeNS(XLINK, 'href', src);
          anime({ targets: photoNode, opacity:[0,1], duration:260, easing:'easeOutQuad' });
        }});
      } else {
        photoNode.setAttribute('opacity','0');
        photoNode.setAttribute('href', src);
        photoNode.setAttributeNS(XLINK, 'href', src);
        requestAnimationFrame(()=> photoNode.setAttribute('opacity','1'));
      }
    }
  }

  function show(i){
    if (i<0) i = n-1; if (i>=n) i = 0; idx = i;
    const s = slides[idx];
    setPhoto(s?.image || '');
    if (typeof onChange === 'function') onChange(idx, s);
    container.dataset.index = String(idx);
    container.dataset.id = s?.id || '';
  }

  function next(){ show(idx+1); }
  function prev(){ show(idx-1); }

  container.querySelector('.nav-prev').addEventListener('click', prev);
  container.querySelector('.nav-next').addEventListener('click', next);

  // Swipe for mobile
  let startX=0, dx=0, touching=false;
  card.addEventListener('touchstart', (e)=>{ touching=true; startX = e.touches[0].clientX; dx=0; }, { passive:true });
  card.addEventListener('touchmove', (e)=>{ if (!touching) return; dx = e.touches[0].clientX - startX; }, { passive:true });
  card.addEventListener('touchend', ()=>{
    if (!touching) return; touching=false;
    const TH = 40; // pixels
    if (dx > TH) prev(); else if (dx < -TH) next();
  }, { passive:true });

  // Click areas: left/right half of card
  card.addEventListener('click', (e)=>{
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width/2) prev(); else next();
  });

  // Init
  show(0);

  return { show, next, prev, getIndex:()=>idx };
}
