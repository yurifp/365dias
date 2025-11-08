// mapWidget.js — Dynamic Google Maps widget for carousel sections
// Handles insertion, animation, and lazy loading of map iframes

let mapObserver = null;

export function initMapWidget() {
  // Initialize intersection observer for lazy loading
  if (!mapObserver && 'IntersectionObserver' in window) {
    mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMapIframe(entry.target);
          mapObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
  }
}

export function renderMapWidget(slide, container) {
  // Check if this slide should have a map
  if (!slide || !slide.hasMap || !container) return;

  // Remove all existing maps to prevent duplicates
  const existingMaps = container.querySelectorAll('.map-wrap');
  existingMaps.forEach(map => map.remove());

  // Create map wrapper
  const mapWrap = document.createElement('div');
  mapWrap.className = 'map-wrap';
  mapWrap.setAttribute('data-aos', 'fade-left');
  mapWrap.setAttribute('data-aos-delay', '100');
  
  // Get map configuration from slide
  const mapConfig = slide.mapConfig || {};
  const mapUrl = mapConfig.url || "https://www.google.com/maps?q=-13.0111376,-38.4927013&z=19&output=embed";
  const mapTitle = mapConfig.title || "Mapa - Localização";

  // Create placeholder for lazy loading
  const placeholder = document.createElement('div');
  placeholder.className = 'map-placeholder';
  placeholder.innerHTML = `
    <div class="map-loading">
      <div class="loading-spinner"></div>
      <p>Carregando mapa...</p>
    </div>
  `;
  
  mapWrap.appendChild(placeholder);
  mapWrap.dataset.mapUrl = mapUrl;
  mapWrap.dataset.mapTitle = mapTitle;

  // Find the best place to insert the map (after carousel content)
  const carouselContent = container.querySelector('.carousel-content');
  const cardsSection = container.querySelector('.cards-section');
  
  if (cardsSection) {
    // Insert before cards section
    container.insertBefore(mapWrap, cardsSection);
  } else if (carouselContent) {
    // Insert after carousel content
    carouselContent.insertAdjacentElement('afterend', mapWrap);
  } else {
    // Fallback: append to container
    container.appendChild(mapWrap);
  }

  // Set up lazy loading
  if (mapObserver) {
    mapObserver.observe(mapWrap);
  } else {
    // Fallback: load immediately if no observer support
    setTimeout(() => loadMapIframe(mapWrap), 300);
  }

  // Animate entrance
  animateMapEntrance(mapWrap);
}

function loadMapIframe(mapWrap) {
  const placeholder = mapWrap.querySelector('.map-placeholder');
  if (!placeholder) return;

  const mapUrl = mapWrap.dataset.mapUrl;
  const mapTitle = mapWrap.dataset.mapTitle;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.title = mapTitle;
  iframe.src = mapUrl;
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

  // Replace placeholder with iframe
  mapWrap.removeChild(placeholder);
  mapWrap.appendChild(iframe);

  // Animate iframe load
  if (window.anime) {
    anime.set(iframe, { opacity: 0, scale: 0.95 });
    anime({
      targets: iframe,
      opacity: [0, 1],
      scale: [0.95, 1],
      easing: 'easeOutQuart',
      duration: 600,
      delay: 100
    });
  }
}

function animateMapEntrance(mapWrap) {
  if (!window.anime) {
    // Fallback: simple CSS animation
    mapWrap.style.opacity = '0';
    mapWrap.style.transform = 'translateY(40px)';
    
    setTimeout(() => {
      mapWrap.style.transition = 'all 1.2s ease-out';
      mapWrap.style.opacity = '1';
      mapWrap.style.transform = 'translateY(0)';
    }, 300);
    return;
  }

  // Anime.js entrance animation
  anime.set(mapWrap, { 
    opacity: 0, 
    translateY: 40,
    scale: 0.98
  });

  anime({
    targets: mapWrap,
    opacity: [0, 1],
    translateY: [40, 0],
    scale: [0.98, 1],
    easing: 'easeOutExpo',
    duration: 1200,
    delay: 300
  });
}

// Utility function to check if a slide should have a map
export function shouldRenderMap(slide) {
  return slide && (slide.hasMap === true || slide.showMap === true);
}

// Clean up observer when not needed
export function destroyMapWidget() {
  if (mapObserver) {
    mapObserver.disconnect();
    mapObserver = null;
  }
}