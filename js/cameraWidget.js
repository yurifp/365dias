// cameraWidget.js — Interactive instant camera effect
// Simulates a polaroid camera printing a photo when clicked

let cameraInstances = new Map();
let CAMERA_PRINTED_ONCE = false; // global guard per page load

export function initCameraWidget() {
  // Clean up any existing instances
  cameraInstances.clear();
}

export function createCameraEffect(cameraElement, config = {}) {
  if (!cameraElement) return null;

  const photoSrc = config.photoSrc || './assets/images/cine4.svg';
  const photoFactor = Math.min(1, Math.max(0.4, Number(config.photoFactor || 0.75)));
  const useCssSize = !!config.useCssSize;
  const labelText = config.labelText || '';
  const containerId = `camera-container-${Date.now()}`;
  
  // If already wrapped, reuse the existing wrapper to avoid duplicates
  let cameraWrap = cameraElement.closest('.camera-wrap');
  if (!cameraWrap) {
    // Create camera wrapper
    cameraWrap = document.createElement('div');
    cameraWrap.className = 'camera-wrap';
    cameraWrap.id = containerId;
  }
  
  // Ensure a single photo-output container
  let photoOutput = cameraWrap.querySelector('.photo-output');
  // Optional label element above the camera
  let labelEl = cameraWrap.querySelector('.camera-label');
  if (labelText && !labelEl) {
    labelEl = document.createElement('div');
    labelEl.className = 'camera-label';
    labelEl.textContent = labelText;
    cameraWrap.insertBefore(labelEl, cameraElement); // place before the image
  } else if (labelEl && labelText) {
    labelEl.textContent = labelText; // update if changed
  }
  if (!photoOutput) {
    photoOutput = document.createElement('div');
    photoOutput.className = 'photo-output';
  }
  
  // Create or reuse printed photo element
  let printedPhoto = photoOutput.querySelector('img.printed-photo');
  if (!printedPhoto) {
    printedPhoto = document.createElement('img');
    printedPhoto.className = 'printed-photo';
    photoOutput.appendChild(printedPhoto);
  }
  printedPhoto.src = photoSrc;
  printedPhoto.alt = 'Foto Impressa';
  
  // Create flash effect (only once per page)
  let flashEffect = document.getElementById('camera-flash-effect');
  if (!flashEffect) {
    flashEffect = document.createElement('div');
    flashEffect.id = 'camera-flash-effect';
    flashEffect.className = 'camera-flash-effect';
    document.body.appendChild(flashEffect);
  }
  
  // Assemble structure (ensure order: [img.camera-sticker, div.photo-output])
  if (!photoOutput.parentElement) cameraWrap.appendChild(photoOutput);
  
  // Replace the original sticker with the camera wrap
  const parent = cameraElement.parentElement;
  if (parent && cameraElement.closest('.camera-wrap') !== cameraWrap) {
    // Copy only explicit positioning from inline style to avoid conflicts
    const s = cameraElement.style;
    cameraWrap.style.position = s.position || 'absolute';
    // Set one vertical anchor (prefer bottom, else top)
    if (s.bottom) cameraWrap.style.bottom = s.bottom; else if (s.top) cameraWrap.style.top = s.top;
    // Set one horizontal anchor (prefer right, else left)
    if (s.right) cameraWrap.style.right = s.right; else if (s.left) cameraWrap.style.left = s.left;
    // Move any transform (e.g., translateX(-50%)) from sticker to wrapper to avoid double transforms
    if (s.transform) {
      cameraWrap.style.transform = s.transform;
      cameraElement.style.transform = '';
    }
    // Ensure high stacking like stickers
    cameraWrap.style.zIndex = s.zIndex || '100000';
    // If the sticker had an explicit width inline (from JSON), apply it to the wrapper
    if (s.width) {
      cameraWrap.style.width = s.width;
    }
  cameraWrap.style.display = 'inline-block';
  // Tag wrapper with original src so CSS can target per-sticker
  const srcAttr = cameraElement.getAttribute('src') || '';
  cameraWrap.dataset.stickerSrc = srcAttr;
    
    // Insert camera wrap and move original element inside
    parent.insertBefore(cameraWrap, cameraElement);
    cameraElement.classList.add('camera-sticker');
    cameraWrap.insertBefore(cameraElement, photoOutput);

    // The original sticker had absolute positioning relative to the carousel.
    // Now the wrapper is absolutely positioned; the child should be normal flow
    // so it doesn't apply bottom/left offsets again (which would push it away).
    cameraElement.style.position = 'relative';
    cameraElement.style.top = 'auto';
    cameraElement.style.left = 'auto';
    cameraElement.style.right = 'auto';
    cameraElement.style.bottom = 'auto';
    // Ensure predictable sizing
    cameraElement.style.display = 'block';
  }

  // Make sure the camera image fills the wrapper width if wrapper has explicit width
  if (cameraWrap.style.width) {
    cameraElement.style.width = '100%';
  }

  // After DOM placement, size photo-output proportional to camera size
  requestAnimationFrame(() => {
      // Always allow CSS to control sizing (removing inline width/height)
      cameraWrap.classList.add('css-sized');
      photoOutput.style.removeProperty('width');
      photoOutput.style.removeProperty('height');
      printedPhoto.style.width = '100%';
      printedPhoto.style.height = '100%';
  });

  // Animation functions
  function triggerFlash() {
    if (window.anime) {
      anime({
        targets: flashEffect,
        opacity: [0, 0.8, 0],
        duration: 400,
        easing: 'easeOutQuad'
      });
    } else {
      // Fallback
      flashEffect.style.opacity = '0.8';
      setTimeout(() => {
        flashEffect.style.transition = 'opacity 0.4s ease';
        flashEffect.style.opacity = '0';
      }, 100);
    }
  }

  function printPhoto() {
    if (CAMERA_PRINTED_ONCE) return; // only allow once
    CAMERA_PRINTED_ONCE = true;
    // Reset photo position
    if (window.anime) {
      anime.set(printedPhoto, {
        translateY: '-100%',
        opacity: 0
      });
    } else {
      printedPhoto.style.transform = 'translateY(-100%)';
      printedPhoto.style.opacity = '0';
    }

    // Flash effect
    triggerFlash();

    // Camera click animation
    if (window.anime) {
      // Keep center while scaling to avoid lateral shift
      cameraElement.style.transformOrigin = 'center center';
      anime({
        targets: cameraElement,
        scale: [1, 1.06, 1],
        easing: 'easeOutQuad',
        duration: 420,
        begin: () => { cameraElement.style.willChange = 'transform'; },
        complete: () => { cameraElement.style.willChange = 'auto'; }
      });
    }

    // Photo printing animation
    if (window.anime) {
      anime({
        targets: printedPhoto,
        translateY: ['-100%', '0%'],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 2500,
        delay: 200
      });
    } else {
      // Fallback
      setTimeout(() => {
        printedPhoto.style.transition = 'transform 2.5s ease-out, opacity 2.5s ease-out';
        printedPhoto.style.transform = 'translateY(0%)';
        printedPhoto.style.opacity = '1';
      }, 200);
    }
  }

  // Add click event once
  if (!cameraElement.dataset.cameraBound) {
    cameraElement.addEventListener('click', printPhoto);
    cameraElement.dataset.cameraBound = '1';
  }
  
  // Store instance for cleanup
  const instance = {
    element: cameraWrap,
    cleanup: () => {
      cameraElement.removeEventListener('click', printPhoto);
    }
  };
  
  cameraInstances.set(containerId, instance);
  
  return instance;
}

