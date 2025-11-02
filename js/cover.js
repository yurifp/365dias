// cover.js — builds the heart mosaic like the reference cover and animates it
// Export: initCover()

export function initCover(){
  const container = document.getElementById('heartMosaic');
  if (!container) return;

  // Matrix for a large heart using 0/1 characters. 19 cols × 15 rows.
  // You can tweak to change the silhouette.
  const matrix = [
    '0000011110000111100',
    '0001111111101111110',
    '0011111111111111111',
    '0111111111111111111',
    '1111111111111111111',
    '1111111111111111111',
    '0111111111111111110',
    '0011111111111111100',
    '0001111111111111000',
    '0000111111111110000',
    '0000011111111110000',
    '0000001111111100000',
    '0000000111111000000',
    '0000000011110000000',
    '0000000001100000000'
  ];

  const rows = matrix.length;
  const cols = matrix[0].length;
  container.style.setProperty('--rows', rows);
  container.style.setProperty('--cols', cols);

  // Build cells (dots)
  const frag = document.createDocumentFragment();
  const cells = [];
  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      const cell = document.createElement('div');
      cell.className = 'heart-cell';
      if (matrix[r][c] === '1'){
        const span = document.createElement('span');
        span.className = 'heart-dot';
        cell.appendChild(span);
        cells.push(span);
      }
      frag.appendChild(cell);
    }
  }
  container.appendChild(frag);

  // Stagger in from center + breathing loop
  if (window.anime){
    const centerIndex = Math.floor(cells.length/2);
    anime({
      targets: cells,
      opacity: [0, 1],
      scale: [0.8, 1],
      delay: anime.stagger(14, { grid: [cols, rows], from: 'center' }),
      duration: 600,
      easing: 'easeOutQuad'
    });

    anime({
      targets: cells,
      scale: [1, 1.06, 1],
      easing: 'easeInOutSine',
      duration: 2600,
      delay: anime.stagger(40, { grid: [cols, rows], from: 'center' }),
      loop: true
    });
  }

  // HUD ring rotations
  if (window.anime){
    anime({ targets: '.hud-rotate-slow', rotate: '1turn', easing: 'linear', duration: 26000, loop: true });
    anime({ targets: '.hud-rotate-mid', rotate: '-1turn', easing: 'linear', duration: 18000, loop: true });
    anime({ targets: '.hud-rotate-fast', rotate: '1turn', easing: 'linear', duration: 8000, loop: true });
  }
}
