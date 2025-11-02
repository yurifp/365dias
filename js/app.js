// app.js — bootstraps progress + animations + particles + dot nav
import { initProgress } from './progress.js';
import { initAnimations } from './animations.js';
import { initScrollDriver } from './scroll_driver.js';
import { initHeartParticles } from './heart_particles.js';
import { initFrames } from './frames.js';
import { initFrameStage } from './frame_stage.js';
import { initFrameContent, setFrameContentMap } from './frame_content.js';
import { initDateChip, setDateMap, setDefaultDay } from './date_chip.js';
import { ensureTakesSections } from './takes.js';
import { initStageSwitcher } from './stage_switcher.js';

function installImageFallback(){
  const placeholder =
    'data:image/svg+xml;utf8,'+
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#20242b"/>
            <stop offset="1" stop-color="#12151a"/>
          </linearGradient>
        </defs>
        <rect width="600" height="750" fill="url(#g)"/>
      </svg>`
    );
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => { img.src = placeholder; }, { once: true });
  });
}

// Replaced particles with premium starry night background

function initDotNav(){
  document.querySelectorAll('.dot-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function init(){
  // Virtual scroll driver (locks layout and emits progress 0..1)
  const driver = initScrollDriver();

  // Optional: snap to nearest take when user stops scrolling for a moment
  (function installSnapToTake(){
    const MONTHS = 13, SUB_TAKES = 4, TOTAL_TAKES = MONTHS * SUB_TAKES; // 52
    const SNAP_DELAY = 220; // ms after last input
    const EPS = 0.0025;     // tolerance to consider already on a boundary
    let tid;
    driver.on((p)=>{
      clearTimeout(tid);
      tid = setTimeout(()=>{
        const now = driver.get();
        const nearest = Math.round(now * TOTAL_TAKES) / TOTAL_TAKES;
        if (Math.abs(now - nearest) < EPS) return; // already close enough
        const snapP = Math.min(1 - 1e-6, Math.max(0, nearest));
        driver.set(snapP);
      }, SNAP_DELAY);
    });
  })();

  // Progress bar in external mode, driven by driver
  const progressAPI = initProgress({ external: true });
  if (progressAPI && typeof progressAPI.setProgress === 'function'){
    driver.on((p)=> progressAPI.setProgress(p));
  }

  // Animations driven by the same master progress
  // Ensure the cover is the visible stage in locked mode
  const cover = document.getElementById('cover');
  if (cover) cover.classList.add('is-active');

  // Build micro-takes (52) if missing and enable stage switching per take
  ensureTakesSections();
  initStageSwitcher(driver);

  initAnimations(driver);
  initFrames(driver);
  initFrameStage(driver);
  initFrameContent(driver);
  initDateChip(driver);
  // Carrega o mapa de conteúdo (52) e aplica em card + data
  setDefaultDay(9); // fallback para takes sem data explícita
  ;(async function loadContentMap(){
    try{
      const res = await fetch('./content/content_map.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const raw = await res.json();

      // Suporta dois formatos:
      // 1) Array simples de 52 itens (compatibilidade)
      // 2) Objeto { items: [...52], mainDates: { '2024-11': '09/11/2024', ... } }
      const isArray = Array.isArray(raw);
      const items = isArray ? raw : (Array.isArray(raw.items) ? raw.items : []);
      const mainDates = !isArray && raw && typeof raw.mainDates === 'object' ? raw.mainDates : null;

      if (!Array.isArray(items)) throw new Error('JSON inválido: esperado array de itens');

      setFrameContentMap(items);

      const dates = new Array(52).fill(null);
      const N = Math.min(52, items.length);
      for (let i=0;i<N; i++){
        const v = items[i];
        if (!v) continue;
        if (typeof v.date === 'string' && v.date.trim()) {
          dates[i] = v.date.trim();
        } else if (typeof v.date === 'number' && Number.isFinite(v.date)){
          const d = Math.max(1, Math.min(31, v.date|0));
          dates[i] = { d };
        } else {
          dates[i] = null;
        }
      }

      // Meses base: Nov/2024 (m=0) até Nov/2025 (m=12)
      // 1) Aplique mainDates (se existir) no 1º take do mês
      if (mainDates){
        const baseYear = 2024, baseMonth = 11; // Nov/2024
        for (let m=0;m<13;m++){
          const dateObj = new Date(baseYear, baseMonth-1 + m, 1);
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth()+1).padStart(2,'0');
          const key = `${yyyy}-${mm}`; // ex: 2024-11
          const v = mainDates[key];
          if (v != null){
            const start = m*4;
            // Aceita string ou número (dia)
            if (typeof v === 'string' && v.trim()) dates[start] = v.trim();
            else if (typeof v === 'number' && Number.isFinite(v)) dates[start] = { d: Math.max(1, Math.min(31, v|0)) };
          }
        }
      }

      // 2) Herdar data do 1º take do mês (i=m*4) quando null
      for (let m=0; m<13; m++){
        const start = m*4;
        const monthSeed = dates[start];
        if (monthSeed != null){
          for (let k=1;k<4;k++) if (dates[start+k] == null) dates[start+k] = monthSeed;
        }
      }
      setDateMap(dates);
    } catch(err){
      // Falha de carregamento (ex.: abrir direto via file://). Mantém defaults.
      // Dica: use uma extensão de servidor local (ex: Live Server) para permitir fetch.
      console.warn('[content_map] Não foi possível carregar o JSON:', err);
    }
  })();

  // Dot nav is irrelevant in locked mode; keep disabled
  // initDotNav();
  installImageFallback();
  initHeartParticles();
}

document.addEventListener('DOMContentLoaded', init);
