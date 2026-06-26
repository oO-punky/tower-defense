import gsap from 'gsap';

let isShaking = false;

export function triggerScreenShake(canvas, intensity = 1, duration = 0.9) {
  if (isShaking) return;
  isShaking = true;
  const container = canvas.parentElement || document.body;
  gsap.killTweensOf(canvas, 'x,y,rotation');
  gsap.killTweensOf(container, 'scale');

  const shakeValues = [];
  const frames = Math.floor(duration * 60);

  for (let i = 0; i < frames; i++) {
    const progress = i / frames;
    let currentIntensity;
    let currentScaleIntensity;

    if (progress < 0.15) {
      currentIntensity = 14 * intensity;
      currentScaleIntensity = 0.02 * intensity;
    } else {
      currentIntensity = 14 * intensity * (1 - (progress - 0.15) / 0.85) * (0.6 + Math.abs(Math.sin(progress * Math.PI * 7)));
      currentScaleIntensity = 0.012 * intensity * (1 - (progress - 0.15) / 0.85) * (0.5 + Math.abs(Math.cos(progress * Math.PI * 5)));
    }

    const x = Math.round(((Math.random() - 0.5) * currentIntensity) / 4) * 4;
    const y = Math.round(((Math.random() - 0.5) * currentIntensity) / 4) * 4;
    shakeValues.push({ x, y, scale: 1 + currentScaleIntensity });
  }

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(canvas, { x: 0, y: 0, duration: 0.15, ease: 'power1.out' });
      gsap.to(container, { scale: 1, duration: 0.15, ease: 'power1.out' });
      isShaking = false;
    },
  });

  shakeValues.forEach((shake, index) => {
    tl.to(canvas, { x: shake.x, y: shake.y, duration: 1 / 60, ease: 'none' }, index * (1 / 60));
    tl.to(container, { scale: shake.scale, duration: 1 / 60, ease: 'none' }, index * (1 / 60));
  });
}

export function waveAnnouncement(waveNumber) {
  const el = document.createElement('div');
  el.className = 'wave-announcement';
  el.textContent = `WAVE ${waveNumber}`;
  document.body.appendChild(el);

  gsap.fromTo(el, { scale: 0.5, opacity: 0 }, { scale: 1.2, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(el, {
    scale: 0.8, opacity: 0, duration: 0.8, delay: 1.2, ease: 'power2.in',
    onComplete: () => { if (document.body.contains(el)) document.body.removeChild(el); },
  });
}
