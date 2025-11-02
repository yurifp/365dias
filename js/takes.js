// takes.js — Ensure 52 micro-takes sections exist in DOM
// Export: ensureTakesSections()

export function ensureTakesSections(){
  const container = document.querySelector('.snap-container');
  if (!container) return;

  const MONTHS = 13, SUB_TAKES = 4, TOTAL = MONTHS * SUB_TAKES; // 52

  // If already present, do nothing
  const existing = container.querySelectorAll('.snap-section[data-take]');
  if (existing.length >= TOTAL) return;

  const monthNames = ['Nov 2024','Dez 2024','Jan 2025','Fev 2025','Mar 2025','Abr 2025','Mai 2025','Jun 2025','Jul 2025','Ago 2025','Set 2025','Out 2025','Nov 2025'];

  // Append after the cover so it stays under fixed overlays
  for (let i=0;i<TOTAL;i++){
    const m = Math.floor(i / SUB_TAKES);
    const s = i % SUB_TAKES;
    const sec = document.createElement('section');
    sec.className = 'snap-section stage-take';
    sec.setAttribute('data-take', String(i));
    sec.setAttribute('data-month-index', String(m));
    sec.setAttribute('data-step', String(s));
    sec.setAttribute('data-label', `${monthNames[m]} • step ${s+1}`);
    // Minimal visible hint (can be styled out); keep empty for performance
    container.appendChild(sec);
  }
}
