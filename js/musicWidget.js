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

  // Create placeholder for lazy loading
  const placeholder = document.createElement('div');
  placeholder.className = 'music-placeholder';
  placeholder.innerHTML = `
    <div class="music-loading">
      <div class="loading-spinner"></div>
      <div class="spotify-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.175.289-.551.38-.84.205-2.3-1.405-5.195-1.725-8.605-.945-.328.075-.66-.132-.735-.46s.132-.66.46-.735c3.738-.855 6.965-.495 9.555 1.095.289.175.38.551.205.84zm1.2-2.67c-.22.36-.69.475-1.05.255-2.63-1.62-6.64-2.085-9.755-1.14-.39.12-.8-.105-.92-.495s.105-.8.495-.92c3.56-1.08 8.005-.56 11.005 1.25.36.22.475.69.255 1.05zm.105-2.78C15.24 9.4 8.87 9.17 5.16 10.42c-.46.155-.95-.095-1.105-.555s.095-.95.555-1.105c4.27-1.43 11.295-1.155 15.545 1.335.42.245.56.785.315 1.205s-.785.56-1.205.315z" fill="#1DB954"/>
        </svg>
      </div>
      <p>Carregando música do Spotify...</p>
    </div>
  `;
  
  musicWrap.appendChild(placeholder);
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

  // Set up lazy loading
  if (musicObserver) {
    musicObserver.observe(musicWrap);
  } else {
    // Fallback: load immediately if no observer support
    setTimeout(() => loadMusicIframe(musicWrap), 500);
  }

  // Animate entrance
  animateMusicEntrance(musicWrap);
}

function loadMusicIframe(musicWrap) {
  const placeholder = musicWrap.querySelector('.music-placeholder');
  if (!placeholder) return;

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
  iframe.setAttribute('loading', 'lazy');
  iframe.title = musicTitle;

  // Replace placeholder with iframe
  musicWrap.removeChild(placeholder);
  musicWrap.appendChild(iframe);

  // Animate iframe load
  if (window.anime) {
    anime.set(iframe, { opacity: 0, scale: 0.95 });
    anime({
      targets: iframe,
      opacity: [0, 1],
      scale: [0.95, 1],
      easing: 'easeOutQuart',
      duration: 800,
      delay: 150
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