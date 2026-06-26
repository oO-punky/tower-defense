export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.popups = [];
    this.MAX = 300;
  }

  burst(x, y, colors, intensity = 1, opts = {}) {
    const count = opts.count || Math.floor(20 + intensity * 15);
    const speed = opts.speed || 300;
    const gravity = opts.gravity ?? 200;
    const friction = opts.friction ?? 0.03;
    const life = opts.life ?? 2;
    const sizeRange = opts.sizeRange || [4, 12];

    for (let i = 0; i < count && this.particles.length < this.MAX; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.5 + 0.5) * speed * intensity;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        life: life * (0.3 + Math.random() * 0.7),
        maxLife: life,
        gravity, friction,
      });
    }
  }

  impact(x, y, color) {
    for (let i = 0; i < 6 && this.particles.length < this.MAX; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * 40 + 20;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        color, size: 4,
        life: 0.4, maxLife: 0.4,
        gravity: 80, friction: 0.04,
      });
    }
  }

  explosion(x, y, intensity = 1) {
    const colors = ['#ff4e4e', '#ff8f4e', '#ffcf4e', '#ffffff', '#ff6b9d', '#ff3030', '#FFD700'];
    const total = Math.floor(90 * (1 + intensity * 0.2));
    for (let i = 0; i < total && this.particles.length < this.MAX; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.5 + 0.5) * (350 + (i % 3) * 60) * (1 + intensity * 0.1);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - (i % 3) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 18,
        life: 2.0 + Math.random() + (i % 3) * 0.3,
        maxLife: 3.5,
        gravity: 140 + (i % 3) * 20,
        friction: 0.02,
      });
    }
  }

  popup(x, y, text, color) {
    this.popups.push({
      x, y, text, color,
      life: 2.4, maxLife: 2.4,
      vy: -40,
    });
  }

  update(dt) {
    for (const p of this.particles) {
      p.vy += p.gravity * dt;
      p.vx *= (1 - p.friction * dt);
      p.vy *= (1 - p.friction * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.popups) {
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.popups = this.popups.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.min(1, (p.life / p.maxLife) * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const p of this.popups) {
      const alpha = Math.min(1, (p.life / p.maxLife) * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = 'bold 14px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
    this.popups.length = 0;
  }
}
