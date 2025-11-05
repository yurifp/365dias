// widgets.js — Render iOS/Notion/Linktree-like widgets per slide
// Config shape:
// {
//   title?: string,
//   subtitle?: string,
//   items?: Array<{ id?:string, type:'map'|'video'|'music'|'link'|'text', title?:string, subtitle?:string, url?:string, city?:string, country?:string, thumb?:string }>
// }

function E(tag, cls){ const n = document.createElement(tag); if (cls) n.className = cls; return n; }

export function renderWidgets(mount, config, ctx){
  const host = typeof mount === 'string' ? document.querySelector(mount) : mount;
  if (!host) return;
  const data = config || {};
  host.innerHTML = '';
  if (ctx && ctx.slideId) host.dataset.slideId = String(ctx.slideId);

  const head = E('div','widgets-head');
  const h2 = E('h2'); h2.id = 'widgetsTitle'; h2.textContent = data.title || 'Coleção';
  const p = E('p'); p.textContent = data.subtitle || 'Widgets inspirados no iOS 16/17+ e Notion — leves e polidos.';
  head.append(h2,p);
  host.append(head);

  const grid = E('div','widgets-grid');
  host.append(grid);

  const items = Array.isArray(data.items) ? data.items : [];
  const frag = document.createDocumentFragment();
  items.forEach((it, i)=>{
    const card = E('article','widget-card');
    card.dataset.type = it.type || 'text';
    card.dataset.id = it.id ? String(it.id) : `w${i+1}`;
    if (it.class) card.classList.add(String(it.class));
    if (it.span){
      card.dataset.span = String(it.span); // e.g., "2x1", "1x2", "2x2"
    }
    // size controls
    if (Number.isFinite(it.colSpan)) card.style.gridColumn = `span ${it.colSpan|0}`;
    if (Number.isFinite(it.rowSpan)) card.style.gridRow = `span ${it.rowSpan|0}`;
    if (it.minHeight) card.style.minHeight = String(it.minHeight);
    // css var overrides
    if (it.vars && typeof it.vars === 'object'){
      Object.entries(it.vars).forEach(([k,v])=>{
        try{ card.style.setProperty(k, String(v)); }catch{ /* ignore */ }
      });
    }
    // inline style (last-priority)
    if (it.style && typeof it.style === 'object'){
      Object.assign(card.style, it.style);
    }

    // header
    const head = E('div','widget-head');
    const icon = E('span','w-icon'); icon.innerHTML = iconSVG(card.dataset.type);
    const title = E('div','w-title');
    const strong = E('strong'); strong.textContent = it.title || defaultTitle(card.dataset.type);
    const sub = E('span'); sub.textContent = it.subtitle || defaultSubtitle(card.dataset.type);
    title.append(strong, sub); head.append(icon, title); card.append(head);

    // body/media
    switch(card.dataset.type){
      case 'map':{
        const media = E('div','w-media map-mini');
        const pin = E('div','map-pin'); media.append(pin);
        card.append(media);
        break; }
      case 'video':{
        const media = E('div','w-media video-thumb');
        const play = E('button','play'); play.type='button'; play.setAttribute('aria-label','Play'); media.append(play);
        card.append(media);
        break; }
      case 'music':{
        const media = E('div','w-media music-cover');
        const art = E('div','cover-art');
        const track = E('div','track');
        const b = E('b'); b.textContent = it.track || 'Track';
        const s = E('small'); s.textContent = it.artist || 'Artist';
        track.append(b,s);
        const play = E('button','play'); play.type='button'; play.setAttribute('aria-label','Play');
        media.append(art, track, play);
        card.append(media);
        break; }
      case 'link':{
        const link = E('div','w-link');
        const url = E('div','url'); url.textContent = it.url || 'https://example.com';
        link.append(url); card.append(link);
        break; }
      default:{
        const t = E('div','w-text'); t.setAttribute('contenteditable','true'); t.textContent = it.text || 'Add a title...'; card.append(t);
      }
    }
    frag.append(card);
  });
  grid.append(frag);

  if (window.anime){
    anime({ targets: grid.children, opacity:[0,1], translateY:[8,0], delay: anime.stagger(30), duration:260, easing:'easeOutQuad' });
  }
}

function defaultTitle(type){
  switch(type){
    case 'map': return 'Localização';
    case 'video': return 'Clipe curto';
    case 'music': return 'Nossa música';
    case 'link': return 'Link';
    default: return 'Anotação';
  }
}
function defaultSubtitle(type){
  switch(type){
    case 'map': return 'Localização';
    case 'video': return 'Vídeo';
    case 'music': return 'Música';
    case 'link': return 'Link';
    default: return '';
  }
}
function iconSVG(type){
  const m = {
    map: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s-7-4-7-11a7 7 0 1114 0c0 7-7 11-7 11z" fill="#0066ff" opacity=".9"/><circle cx="12" cy="11" r="3" fill="#fff"/></svg>',
    video: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="14" height="14" rx="3" fill="#0066ff" opacity=".9"/><path d="M17 9l4-2v10l-4-2V9z" fill="#0066ff"/></svg>',
    music: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5v10.5A2.5 2.5 0 116 13V7h10V5H9z" fill="#0066ff"/></svg>',
    link: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13l-2 2a4 4 0 005.66 5.66l2-2M14 11l2-2a4 4 0 10-5.66-5.66l-2 2" stroke="#0066ff" stroke-width="2" stroke-linecap="round"/></svg>',
    text: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h12M4 18h8" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  return m[type] || m.text;
}
