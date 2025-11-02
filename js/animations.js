// animations.js — Anime.js timelines and reveals
// Exports: initAnimations()

function splitLetters(selector) {
  const el = document.querySelector(selector);
  if (!el) return [];
  const text = el.textContent.trim();
  el.textContent = '';
  const chars = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch;
    span.style.display = 'inline-block';
    span.style.willChange = 'transform, opacity';
    el.appendChild(span);
    chars.push(span);
  }
  return chars;
}

function introTimeline() {
  const chars = splitLetters('.title-hero');
  const tl = anime.timeline({ autoplay: true, duration: 1000, easing: 'easeOutExpo' });
  tl.add({
    targets: chars,
    translateY: [18, 0],
    opacity: [0, 1],
    delay: anime.stagger(20),
  }).add({
    targets: '.subtitle',
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 600
  }, 200);
  return tl;
}

function revealOnView() {
  const reveal = (el) => {
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 900,
      easing: 'easeOutQuad'
    });
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        reveal(e.target);
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

function polaroidEnter() {
  const els = document.querySelectorAll('.polaroid');
  els.forEach((el, i) => {
    el.classList.add('floaty');
    anime({
      targets: el,
      opacity: [0, 1],
      scale: [0.94, 1],
      rotate: [-1.6, 0],
      translateY: [12, 0],
      delay: i * 60 + 200,
      duration: 900,
      easing: 'easeOutElastic(1, .7)'
    });
  });
}

function floatingLoop() {
  anime({
    targets: '.tilt',
    rotateZ: [ -1, 1 ],
    translateY: [ -2, 2 ],
    direction: 'alternate',
    duration: 4000,
    easing: 'easeInOutSine',
    loop: true,
    delay: anime.stagger(300)
  });
}

function parallax() {
  const onScroll = () => {
    const y = window.scrollY;
    anime.set('.section-cover .cover-inner', { translateY: y * -0.02 });
    anime.set('.section-final .final-message', { translateY: y * -0.01 });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function heartPulseFinal() {
  const btn = document.querySelector('.secret-btn');
  const heart = document.querySelector('.heart-final');
  if (!btn || !heart) return;
  btn.addEventListener('click', () => {
    anime({
      targets: heart,
      scale: [0.9, 1.08, 1],
      duration: 900,
      easing: 'easeOutElastic(1, .7)'
    });
  });
}

export function initAnimations(masterScrollProvider){
  // Intro timeline that we will drive via master progress (0..1)
  const intro = introTimeline();

  const drive = (p) => {
    p = Math.max(0, Math.min(1, p));
    intro.seek(intro.duration * Math.min(1, p * 2));
  };

  if (masterScrollProvider && typeof masterScrollProvider.on === 'function'){
    masterScrollProvider.on(drive);
  } else {
    // Fallback: map real scroll if no provider
    function onScroll(){
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = Math.max(0, Math.min(1, scrollY / (max || 1)));
      drive(p);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  revealOnView();
  polaroidEnter();
  floatingLoop();
  // Parallax based on real scroll becomes irrelevant in locked mode; keep only in fallback
  if (!masterScrollProvider) parallax();
  heartPulseFinal();
}
