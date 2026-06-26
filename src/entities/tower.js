import { TOWER_TYPES, DEFAULT_GRID_SIZE } from '../config.js';

export class Tower {
  constructor(typeId, tileX, tileY) {
    const def = TOWER_TYPES[typeId];
    this.typeId = typeId;
    this.name = def.name;
    this.icon = def.icon;
    this.tileX = tileX;
    this.tileY = tileY;
    this.pixelX = tileX * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    this.pixelY = tileY * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    this.range = def.range;
    this.fireRate = def.fireRate;
    this.level = 1;
    this.damage = def.damage;
    this.color = def.color;
    this.splash = def.splash || 0;
    this.splashDamage = def.splashDamage || 0;
    this.slow = def.slow || 0;
    this.slowDuration = def.slowDuration || 0;
    this.chain = def.chain || 0;
    this.chainDamage = def.chainDamage || 0;
    this.crit = def.crit || 0;
    this.critDamage = def.critDamage || 0;

    this.fireCooldown = 0;
    this.target = null;
  }

  update(delta, enemies) {
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);

    this.target = this.findTarget(enemies);

    if (this.target && this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      return this.fire();
    }
    return null;
  }

  findTarget(enemies) {
    let best = null;
    let bestProgress = -1;
    const rangePx = this.range * DEFAULT_GRID_SIZE;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pixelX - this.pixelX;
      const dy = enemy.pixelY - this.pixelY;
      const dist = Math.hypot(dx, dy);
      if (dist <= rangePx && enemy.waypointIndex > bestProgress) {
        best = enemy;
        bestProgress = enemy.waypointIndex;
      }
    }
    return best;
  }

  fire() {
    return {
      typeId: this.typeId,
      fromX: this.pixelX,
      fromY: this.pixelY,
      target: this.target,
      damage: this.damage,
      color: this.color,
      splash: this.splash,
      splashDamage: this.splashDamage * this.damage,
      slow: this.slow,
      slowDuration: this.slowDuration,
      chain: this.chain,
      chainDamage: this.chainDamage * this.damage,
      crit: this.crit,
      critDamage: this.critDamage,
    };
  }

  upgrade() {
    const def = TOWER_TYPES[this.typeId];
    this.level++;
    this.damage = Math.round(def.damage * Math.pow(def.upgradeMultiplier, this.level - 1));
    this.range += 0.5;
    this.fireRate *= 0.85;
    return Math.floor(def.cost * def.upgradeCostMultiplier * (this.level - 1));
  }
}
