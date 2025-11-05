// cards.js — render modular interactive cards for the current slide
// Supported types: location, video, music, text, link

function el(tag, cls){ const n = document.createElement(tag); if (cls) n.className = cls; return n; }

export function renderCards(mount, cards){
  const host = typeof mount === 'string' ? document.querySelector(mount) : mount;
  if (!host) return;
  host.innerHTML = '';
  const list = Array.isArray(cards) ? cards : [];

  const fr = document.createDocumentFragment();
  list.forEach((c, i)=>{
    const card = el('article', 'card');
    card.dataset.type = c?.type || 'text';
    card.dataset.id = String(c?.id ?? i+1);

    // header row with optional icon/title
    const header = el('header', 'card-head');
    const icon = el('span', 'icon');
    icon.innerHTML = getIconSVG(card.dataset.type);
    const title = el('h3', 'title');
    title.textContent = c?.title || defaultTitle(card.dataset.type);
    header.append(icon, title);
    card.append(header);

    const body = el('div', 'card-body');
    card.append(body);

    switch(card.dataset.type){
      case 'location':{
        // supports embed (iframe) or static image, else text fallback
        if (c?.content?.embed){
          const iframe = el('iframe', 'map-embed');
          iframe.src = c.content.embed;
          iframe.loading = 'lazy';
          iframe.referrerPolicy = 'no-referrer-when-downgrade';
          iframe.setAttribute('allowfullscreen', '');
          body.append(iframe);
        } else if (c?.content?.image){
          const img = el('img', 'map-img');
          img.src = c.content.image;
          img.alt = `${c?.content?.city || ''} ${c?.content?.country || ''}`.trim();
          body.append(img);
        }
        const caption = el('p','muted');
        caption.textContent = `${c?.content?.city || ''}${c?.content?.city && c?.content?.country ? ', ' : ''}${c?.content?.country || ''}`;
        body.append(caption);
        break; }
      case 'video':{
        if (c?.content?.embed){
          const iframe = el('iframe','video-embed');
          iframe.src = c.content.embed;
          iframe.loading = 'lazy';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          iframe.setAttribute('allowfullscreen','');
          body.append(iframe);
        } else if (c?.content?.src){
          const video = el('video','video-player');
          video.src = c.content.src;
          video.controls = true;
          video.playsInline = true;
          body.append(video);
        }
        break; }
      case 'music':{
        if (c?.content?.embed){
          const iframe = el('iframe','music-embed');
          iframe.src = c.content.embed;
          iframe.loading = 'lazy';
          iframe.setAttribute('allow','autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
          body.append(iframe);
        } else if (c?.content?.src){
          const audio = el('audio','music-player');
          audio.src = c.content.src;
          audio.controls = true;
          body.append(audio);
        } else if (c?.content?.url){
          const a = el('a','btn');
          a.href = c.content.url; a.target = '_blank'; a.rel = 'noreferrer noopener';
          a.textContent = 'Abrir música';
          body.append(a);
        }
        break; }
      case 'link':{
        const a = el('a','link-card');
        a.href = c?.content?.url || '#';
        a.target = '_blank'; a.rel='noreferrer noopener';
        a.textContent = c?.content?.title || c?.content?.url || 'Abrir link';
        body.append(a);
        break; }
      default:{
        const p = el('p','');
        p.textContent = c?.content?.text || c?.title || '';
        body.append(p);
      }
    }

    fr.append(card);
  });
  host.append(fr);

  // small reveal animation
  if (window.anime){
    anime({ targets: host.querySelectorAll('.card'), opacity:[0,1], translateY:[8,0], delay: anime.stagger(40), duration:320, easing:'easeOutQuad' });
  }
}

function defaultTitle(type){
  switch(type){
    case 'location': return 'Localização';
    case 'video': return 'Vídeo';
    case 'music': return 'Música';
    case 'link': return 'Link';
    default: return 'Nota';
  }
}

function getIconSVG(type){
  const map = {
    location: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s-7-4-7-11a7 7 0 1114 0c0 7-7 11-7 11z" fill="#ff5c70"/><circle cx="12" cy="11" r="3" fill="#fff"/></svg>',
    video: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="14" height="14" rx="3" fill="#e2b34c"/><path d="M17 9l4-2v10l-4-2V9z" fill="#e2b34c"/></svg>',
    music: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5v10.5A2.5 2.5 0 116 13V7h10V5H9z" fill="#ff637c"/></svg>',
    link: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13l-2 2a4 4 0 005.66 5.66l2-2M14 11l2-2a4 4 0 10-5.66-5.66l-2 2" stroke="#d6d9df" stroke-width="2" stroke-linecap="round"/></svg>',
    text: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h12M4 18h8" stroke="#d6d9df" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  return map[type] || map.text;
}