// Enhanced sticker action for camera effect
export function registerCameraAction() {
  // This will be called from sticker_actions.js
  if (typeof window.registerStickerAction === 'function') {
    window.registerStickerAction('camera-effect', ({ element, args }) => {
      if (!element) return;
      
      const config = {
        photoSrc: args?.photoSrc || './assets/images/cine4.svg'
      };
      
      createCameraEffect(element, config);
    });
  }
}

// Utility to setup camera effects for specific stickers
export function setupCameraStickers() {
  // Find all sticker12.svg elements and add camera effect
  const cameraStickers = document.querySelectorAll('img[src*="sticker12.svg"]');
  
  cameraStickers.forEach(sticker => {
    if (!sticker.closest('.camera-wrap')) { // Avoid double setup
      createCameraEffect(sticker, {
        photoSrc: './assets/images/cine4.svg'
      });
    }
  });
}

// Cleanup function
export function destroyCameraWidgets() {
  // Remove listeners and wrappers
  cameraInstances.forEach(instance => {
    try { instance.cleanup && instance.cleanup(); } catch {}
    try { if (instance.element && instance.element.parentElement) instance.element.remove(); } catch {}
  });
  cameraInstances.clear();

  // Also remove any orphan wrappers that might have remained
  document.querySelectorAll('.camera-wrap').forEach(w => {
    try { w.remove(); } catch {}
  });

  // Reset one-time print guard for next slide
  CAMERA_PRINTED_ONCE = false;

  // Remove flash effect
  const flashEffect = document.getElementById('camera-flash-effect');
  if (flashEffect) {
    flashEffect.remove();
  }
}