// musicWidget.js — Dynamic Spotify widget for carousel sections
// Handles insertion, animation, and lazy loading of Spotify embed iframes

let musicObserver = null;

export function initMusicWidget() {
  // Initialize intersection observer for lazy loading
  if (!musicObserver && 'IntersectionObserver' in window) {
    musicObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMusicIframe(entry.target);
          musicObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
  }

  // Hint the browser to establish early connections for Spotify
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    const ensurePreconnect = (href) => {
      if (!head.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const l = document.createElement('link');
        l.rel = 'preconnect';
        l.href = href;
        l.crossOrigin = '';
        head.appendChild(l);
      }
    };
    ensurePreconnect('https://open.spotify.com');
    ensurePreconnect('https://i.scdn.co');
  } catch {}
}

export function renderMusicWidget(slide, container) {
  // Check if this slide should have music
  if (!slide || !slide.hasMusic || !container) return;

  // Remove all existing music widgets to prevent duplicates
  const existingMusic = container.querySelectorAll('.music-wrap');
  existingMusic.forEach(music => music.remove());

  // Create music wrapper
  const musicWrap = document.createElement('div');
  musicWrap.className = 'music-wrap';
  musicWrap.setAttribute('data-aos', 'fade-up');
  musicWrap.setAttribute('data-aos-delay', '100');
  
  // Get music configuration from slide
  const musicConfig = slide.musicConfig || {};
  const musicSrc = musicConfig.src || slide.musicSrc || "";
  const musicTitle = musicConfig.title || "Música do Spotify";

  if (!musicSrc) {
    console.warn('No music source found for slide:', slide.title);
    return;
  }

  // Keep wrapper hidden until iframe is ready to avoid overlay during loading
  musicWrap.classList.add('is-hidden');
  musicWrap.dataset.musicSrc = musicSrc;
  musicWrap.dataset.musicTitle = musicTitle;

  // Find the best place to insert the music widget
  const carouselContent = container.querySelector('.carousel-content');
  const mapWrap = container.querySelector('.map-wrap');
  const cardsSection = container.querySelector('.cards-section');
  
  if (mapWrap) {
    // Insert after map if exists
    mapWrap.insertAdjacentElement('afterend', musicWrap);
  } else if (cardsSection) {
    // Insert before cards section
    container.insertBefore(musicWrap, cardsSection);
  } else if (carouselContent) {
    // Insert after carousel content
    carouselContent.insertAdjacentElement('afterend', musicWrap);
  } else {
    // Fallback: append to container
    container.appendChild(musicWrap);
  }

  // Load immediately to avoid long placeholder time
  loadMusicIframe(musicWrap);

  // Animate entrance
  animateMusicEntrance(musicWrap);
}

function loadMusicIframe(musicWrap) {
  // Clean any previous children (no visible placeholder)
  musicWrap.innerHTML = '';

  const musicSrc = musicWrap.dataset.musicSrc;
  const musicTitle = musicWrap.dataset.musicTitle;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.style.borderRadius = '12px';
  iframe.src = musicSrc;
  iframe.width = '100%';
  iframe.height = '352';
  iframe.frameBorder = '0';
  iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
  // Prefer eager loading for faster paint
  iframe.setAttribute('loading', 'eager');
  iframe.title = musicTitle;

  // Insert iframe and reveal only when it's ready (or after a short timeout)
  musicWrap.appendChild(iframe);

  const reveal = () => {
    musicWrap.classList.remove('is-hidden');
  };

  let revealed = false;
  iframe.addEventListener('load', () => { if (!revealed){ revealed = true; reveal(); }});
  // Safety reveal in case load event is delayed
  setTimeout(() => { if (!revealed){ revealed = true; reveal(); } }, 600);

  // Animate iframe load
  if (window.anime) {
    anime.set(iframe, { opacity: 0, scale: 0.95 });
    anime({
      targets: iframe,
      opacity: [0, 1],
      scale: [0.95, 1],
      easing: 'easeOutQuart',
      duration: 800,
    });
  }
}

function animateMusicEntrance(musicWrap) {
  if (!window.anime) {
    // Fallback: simple CSS animation
    musicWrap.style.opacity = '0';
    musicWrap.style.transform = 'translateY(40px)';
    
    setTimeout(() => {
      musicWrap.style.transition = 'all 1.2s ease-out';
      musicWrap.style.opacity = '1';
      musicWrap.style.transform = 'translateY(0)';
    }, 400);
    return;
  }

  // Anime.js entrance animation
  anime.set(musicWrap, { 
    opacity: 0, 
    translateY: 40,
    scale: 0.98
  });

  anime({
    targets: musicWrap,
    opacity: [0, 1],
    translateY: [40, 0],
    scale: [0.98, 1],
    easing: 'easeOutExpo',
    duration: 1200,
    delay: 400
  });
}

// Utility function to check if a slide should have music
export function shouldRenderMusic(slide) {
  return slide && (slide.hasMusic === true || slide.showMusic === true);
}

// Clean up observer when not needed
export function destroyMusicWidget() {
  if (musicObserver) {
    musicObserver.disconnect();
    musicObserver = null;
  }
}