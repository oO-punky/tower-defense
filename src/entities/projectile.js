import { DEFAULT_GRID_SIZE, ENEMY_TYPES } from '../config.js';

export class Projectile {
  constructor(fireData, allEnemies) {
    this.typeId = fireData.typeId;
    this.fromX = fireData.fromX;
    this.fromY = fireData.fromY;
    this.target = fireData.target;
    this.damage = fireData.damage;
    this.color = fireData.color;
    this.splash = fireData.splash;
    this.splashDamage = fireData.splashDamage;
    this.slow = fireData.slow;
    this.slowDuration = fireData.slowDuration;
    this.chain = fireData.chain;
    this.chainDamage = fireData.chainDamage;
    this.crit = fireData.crit;
    this.critDamage = fireData.critDamage;
    this.allEnemies = allEnemies;

    this.x = fireData.fromX;
    this.y = fireData.fromY;
    this.speed = 400;
    this.arrived = false;
    this.results = [];
  }

  update(delta) {
    if (this.arrived) return;

    if (!this.target || !this.target.alive) {
      this.arrived = true;
      return;
    }

    const dx = this.target.pixelX - this.x;
    const dy = this.target.pixelY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed * delta) {
      this.arrived = true;
      this.resolve();
    } else {
      this.x += (dx / dist) * this.speed * delta;
      this.y += (dy / dist) * this.speed * delta;
    }
  }

  resolve() {
    if (!this.target || !this.target.alive) return;

    const isCrit = Math.random() < this.crit;
    const finalDamage = isCrit ? this.damage * this.critDamage : this.damage;
    const impactX = this.target.pixelX;
    const impactY = this.target.pixelY;

    this.target.takeDamage(finalDamage);
    this.results.push({
      type: 'hit',
      x: impactX,
      y: impactY,
      damage: finalDamage,
      color: this.color,
      isCrit,
    });

    if (this.slow > 0) {
      this.target.applySlow(this.slow, this.slowDuration);
    }

    if (this.splash > 0) {
      const splashHit = [];
      for (const enemy of this.allEnemies) {
        if (!enemy.alive || enemy === this.target) continue;
        const ddx = enemy.pixelX - impactX;
        const ddy = enemy.pixelY - impactY;
        if (Math.hypot(ddx, ddy) <= this.splash * DEFAULT_GRID_SIZE) {
          enemy.takeDamage(this.splashDamage);
          splashHit.push(enemy);
        }
      }
      this.results.push({ type: 'splash', x: impactX, y: impactY, color: this.color, targets: splashHit });
    }

    if (this.chain > 0) {
      let lastTarget = this.target;
      let remaining = this.chain;
      while (remaining > 0) {
        let closest = null;
        let closestDist = this.chain * DEFAULT_GRID_SIZE;
        for (const enemy of this.allEnemies) {
          if (!enemy.alive) continue;
          if (this.results.some(r => r.type === 'chain' && r.targets?.includes(enemy))) continue;
          if (enemy === lastTarget) continue;
          const ddx = enemy.pixelX - lastTarget.pixelX;
          const ddy = enemy.pixelY - lastTarget.pixelY;
          const d = Math.hypot(ddx, ddy);
          if (d < closestDist) {
            closest = enemy;
            closestDist = d;
          }
        }
        if (!closest) break;
        closest.takeDamage(this.chainDamage);
        const cx = (lastTarget.pixelX + closest.pixelX) / 2;
        const cy = (lastTarget.pixelY + closest.pixelY) / 2;
        this.results.push({ type: 'chain', x: cx, y: cy, color: '#facc15', targets: [closest] });
        lastTarget = closest;
        remaining--;
      }
    }
  }
}
