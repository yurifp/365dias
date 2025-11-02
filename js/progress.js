// progress.js — scroll-controlled progress bar + month labels (Nov/2024 → Oct/2025)
// ESM export: initProgress()

// initProgress can run in two modes:
// - default (scroll): listens to window scroll and computes progress
// - external: caller controls progress via returned API.setProgress(p)
export function initProgress(options = {}) {
  const { external = false } = options;
  const shell = document.querySelector('.progress-shell');
  const track = document.querySelector('.progress-track');
  const fill = document.querySelector('.progress-fill');
  const indicator = document.querySelector('.progress-indicator');
  const monthsOl = document.getElementById('progressMonths');
  if (!shell || !track || !fill || !indicator || !monthsOl) return;

  // Build 13 labels (Nov/2024 → Nov/2025) inclusive
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const months = [];
  const start = new Date(2024, 10, 1); // Nov 2024 (month index 10)
  for (let i=0;i<13;i++){
    const d = new Date(start.getFullYear(), start.getMonth()+i, 1);
    months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
  }
  const labels = [];
  monthsOl.innerHTML = '';
  months.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    monthsOl.appendChild(li);
    labels.push(li);
  });

  function clamp(n, min, max){ return Math.max(min, Math.min(n, max)); }

  const MONTHS = 13;      // main labels
  const SUB_TAKES = 4;    // micro takes per month
  const TOTAL_TAKES = MONTHS * SUB_TAKES; // 52

  function render(scrolled) {
    scrolled = clamp(scrolled, 0, 1);

    // Update CSS custom property for the accent fill
  // Fill reflects fine progress (52 takes)
  const pct = (scrolled * 100).toFixed(3) + '%';
    track.style.setProperty('--p', pct);

    // Move indicator along the inner gauge width (track inset: 12px each side)
  const rect = track.getBoundingClientRect();
  const innerWidth = rect.width - 24; // gauge inset: 12px per side
  const x = (innerWidth) * scrolled; // move continuously with fine progress
    indicator.style.setProperty('--x', x + 'px');

    // aria-valuenow update
  const shellNow = Math.round(scrolled * 100);
    shell.setAttribute('aria-valuenow', String(shellNow));

    // Active month highlighting
    // Highlight only the main month labels (13). We compute monthIdx from fine progress.
    const steps = labels.length; // should be 13
    const activeIndex = Math.min(steps-1, Math.floor(scrolled * MONTHS));
    labels.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
  }

  function computeFromScroll(){
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = clamp(window.scrollY / (scrollMax || 1), 0, 1);
    render(scrolled);
  }

  if (external){
    // Initialize at 0 and return API
    render(0);
    return {
      setProgress(p){ render(p); }
    };
  } else {
    computeFromScroll();
    window.addEventListener('scroll', computeFromScroll, { passive: true });
    window.addEventListener('resize', computeFromScroll);
    return {
      setProgress(){ /* no-op in scroll mode */ }
    };
  }
}
