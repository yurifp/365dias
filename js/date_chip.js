// date_chip.js — Fixed minimal date block (DD / MM / YYYY) driven by virtual scroll
// Export: initDateChip(driver)

// Module state for per-take date mapping (52 takes)
// dates[i] can be: null | { d:1..31, m:1..12, y:YYYY } | 'dd/mm/yyyy'
const DATE_START = { y: 2024, m: 11 }; // Nov/2024
let DATE_CHIP_STATE = { dates: new Array(52).fill(null), defaultDay: 9 };

function parseDateString(str, fallbackDay, takeIdx){
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  // Supported formats:
  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) return { d: +m[1], m: +m[2], y: +m[3] };
  // yyyy/mm/dd, yyyy-mm-dd, yyyy.mm.dd
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  // mm/yyyy or mm-yy(yy)
  m = s.match(/^(\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) return { d: Math.max(1, Math.min(31, fallbackDay|0 || 1)), m: +m[1], y: +m[2] };
  // dd only (use base month/year from take)
  m = s.match(/^(\d{1,2})$/);
  if (m){
    const monthOffset = Math.floor((takeIdx||0) / 4);
    const base = new Date(DATE_START.y, DATE_START.m - 1 + monthOffset, 1);
    return { d: +m[1], m: base.getMonth()+1, y: base.getFullYear() };
  }
  return null;
}

