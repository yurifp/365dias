// cover_dynamic.js — Render a simple dynamic cover section per slide
// config: { title?: string, subtitle?: string }

export function renderCover(config){
  const sec = document.getElementById('cover');
  if (!sec) return;
  const center = sec.querySelector('.cover-center');
  if (!center) return;

  const data = config || {};
  // Replace inner with a minimal, elegant hero
  center.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'cover-dyn';
  box.innerHTML = `
    <h2>${escapeHTML(data.title || 'Capa personalizada')}</h2>
    <p>${escapeHTML(data.subtitle || 'Texto especial desta foto')}</p>
  `;
  center.appendChild(box);
}

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, (c)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
  })[c]);
}
