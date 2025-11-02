// frame_stage.js — Drives on-screen content per take, e.g., heart mood
// Export: initFrameStage(driver)

import { setHeartMood } from './heart_particles.js';

export function initFrameStage(driver){
  if (!driver) return;

  // Palette across 13 months (soft hue travel)
  const palette = [
    '#ff5c70', '#ff6a5c', '#ff7b4f', '#ff8d4f', '#ff9e5e', '#ffad70',
    '#ff7aa2', '#ff6ec0', '#ce78ff', '#9a7bff', '#6e92ff', '#57b3ff', '#59e1ff'
  ];

  const amps = [0.14,0.13,0.15,0.12,0.16,0.14,0.13,0.15,0.12,0.16,0.14,0.13,0.15];
  const speeds = [2.6,2.3,2.9,2.4,3.1,2.7,2.4,2.9,2.5,3.0,2.6,2.3,2.8];

  // React only on main month boundaries: floor(p * 13)
  let lastMonth = -1;
  driver.on((p)=>{
    const months = 13;
    const monthIdx = Math.min(months-1, Math.floor(p * months));
    if (monthIdx !== lastMonth){
      lastMonth = monthIdx;
      setHeartMood({ color: palette[monthIdx], amp: amps[monthIdx], speed: speeds[monthIdx] });
    }
  });
}
