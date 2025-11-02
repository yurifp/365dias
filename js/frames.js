// frames.js — Simple fixed "frames" HUD whose content changes with virtual scroll
// Export: initFrames(driver)

export function initFrames(driver){
  if (!driver) return;

  // 13 takes (Nov/2024 → Nov/2025) inclusivos
  const frames = [
    { title: 'Nov 2024', desc: 'O começo — o coração descobre um novo ritmo.' },
    { title: 'Dez 2024', desc: 'Luzes de fim de ano e planos sussurrados.' },
    { title: 'Jan 2025', desc: 'Novo ano, promessas e primeiros passeios.' },
    { title: 'Fev 2025', desc: 'Pequenos gestos que viram grandes memórias.' },
    { title: 'Mar 2025', desc: 'Rotina com corações sincronizados.' },
    { title: 'Abr 2025', desc: 'Descobertas, risos e conversas longas.' },
    { title: 'Mai 2025', desc: 'Polaroids, céu dourado e vento leve.' },
    { title: 'Jun 2025', desc: 'Friozinho bom, mãos dadas e filmes.' },
    { title: 'Jul 2025', desc: 'Risos espontâneos, histórias sem roteiro.' },
    { title: 'Ago 2025', desc: 'Pôr do sol que parece desenhado.' },
    { title: 'Set 2025', desc: 'Uma coleção de pequenos milagres.' },
    { title: 'Out 2025', desc: 'Contagem para o mês especial.' },
    { title: 'Nov 2025', desc: 'Um ano de coração aceso — obrigado.' },
  ];

  const hud = document.createElement('div');
  hud.className = 'frame-hud';
  hud.innerHTML = `
    <div class="frame-inner">
      <h2 class="frame-title"></h2>
      <p class="frame-desc"></p>
    </div>
  `;
  document.body.appendChild(hud);
  const titleEl = hud.querySelector('.frame-title');
  const descEl = hud.querySelector('.frame-desc');

  let current = -1;
  function show(i){
    if (i === current) return;
    current = i;
    const f = frames[i] || frames[0];
    // Quick cross-fade
    anime({ targets: [titleEl, descEl], opacity: 0, duration: 160, easing: 'easeOutQuad', complete(){
      titleEl.textContent = f.title;
      descEl.textContent = f.desc;
      anime({ targets: [titleEl, descEl], opacity: 1, translateY: [6, 0], duration: 360, easing: 'easeOutQuad' });
    }});
  }

  driver.on((p)=>{
    const idx = Math.min(frames.length-1, Math.floor(p * frames.length));
    show(idx);
  });

  // Initialize visible content
  show(0);
}
