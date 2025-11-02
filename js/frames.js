// frames.js — Fixed HUD for per-month sticker (no text)
// Export: initFrames(driver)

export function initFrames(driver){
  if (!driver) return;

  // 52 micro-takes (13 meses × 4). Um sticker por take.
  // Edite manualmente cada linha abaixo com o arquivo que quiser (SVG/PNG/JPG).
  // Dica: deixe string vazia "" para ocultar o sticker naquele take.
  const TOTAL_TAKES = 52;
  const stickers = [
    // Nov 2024 — takes 1..4
    './assets/images/stickers/take-01.svg', // 1/4
    './assets/images/stickers/take-02.svg', // 2/4
    './assets/images/stickers/take-03.svg', // 3/4
    './assets/images/stickers/take-04.svg', // 4/4
    // Dez 2024 — takes 5..8
    './assets/images/stickers/take-05.svg',
    './assets/images/stickers/take-06.svg',
    './assets/images/stickers/take-07.svg',
    './assets/images/stickers/take-08.svg',
    // Jan 2025 — takes 9..12
    './assets/images/stickers/take-09.svg',
    './assets/images/stickers/take-10.svg',
    './assets/images/stickers/take-11.svg',
    './assets/images/stickers/take-12.svg',
    // Fev 2025 — takes 13..16
    './assets/images/stickers/take-13.svg',
    './assets/images/stickers/take-14.svg',
    './assets/images/stickers/take-15.svg',
    './assets/images/stickers/take-16.svg',
    // Mar 2025 — takes 17..20
    './assets/images/stickers/take-17.svg',
    './assets/images/stickers/take-18.svg',
    './assets/images/stickers/take-19.svg',
    './assets/images/stickers/take-20.svg',
    // Abr 2025 — takes 21..24
    './assets/images/stickers/take-21.svg',
    './assets/images/stickers/take-22.svg',
    './assets/images/stickers/take-23.svg',
    './assets/images/stickers/take-24.svg',
    // Mai 2025 — takes 25..28
    './assets/images/stickers/take-25.svg',
    './assets/images/stickers/take-26.svg',
    './assets/images/stickers/take-27.svg',
    './assets/images/stickers/take-28.svg',
    // Jun 2025 — takes 29..32
    './assets/images/stickers/take-29.svg',
    './assets/images/stickers/take-30.svg',
    './assets/images/stickers/take-31.svg',
    './assets/images/stickers/take-32.svg',
    // Jul 2025 — takes 33..36
    './assets/images/stickers/take-33.svg',
    './assets/images/stickers/take-34.svg',
    './assets/images/stickers/take-35.svg',
    './assets/images/stickers/take-36.svg',
    // Ago 2025 — takes 37..40
    './assets/images/stickers/take-37.svg',
    './assets/images/stickers/take-38.svg',
    './assets/images/stickers/take-39.svg',
    './assets/images/stickers/take-40.svg',
    // Set 2025 — takes 41..44
    './assets/images/stickers/take-41.svg',
    './assets/images/stickers/take-42.svg',
    './assets/images/stickers/take-43.svg',
    './assets/images/stickers/take-44.svg',
    // Out 2025 — takes 45..48
    './assets/images/stickers/take-45.svg',
    './assets/images/stickers/take-46.svg',
    './assets/images/stickers/take-47.svg',
    './assets/images/stickers/take-48.svg',
    // Nov 2025 — takes 49..52
    './assets/images/stickers/take-49.svg',
    './assets/images/stickers/take-50.svg',
    './assets/images/stickers/take-51.svg',
    './assets/images/stickers/take-52.svg',
  ];

  const hud = document.createElement('div');
  hud.className = 'frame-hud';
  hud.innerHTML = `
    <div class="frame-inner">
      <img class="frame-sticker" alt="" />
    </div>
  `;
  document.body.appendChild(hud);
  const imgEl = hud.querySelector('.frame-sticker');

  // graceful errors: fallback to PNG once, then hide
  imgEl.addEventListener('error', ()=>{
    const src = imgEl.getAttribute('src') || '';
    if (src.endsWith('.svg')){
      const png = src.replace(/\.svg$/i, '.png');
      imgEl.setAttribute('src', png);
    } else {
      imgEl.style.opacity = '0';
    }
  });

  let current = -1;
  function applyStickerClasses(i){
    const take = String(i+1).padStart(2,'0'); // 01..52
    const month = String(Math.floor(i/4)+1).padStart(2,'0'); // 01..13
    const part = String((i%4)+1); // 1..4
    // remove previous dynamic classes
    imgEl.classList.forEach(cls => {
      if (cls.startsWith('sticker-take-') || cls.startsWith('sticker-month-') || cls.startsWith('sticker-part-')){
        imgEl.classList.remove(cls);
      }
    });
    imgEl.classList.add(`sticker-take-${take}`, `sticker-month-${month}`, `sticker-part-${part}`);
    // expose dataset for alternative CSS selectors
    hud.dataset.take = take;
    hud.dataset.month = month;
    hud.dataset.part = part;
  }
  function show(i){
    if (i === current) return;
    current = i;
    const src = stickers[i] || '';
    if (!src){ imgEl.style.opacity = '0'; return; }
    if (imgEl.getAttribute('src') === src) return;
    applyStickerClasses(i);
    // Cross-fade sticker
    if (window.anime){
      anime({ targets: imgEl, opacity: 0, duration: 120, easing: 'easeOutQuad', complete(){
        imgEl.setAttribute('src', src);
        // when new image loads, fade in
        imgEl.onload = ()=>{
          anime({ targets: imgEl, opacity: 1, translateY: [6,0], duration: 260, easing: 'easeOutQuad' });
          imgEl.onload = null;
        };
      }});
    } else {
      imgEl.style.opacity = '0';
      imgEl.setAttribute('src', src);
      requestAnimationFrame(()=>{ imgEl.style.opacity = '1'; });
    }
  }

  driver.on((p)=>{
    const idx = Math.min(TOTAL_TAKES-1, Math.floor(p * TOTAL_TAKES));
    show(idx);
  });

  show(0);
}
