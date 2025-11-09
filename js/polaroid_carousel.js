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
  const DEFAULT_FRAME = './assets/images/polaroid.svg';

  // Build shell
  container.classList.add('polaroid-carousel');
  container.innerHTML = `
    <div class="polaroid-stage">
      <div class="frame-card"></div>
    </div>
  `;
  const card = container.querySelector('.frame-card');

  async function loadPolaroidSVG(frameSrc = DEFAULT_FRAME){
    const res = await fetch(frameSrc, { cache:'no-store' });
    const txt = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(txt, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) throw new Error('SVG inválido');
    // Image node used for photo slides
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('x','11');
    img.setAttribute('y','12');
    img.setAttribute('width','209');
    img.setAttribute('height','233');
    img.setAttribute('preserveAspectRatio','xMidYMid slice');
    img.setAttributeNS(XLINK, 'href','');
    // Video container inside the SVG using foreignObject (so the frame stays on top)
    const fo = document.createElementNS(ns, 'foreignObject');
    fo.setAttribute('x','11');
    fo.setAttribute('y','12');
    fo.setAttribute('width','209');
    fo.setAttribute('height','233');
    // Create an HTML <video> element inside the foreignObject
    const videoEl = document.createElement('video');
    videoEl.setAttribute('playsinline','');
    videoEl.setAttribute('webkit-playsinline','');
    videoEl.muted = true; // allow autoplay on mobile
    videoEl.loop = true;
    videoEl.preload = 'metadata';
    // Inline sizing to avoid relying on external CSS inside foreignObject
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.objectFit = 'cover';
    videoEl.style.display = 'none';
    fo.appendChild(videoEl);
    // Insert media nodes before the frame shapes so they sit under the frame graphics
    if (svg.firstChild) svg.insertBefore(fo, svg.firstChild); else svg.appendChild(fo);
    if (svg.firstChild) svg.insertBefore(img, svg.firstChild); else svg.appendChild(img);
    return { svg, img, fo, videoEl };
  }

  // Current frame and media nodes
  let currentFrame = DEFAULT_FRAME;
  let svg, photoNode, videoFO, videoEl;
  async function mountFrame(frameSrc = DEFAULT_FRAME){
    const built = await loadPolaroidSVG(frameSrc);
    svg = built.svg; photoNode = built.img; videoFO = built.fo; videoEl = built.videoEl;
    card.querySelector('svg')?.remove();
    card.appendChild(svg);
  }
  await mountFrame(DEFAULT_FRAME);

  // Fullscreen button (only visible for video)
  const fsBtn = document.createElement('button');
  fsBtn.className = 'video-fs-btn';
  fsBtn.type = 'button';
  fsBtn.setAttribute('aria-label','Ver vídeo em tela cheia');
  fsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  fsBtn.style.display = 'none';
  card.appendChild(fsBtn);

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

  function hidePhoto(){
    // Hide photo without removing (keeps layout stable)
    if (window.anime){
      anime({ targets: photoNode, opacity:[1,0], duration:150, easing:'easeOutQuad' });
    } else {
      photoNode.setAttribute('opacity','0');
    }
  }

  function showVideo(src){
    if (!src){ return; }
    // Hide image, show video
    hidePhoto();
    try{
      if (videoEl.src !== src){
        videoEl.src = src;
        // reset currentTime only when changing source
        try{ videoEl.currentTime = 0; }catch{}
      }
      videoEl.style.display = '';
      const play = () => videoEl.play().catch(()=>{});
      if (window.anime){
        videoEl.style.opacity = 0;
        anime({ targets: videoEl, opacity:[0,1], duration:260, easing:'easeOutQuad', begin: play });
      } else {
        videoEl.style.opacity = 1; play();
      }
    }catch{}
  }

  function hideVideo(){
    try{
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
    }catch{}
    videoEl.style.display = 'none';
  }

  // Fullscreen helpers
  function isFullscreen(){
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || false;
  }
  async function requestFS(){
    try{
      if (videoEl.requestFullscreen){ await videoEl.requestFullscreen(); return; }
      if (videoEl.webkitRequestFullscreen){ videoEl.webkitRequestFullscreen(); return; }
      if (videoEl.msRequestFullscreen){ videoEl.msRequestFullscreen(); return; }
      if (videoEl.webkitEnterFullscreen){ videoEl.webkitEnterFullscreen(); return; }
    }catch{}
  }
  async function exitFS(){
    try{
      if (document.exitFullscreen){ await document.exitFullscreen(); return; }
      if (document.webkitExitFullscreen){ document.webkitExitFullscreen(); return; }
      if (document.msExitFullscreen){ document.msExitFullscreen(); return; }
    }catch{}
  }
  fsBtn.addEventListener('click', async (e)=>{
    e.stopPropagation();
    if (isFullscreen()) await exitFS(); else await requestFS();
  });

  async function show(i){
    if (i<0) i = n-1; if (i>=n) i = 0; idx = i;
    const s = slides[idx];
    // Ensure frame if slide requests a custom one
    const wantedFrame = (s && s.frame) ? s.frame : DEFAULT_FRAME;
    if (wantedFrame !== currentFrame){
      currentFrame = wantedFrame;
      await mountFrame(wantedFrame);
      // re-bind fullscreen click listener to the new video element
      fsBtn.onclick = null;
      fsBtn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        if (isFullscreen()) await exitFS(); else await requestFS();
      });
    }
    // Decide media type
    if (s && s.video){
      hideVideo(); // ensure fresh state before switching
      showVideo(s.video);
      fsBtn.style.display = '';
    } else {
      // Back to photo mode
      hideVideo();
      if (s && s.image){
        // Ensure image is visible
        if (window.anime){ anime({ targets: photoNode, opacity:[0,1], duration:220, easing:'easeOutQuad' }); }
        photoNode.setAttribute('href', s.image);
        photoNode.setAttributeNS(XLINK, 'href', s.image);
      } else {
        // no media
        hidePhoto();
      }
      fsBtn.style.display = 'none';
    }
    if (typeof onChange === 'function') onChange(idx, s);
    container.dataset.index = String(idx);
    container.dataset.id = s?.id || '';
  }

  function next(){ show(idx+1); }
  function prev(){ show(idx-1); }

  // Swipe for mobile
  let startX=0, dx=0, touching=false;
  card.addEventListener('touchstart', (e)=>{ touching=true; startX = e.touches[0].clientX; dx=0; }, { passive:true });
  card.addEventListener('touchmove', (e)=>{ if (!touching) return; dx = e.touches[0].clientX - startX; }, { passive:true });
  card.addEventListener('touchend', ()=>{
    if (!touching) return; touching=false;
    const TH = 40; // pixels
    if (dx > TH) prev(); else if (dx < -TH) next();
  }, { passive:true });

  // Click navigation disabled - only arrow buttons and swipe work now
  // card.addEventListener('click', (e)=>{
  //   if (e.target && e.target.closest && e.target.closest('.slide-sticker[role="button"]')) return;
  //   const rect = card.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   if (x < rect.width/2) prev(); else next();
  // });

  // Init
  show(0);

  return { show, next, prev, getIndex:()=>idx };
}
