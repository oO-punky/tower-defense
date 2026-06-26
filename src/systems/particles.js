import gsap from 'gsap';

const particlesContainer = document.getElementById('floating-particles');

export function createBurst(x, y, colors, burstIntensity, type = 'pixel') {
  const particleCount = Math.floor((20 + burstIntensity * 15));
  const configs = {
    pixel: { duration: 1.8, ease: 'power2.out', borderRadius: '0', velocityMultiplier: 1.0 },
    gold: { duration: 2.2, ease: 'back.out(2.2)', borderRadius: '50%', velocityMultiplier: 1.1 },
    death: { duration: 2.4, ease: 'elastic.out(1.0, 0.4)', borderRadius: '0', velocityMultiplier: 1.3 },
    upgrade: { duration: 2.0, ease: 'power3.out', borderRadius: '0', velocityMultiplier: 1.0 },
    build: { duration: 1.6, ease: 'power2.out', borderRadius: '50%', velocityMultiplier: 0.8 },
    wave: { duration: 2.6, ease: 'expo.out', borderRadius: '0', velocityMultiplier: 1.5 },
  };
  const config = configs[type] || configs.pixel;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 8 + 4;
    Object.assign(particle.style, {
      position: 'fixed',
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      width: size + 'px',
      height: size + 'px',
      borderRadius: config.borderRadius,
      pointerEvents: 'none',
      zIndex: '100',
    });
    particlesContainer.appendChild(particle);
    gsap.set(particle, { x, y, scale: Math.random() * 1.2 + 0.6 });
    gsap.to(particle, {
      duration: config.duration + Math.random() * 0.4,
      physics2D: {
        velocity: (Math.random() * 220 + 80) * config.velocityMultiplier * burstIntensity,
        angle: Math.random() * 360,
        gravity: 200,
        friction: 0.03,
      },
      opacity: 0,
      scale: 0,
      ease: config.ease,
      onComplete: () => {
        if (particlesContainer.contains(particle)) particlesContainer.removeChild(particle);
      },
    });
  }
}

export function createScorePopup(x, y, text, color = '#fbbf24') {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  Object.assign(popup.style, {
    position: 'fixed',
    left: x + 'px',
    top: y + 'px',
    fontSize: '14px',
    fontWeight: 'bold',
    color,
    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    zIndex: '200',
  });
  document.body.appendChild(popup);

  gsap.fromTo(popup, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
  gsap.to(popup, { y: '-=60', opacity: 0, duration: 2.0, ease: 'power1.out', delay: 0.4,
    onComplete: () => { if (document.body.contains(popup)) document.body.removeChild(popup); },
  });
}

export function createMegaExplosion(x, y, burstIntensity, sfxVolume, playSoundFn) {
  const totalParticles = Math.floor(90 * (1 + burstIntensity * 0.2));
  const colors = ['#ff4e4e', '#ff8f4e', '#ffcf4e', '#ffffff', '#ff6b9d', '#ff3030', '#FFD700'];

  if (playSoundFn) playSoundFn('explosion', { volume: 0.7, pitchMin: 0.55, pitchMax: 0.65 });

  const numWaves = 3;
  for (let wave = 0; wave < numWaves; wave++) {
    setTimeout(() => {
      const waveParticles = Math.floor(totalParticles / numWaves);
      for (let i = 0; i < waveParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 18 + 6;
        Object.assign(particle.style, {
          position: 'fixed',
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          width: size + 'px',
          height: size + 'px',
          borderRadius: Math.random() > 0.2 ? '0' : '50%',
          pointerEvents: 'none',
          zIndex: '100',
          boxShadow: `0 0 ${Math.random() * 3 + 1}px ${colors[Math.floor(Math.random() * colors.length)]}77`,
        });
        particlesContainer.appendChild(particle);
        gsap.set(particle, { x, y, scale: Math.random() * 1.8 + 0.4 });
        gsap.to(particle, {
          duration: 2.0 + Math.random() * 1.0,
          physics2D: {
            velocity: (Math.random() * 350 + 120 + wave * 60) * (1 + burstIntensity * 0.1),
            angle: Math.random() * 360,
            gravity: 140 + wave * 20,
            friction: 0.02,
            angularVelocity: Math.random() * 400 - 200,
          },
          opacity: 0,
          scale: 0.05,
          ease: 'power1.out',
          onComplete: () => { if (particlesContainer.contains(particle)) particlesContainer.removeChild(particle); },
        });
      }
    }, wave * 60);
  }
}

export function createProjectileImpact(x, y, color) {
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    Object.assign(p.style, {
      position: 'fixed', backgroundColor: color, width: '4px', height: '4px',
      borderRadius: '50%', pointerEvents: 'none', zIndex: '90',
    });
    particlesContainer.appendChild(p);
    gsap.set(p, { x, y, scale: 1 });
    gsap.to(p, {
      duration: 0.4,
      physics2D: { velocity: Math.random() * 60 + 20, angle: Math.random() * 360, gravity: 80, friction: 0.04 },
      opacity: 0,
      onComplete: () => { if (particlesContainer.contains(p)) particlesContainer.removeChild(p); },
    });
  }
}

export function clearAllParticles() {
  particlesContainer.innerHTML = '';
}
