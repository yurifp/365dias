// app_carousel.js — Normal scroll + polaroid carousel with dynamic content
import { initPolaroidCarousel } from './polaroid_carousel.js';
import { initDateChip, setDateMap, setDefaultDay } from './date_chip.js';
import { renderCards } from './cards.js';
import { renderWidgets } from './widgets.js';
import { renderCover } from './cover_dynamic.js';

async function loadContent(){
  try{
    const res = await fetch('./content/content_map.json', { cache:'no-store' });
    const raw = await res.json();
    const items = Array.isArray(raw) ? raw : (Array.isArray(raw.items) ? raw.items : []);
    return items.map((v, i) => ({
      id: v.id || `foto${i+1}`,
      title: v.title || '',
      caption: v.caption || '',
      date: v.date || '',
      image: v.image || '',
      cards: Array.isArray(v.cards) ? v.cards : [],
      widgets: v.widgets || null,
      cover: v.cover || null,
    }));
  }catch(err){
    console.warn('Falha ao carregar content_map.json. Usando demo.', err);
    return [
      { id:'foto1', title:'Nov 2024 — Parte 1/4', caption:'parte 1/4', date:'09/11/2024', image:'./assets/images/nov_2024_1.jpg',
        cards:[
          { type:'location', title:'SP • Brasil', content:{ city:'São Paulo', country:'Brasil', embed:'https://maps.google.com/maps?q=S%C3%A3o%20Paulo&t=&z=12&ie=UTF8&iwloc=&output=embed'}, id:'loc1' },
          { type:'text', title:'Lembrete', content:{ text:'Primeiro café juntos nesse dia.' } },
          { type:'music', title:'Nossa música', content:{ embed:'https://open.spotify.com/embed/track/7BKLCZ1jbUBVqRi2FVlTVw' } }
        ]
      },
      { id:'foto2', title:'Nov 2024 — Parte 2/4', caption:'parte 2/4', date:'16/11/2024', image:'./assets/images/nov_2024_2.jpg',
        cards:[
          { type:'video', title:'Clipe rápido', content:{ embed:'https://www.youtube.com/embed/dQw4w9WgXcQ' } },
          { type:'link', title:'Reserva do jantar', content:{ url:'https://example.com/reserva', title:'Ver reserva' } }
        ]
      },
    ];
  }
}

async function loadCardsMap(){
  try{
    const res = await fetch('./content/cards_map.json', { cache:'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    // Expected shape: { [slideId]: Card[] } or { items: { [slideId]: Card[] } }
    const map = data && typeof data === 'object' ? (data.items || data) : null;
    return (map && typeof map === 'object') ? map : null;
  }catch{
    return null;
  }
}

function updateExternalContent(slide){
  const t = document.getElementById('carouselTitle');
  const d = document.getElementById('carouselDesc');
  const dt = document.getElementById('carouselDate');
  if (t) t.textContent = slide?.title || '';
  if (d) d.textContent = slide?.caption || '';
  if (dt) dt.textContent = slide?.date ? String(slide.date) : '';
}

async function init(){
  const slides = await loadContent();
  // Optionally merge external cards map by id
  const cardsMap = await loadCardsMap();
  if (cardsMap){
    slides.forEach(s => {
      if (!Array.isArray(s.cards) || !s.cards.length){
        const ext = cardsMap[s.id];
        if (Array.isArray(ext)) s.cards = ext;
      }
    });
  }
  // Prepare date map using the actual slide count (not fixed 52)
  setDefaultDay(9);
  const dates = new Array(slides.length).fill(null);
  for (let i=0; i<slides.length; i++){
    const v = slides[i]?.date;
    if (typeof v === 'string' && v.trim()) dates[i] = v.trim();
    else if (typeof v === 'number' && Number.isFinite(v)) dates[i] = { d: v|0 };
  }
  setDateMap(dates);

  // Tiny driver shim to drive the date-chip by index
  const chipDriver = (()=>{
    let p = 0; const subs = [];
    return {
      on(fn){ subs.push(fn); },
      get(){ return p; },
      set(v){ p = Math.max(0, Math.min(1-1e-6, v)); subs.forEach(fn=>fn(p)); }
    };
  })();
  const carousel = await initPolaroidCarousel({
    mount: '#polaroidCarousel',
    slides,
    onChange: (idx, slide) => {
  // drive date chip relative to current number of slides
  chipDriver.set((idx)/Math.max(1, slides.length));
      // animate external content cross-fade
      const els = ['carouselTitle','carouselDesc','carouselDate'].map(id=>document.getElementById(id)).filter(Boolean);
      if (window.anime && els.length){
        anime({ targets: els, opacity:[1,0], duration:120, easing:'easeOutQuad', complete(){
          updateExternalContent(slide);
          anime({ targets: els, opacity:[0,1], translateY:[6,0], duration:260, easing:'easeOutQuad' });
        }});
      } else {
        updateExternalContent(slide);
      }
      // render modular cards for this slide
      if (slide && Array.isArray(slide.cards)){
        renderCards('#cardsGrid', slide.cards);
      } else {
        renderCards('#cardsGrid', []);
      }
      // render widgets + cover for this slide
      renderWidgets('#widgets', slide?.widgets || {});
      renderCover(slide?.cover || {});
    }
  });
  // Initialize date chip after card exists; it auto-mounts inside .frame-card
  initDateChip(chipDriver);
  // Seed first content state
  updateExternalContent(slides[0]);
  chipDriver.set(0/Math.max(1, slides.length));
  // Initial cards
  if (slides[0] && Array.isArray(slides[0].cards)){
    renderCards('#cardsGrid', slides[0].cards);
  }
  // Initial widgets + cover
  renderWidgets('#widgets', slides[0]?.widgets || {});
  renderCover(slides[0]?.cover || {});
}

document.addEventListener('DOMContentLoaded', init);
