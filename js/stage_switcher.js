// stage_switcher.js — Maps virtual progress to a visible section (slide)
// Export: initStageSwitcher(driver)

export function initStageSwitcher(driver){
  if (!driver) return;

  // 52 takes (13 months * 4)
  const MONTHS = 13, SUB_TAKES = 4, TOTAL_TAKES = MONTHS * SUB_TAKES;

  // Strategy:
  // - Prefer elements with [data-take="0..51"] exact mapping
  // - Else, if there are exactly 52 .snap-section, use DOM order
  // - Else, try [data-month-index][data-step]
  // - Else, fall back to modulo mapping on available sections

  const all = Array.from(document.querySelectorAll('.snap-section'));
  if (!all.length) return;

  const byTake = new Array(TOTAL_TAKES).fill(null);
  const withDataTake = all.filter(s => s.hasAttribute('data-take'));
  if (withDataTake.length){
    withDataTake.forEach(s => {
      const v = parseInt(s.getAttribute('data-take'), 10);
      if (!Number.isNaN(v) && v>=0 && v<TOTAL_TAKES) byTake[v] = s;
    });
  }

  if (!byTake.every(Boolean)){
    if (all.length === TOTAL_TAKES){
      for (let i=0;i<TOTAL_TAKES;i++) byTake[i] = byTake[i] || all[i];
    } else {
      const withMonthStep = all.filter(s => s.hasAttribute('data-month-index') && s.hasAttribute('data-step'));
      withMonthStep.forEach(s => {
        const m = parseInt(s.getAttribute('data-month-index'),10);
        const st = parseInt(s.getAttribute('data-step'),10);
        if (!Number.isNaN(m) && !Number.isNaN(st)){
          const idx = m*SUB_TAKES + st;
          if (idx>=0 && idx<TOTAL_TAKES) byTake[idx] = s;
        }
      });
      // Fill any gaps with modulo fallback
      for (let i=0;i<TOTAL_TAKES;i++) if (!byTake[i]) byTake[i] = all[i % all.length];
    }
  }

  let current = -1;
  function setActiveIdx(i){
    if (i === current) return;
    current = i;
    const active = byTake[i];
    const allUnique = Array.from(new Set(byTake));
    allUnique.forEach(s => s.classList.toggle('is-active', s === active));
  }

  driver.on((p)=>{
    const idx = Math.min(TOTAL_TAKES-1, Math.floor(p * TOTAL_TAKES));
    setActiveIdx(idx);
  });

  setActiveIdx(0);
}