export function initDateChip(driver){
  if (!driver) return;

  // Build chip
  const chip = document.createElement('div');
  chip.className = 'date-chip';
  chip.innerHTML = `
    <div class="date-inner" aria-label="Data do take">
      <div class="odo" data-part="dd">
        <div class="digit-window"><div class="digit-col"></div></div>
        <div class="digit-window"><div class="digit-col"></div></div>
      </div>
      <span class="sep">/</span>
      <div class="odo" data-part="mm">
        <div class="digit-window"><div class="digit-col"></div></div>
        <div class="digit-window"><div class="digit-col"></div></div>
      </div>
      <span class="sep">/</span>
      <div class="odo" data-part="yyyy">
        <div class="digit-window"><div class="digit-col"></div></div>
        <div class="digit-window"><div class="digit-col"></div></div>
        <div class="digit-window"><div class="digit-col"></div></div>
        <div class="digit-window"><div class="digit-col"></div></div>
      </div>
    </div>
  `;
  // Handwritten simple text layer (preferred for visual fidelity)
  const textLayer = document.createElement('div');
  textLayer.className = 'date-text';
  chip.appendChild(textLayer);
  // Try to mount inside the polaroid card so it travels with the frame
  function mountIntoCard(){
    const card = document.querySelector('.frame-card');
    if (card && chip.parentElement !== card){
      card.appendChild(chip);
      return true;
    }
    return false;
  }
  if (!mountIntoCard()){
    // Fallback: append to body now and migrate when the card becomes available
    document.body.appendChild(chip);
    const mo = new MutationObserver(()=>{
      if (mountIntoCard()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
    // Also attempt once on next frame in case card is created right after
    requestAnimationFrame(mountIntoCard);
  }

  // Fill columns 0..9
  chip.querySelectorAll('.digit-col').forEach(col => {
    const frag = document.createDocumentFragment();
    for (let d=0; d<10; d++){
      const span = document.createElement('span');
      span.className = 'digit';
      span.textContent = String(d);
      frag.appendChild(span);
    }
    col.appendChild(frag);
  });

  const ddCols = chip.querySelectorAll('.odo[data-part="dd"] .digit-col');
  const mmCols = chip.querySelectorAll('.odo[data-part="mm"] .digit-col');
  const yyCols = chip.querySelectorAll('.odo[data-part="yyyy"] .digit-col');

  let prev = { dT: -1, dU: -1, mT: -1, mU: -1, y0: -1, y1: -1, y2: -1, y3: -1 };

  function setDigit(col, value){
    value = Math.max(0, Math.min(9, value|0));
    // Use the actual digit row height for perfect stepping (avoids clipping when
    // font metrics make the visible row differ from the window height)
    const firstDigit = col.querySelector('.digit');
    const windowEl = col.parentElement; // .digit-window
    const h = (firstDigit && firstDigit.getBoundingClientRect().height) ||
              (windowEl && windowEl.getBoundingClientRect().height) || 28;
    const y = -value * h;
    if (window.anime){
      anime({ targets: col, translateY: y, duration: 360, easing: 'easeOutCubic' });
    } else {
      col.style.transform = `translateY(${y}px)`;
    }
  }

  // Apply for a specific take index (0..51)
  function applyForTake(takeIdx){
    // Default base from take: each 4 takes advance month
    const monthOffset = Math.floor(takeIdx / 4);
    const base = new Date(DATE_START.y, DATE_START.m - 1 + monthOffset, 1);
    let dd = Math.max(1, Math.min(31, DATE_CHIP_STATE.defaultDay|0));
    let mm = base.getMonth() + 1;
    let yy = base.getFullYear();

    const override = DATE_CHIP_STATE.dates[takeIdx];
    if (override){
      if (typeof override === 'string'){
        const parsed = parseDateString(override, DATE_CHIP_STATE.defaultDay, takeIdx);
        if (parsed){ dd = parsed.d; mm = parsed.m; yy = parsed.y; }
      } else if (typeof override === 'object'){
        if (override.d != null) dd = override.d|0;
        if (override.m != null) mm = override.m|0;
        if (override.y != null) yy = override.y|0;
      }
      dd = Math.max(1, Math.min(31, dd));
      mm = Math.max(1, Math.min(12, mm));
      yy = Math.max(1, yy);
    }

    const dT = Math.floor(dd/10);
    const dU = dd % 10;
    const mT = Math.floor(mm/10); // tens
    const mU = mm % 10;           // units
    const yStr = String(yy).padStart(4,'0');
    const y0 = +yStr[0], y1 = +yStr[1], y2 = +yStr[2], y3 = +yStr[3];

    if (ddCols.length){
      if (dT !== prev.dT) setDigit(ddCols[0], dT), prev.dT = dT;
      if (dU !== prev.dU) setDigit(ddCols[1], dU), prev.dU = dU;
    }
    if (mmCols.length){
      if (mT !== prev.mT) setDigit(mmCols[0], mT), prev.mT = mT;
      if (mU !== prev.mU) setDigit(mmCols[1], mU), prev.mU = mU;
    }
    if (yyCols.length){
      if (y0 !== prev.y0) setDigit(yyCols[0], y0), prev.y0 = y0;
      if (y1 !== prev.y1) setDigit(yyCols[1], y1), prev.y1 = y1;
      if (y2 !== prev.y2) setDigit(yyCols[2], y2), prev.y2 = y2;
      if (y3 !== prev.y3) setDigit(yyCols[3], y3), prev.y3 = y3;
    }
    // Update simple text layer (handwritten look)
    const ddStr = String(dd).padStart(2, '0');
    const mmStr = String(mm).padStart(2, '0');
    const out = `${ddStr} / ${mmStr} / ${yy}`;
    if (textLayer.textContent !== out) textLayer.textContent = out;
  }

  driver.on((p)=>{
    // Map progress to the current dates length (not a fixed 52)
    const n = Math.max(1, DATE_CHIP_STATE.dates.length);
    const idx = Math.min(n-1, Math.floor(p * n));
    applyForTake(idx);
  });

  // Initialize at first take
  applyForTake(0);
}

// Set full date mapping for 52 takes. Each entry: 'dd/mm/yyyy' or {d,m,y} or null
export function setDateMap(dates){
  if (!Array.isArray(dates)) return;
  const len = Math.max(1, dates.length|0);
  const arr = new Array(len).fill(null);
  for (let i=0;i<len;i++){
    const v = dates[i];
    if (v == null) { arr[i] = null; continue; }
    if (typeof v === 'string') arr[i] = v;
    else if (typeof v === 'object'){
      arr[i] = { d: v.d|0, m: v.m|0, y: v.y|0 };
    }
  }
  DATE_CHIP_STATE.dates = arr;
}

// Set one take date by index
export function setDateForTake(idx, date){
  if (idx<0 || idx>=DATE_CHIP_STATE.dates.length) return;
  if (typeof date === 'string') DATE_CHIP_STATE.dates[idx] = date;
  else if (date && typeof date === 'object') DATE_CHIP_STATE.dates[idx] = { d: date.d|0, m: date.m|0, y: date.y|0 };
}

// Set default day used for takes without explicit date (fallback)
export function setDefaultDay(day){
  DATE_CHIP_STATE.defaultDay = Math.max(1, Math.min(31, day|0));
}
